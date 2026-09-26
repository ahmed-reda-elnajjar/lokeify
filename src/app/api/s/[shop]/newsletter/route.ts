import { validEmail } from "@/server/auth";
import { body, fail, ok, storeFor } from "@/server/http";
import { addSubscriber } from "@/server/shops";

export async function POST(req: Request, { params }: { params: Promise<{ shop: string }> }) {
  const shop = await storeFor(params);
  if (!shop) return fail("Store not found.", 404);
  const b = await body<{ email?: string }>(req);
  if (!validEmail(b?.email)) return fail("Enter a valid email address.");
  await addSubscriber(shop.id, b.email);
  return ok();
}
