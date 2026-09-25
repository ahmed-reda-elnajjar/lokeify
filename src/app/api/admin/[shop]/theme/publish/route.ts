import { adminShop, ok, unauthorized } from "@/server/http";
import { publishTheme } from "@/server/shops";

export async function POST(_req: Request, { params }: { params: Promise<{ shop: string }> }) {
  const a = await adminShop(params);
  if (!a) return unauthorized();
  await publishTheme(a.shop.id);
  return ok();
}
