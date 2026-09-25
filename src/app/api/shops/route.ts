import { currentMerchant } from "@/server/auth";
import { demoProducts, demoTheme } from "@/server/seed";
import { createShop, slugAvailable } from "@/server/shops";
import { body, fail, ok, unauthorized } from "@/server/http";
import { CURRENCIES, slugify } from "@/shared/shop";

/** Is this store address free? */
export async function GET(req: Request) {
  const slug = slugify(new URL(req.url).searchParams.get("slug") ?? "");
  return ok({ slug, available: await slugAvailable(slug) });
}

/** Open another store on the signed-in merchant's account. */
export async function POST(req: Request) {
  const me = await currentMerchant();
  if (!me) return unauthorized();
  const b = await body<{ storeName?: string; slug?: string; currency?: string; demo?: boolean }>(req);
  const storeName = (b?.storeName ?? "").trim();
  const slug = slugify(b?.slug || storeName);
  if (storeName.length < 2) return fail("Give your store a name.");
  if (!(await slugAvailable(slug))) return fail(`The address /s/${slug || "…"} is taken or not allowed.`);
  const currency = CURRENCIES.includes(b?.currency as (typeof CURRENCIES)[number]) ? b!.currency! : "EGP";
  try {
    const shop = await createShop(me.id, {
      name: storeName, slug, currency,
      ...(b?.demo ? { products: demoProducts(), theme: { ...demoTheme(), hero: { ...demoTheme().hero, title: storeName.toUpperCase() } } } : {}),
    });
    return ok({ slug: shop.slug });
  } catch (e) {
    if (e instanceof Error && /UNIQUE/i.test(e.message)) return fail(`The address /s/${slug} was just taken. Try another.`);
    throw e;
  }
}
