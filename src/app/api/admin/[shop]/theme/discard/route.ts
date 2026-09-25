import { adminShop, ok, unauthorized } from "@/server/http";
import { discardTheme } from "@/server/shops";

export async function POST(_req: Request, { params }: { params: Promise<{ shop: string }> }) {
  const a = await adminShop(params);
  if (!a) return unauthorized();
  await discardTheme(a.shop.id);
  return ok();
}
