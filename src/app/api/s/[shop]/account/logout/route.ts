import { endCustomerSession } from "@/server/auth";
import { fail, ok, storeFor } from "@/server/http";

export async function POST(_req: Request, { params }: { params: Promise<{ shop: string }> }) {
  const shop = await storeFor(params);
  if (!shop) return fail("Store not found.", 404);
  await endCustomerSession(shop);
  return ok();
}
