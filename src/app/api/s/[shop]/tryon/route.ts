import { NextResponse } from "next/server";
import { getProvider, ProviderError, type GarmentCategory } from "@/server/tryon/provider";
import { secretsOf, settingsOf, shopBySlug, type ShopRow } from "@/server/shops";

// Photorealistic try-on for one shop. The browser sends the person photo and 1–3
// garment photos (as data: URLs, already downscaled); garments are applied one
// after another (bottoms, then tops, then outerwear) so a whole outfit can be worn.
// Nothing is stored here: photos only pass through to the shop's try-on service.

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_URL_BYTES = 4_000_000;
const MAX_ITEMS = 3;

// Per shop and client, per day. In memory: resets on restart; use a KV store in production.
const usage = new Map<string, { day: string; n: number }>();
const today = () => new Date().toISOString().slice(0, 10);
const clientOf = (req: Request, shop: ShopRow) => `${shop.id}|${req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local"}`;
function remaining(client: string, limit: number) {
  const u = usage.get(client);
  return limit - (u && u.day === today() ? u.n : 0);
}
function count(client: string) {
  const u = usage.get(client);
  usage.set(client, { day: today(), n: (u && u.day === today() ? u.n : 0) + 1 });
}

async function providerFor(shop: ShopRow) {
  const s = settingsOf(shop);
  if (!s.features.realTryOn) return null;
  return getProvider(s.tryonProvider, (await secretsOf(shop)).tryonKey);
}

type Ctx = { params: Promise<{ shop: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const shop = await shopBySlug((await params).shop);
  if (!shop) return NextResponse.json({ error: "Store not found." }, { status: 404 });
  const p = await providerFor(shop);
  const limit = settingsOf(shop).tryonDailyLimit;
  return NextResponse.json({ configured: !!p, provider: p?.name ?? null, remaining: remaining(clientOf(req, shop), limit), dailyLimit: limit });
}

interface Item { garment: string; extra?: string[]; category: GarmentCategory; layer: number; description?: string }

const isImageRef = (s: unknown): s is string =>
  typeof s === "string" && s.length < MAX_URL_BYTES && (/^data:image\/(png|jpe?g|webp);base64,/.test(s) || /^https:\/\//.test(s));

export async function POST(req: Request, { params }: Ctx) {
  const shop = await shopBySlug((await params).shop);
  if (!shop) return NextResponse.json({ error: "Store not found." }, { status: 404 });
  const provider = await providerFor(shop);
  if (!provider) return NextResponse.json({ error: "This store hasn't set up photo try-on yet." }, { status: 501 });
  const limit = settingsOf(shop).tryonDailyLimit;

  const client = clientOf(req, shop);
  if (remaining(client, limit) <= 0) return NextResponse.json({ error: `Daily limit reached (${limit} looks). Try again tomorrow.`, remaining: 0 }, { status: 429 });

  let body: { person?: unknown; items?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const items = (Array.isArray(body.items) ? body.items : []) as Item[];
  if (!isImageRef(body.person)) return NextResponse.json({ error: "Add a photo of the person first." }, { status: 400 });
  if (items.length < 1 || items.length > MAX_ITEMS || !items.every((i) => isImageRef(i.garment) && (i.category === "tops" || i.category === "bottoms") && (i.extra === undefined || (Array.isArray(i.extra) && i.extra.length <= 2 && i.extra.every(isImageRef)))))
    return NextResponse.json({ error: `Pick 1 to ${MAX_ITEMS} pieces with photos.` }, { status: 400 });

  count(client);
  try {
    let person = body.person;
    const ordered = [...items].sort((a, b) => a.layer - b.layer);
    if (provider.runAll) {
      person = await provider.runAll(person, ordered.map((it) => ({ garment: it.garment, extra: it.extra, category: it.category, description: it.description })));
    } else {
      for (const it of ordered) person = await provider.run({ person, garment: it.garment, category: it.category, description: it.description });
    }
    let image = person;
    if (/^https:\/\//.test(person)) {
      const r = await fetch(person);
      if (!r.ok) throw new ProviderError("Couldn't download the result.");
      const type = r.headers.get("content-type") ?? "image/jpeg";
      image = `data:${type};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
    }
    return NextResponse.json({ image, provider: provider.name, remaining: remaining(client, limit) });
  } catch (e) {
    const msg = e instanceof ProviderError ? e.message : "The try-on service didn't respond. Try again in a minute.";
    return NextResponse.json({ error: msg, remaining: remaining(client, limit) }, { status: 502 });
  }
}
