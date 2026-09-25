import { endCustomerSession } from "@/server/auth";
import { fail, ok } from "@/server/http";
import { shopBySlug } from "@/server/shops";

export async function POST(_req: Request, { params }: { params: Promise<{ shop: string }> }) {
  const shop = await shopBySlug((await params).shop);
  if (!shop) return fail("Store not found.", 404);
  await endCustomerSession(shop);
  return ok();
}
