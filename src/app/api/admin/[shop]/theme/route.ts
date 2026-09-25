import { adminShop, body, fail, ok, unauthorized } from "@/server/http";
import { saveThemeDraft, themeOf } from "@/server/shops";
import type { ThemeContent } from "@/shared/shop";

type Ctx = { params: Promise<{ shop: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const a = await adminShop(params);
  if (!a) return unauthorized();
  return ok({ draft: themeOf(a.shop, "draft"), published: themeOf(a.shop, "published") });
}

/** Save the theme draft (customers keep seeing the published theme until you publish). */
export async function PUT(req: Request, { params }: Ctx) {
  const a = await adminShop(params);
  if (!a) return unauthorized();
  const b = await body<ThemeContent>(req);
  if (!b || !Array.isArray(b.sections) || typeof b.hero !== "object" || typeof b.wear !== "object") return fail("Invalid theme.");
  if (JSON.stringify(b).length > 200_000) return fail("Theme too large.");
  await saveThemeDraft(a.shop.id, { sections: b.sections, hero: b.hero, wear: b.wear });
  return ok();
}
