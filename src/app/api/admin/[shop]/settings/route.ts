import { adminShop, body, fail, ok, unauthorized } from "@/server/http";
import { secretsOf, setSecret, settingsOf, shopById, updateShop } from "@/server/shops";
import { cleanSettings } from "@/server/validate";
import type { ShopSettings } from "@/shared/shop";

type Ctx = { params: Promise<{ shop: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const a = await adminShop(params);
  if (!a) return unauthorized();
  const key = (await secretsOf(a.shop)).tryonKey;
  return ok({ name: a.shop.name, settings: settingsOf(a.shop), tryonKeySet: !!key, tryonKeyHint: key ? `…${key.slice(-4)}` : null });
}

/** Update the store name and settings. `tryonKey` sets (or with "" clears) the shop's try-on API key. */
export async function PATCH(req: Request, { params }: Ctx) {
  const a = await adminShop(params);
  if (!a) return unauthorized();
  const b = await body<{ name?: string; settings?: Partial<ShopSettings>; tryonKey?: string }>(req);
  if (!b) return fail("Invalid request.");
  if (b.name !== undefined && b.name.trim().length < 2) return fail("Store names need at least 2 characters.");
  await updateShop(a.shop.id, { name: b.name, settings: b.settings ? cleanSettings(b.settings) : undefined });
  if (typeof b.tryonKey === "string") await setSecret((await shopById(a.shop.id))!, "tryonKey", b.tryonKey.trim() || null);
  const row = (await shopById(a.shop.id))!;
  const key = (await secretsOf(row)).tryonKey;
  return ok({ name: row.name, settings: settingsOf(row), tryonKeySet: !!key, tryonKeyHint: key ? `…${key.slice(-4)}` : null });
}
