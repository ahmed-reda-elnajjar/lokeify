import { currentCustomer } from "@/server/auth";
import { body, fail, ok, storeFor } from "@/server/http";
import { customerFit, ordersOfCustomer, saveCustomerFit } from "@/server/shops";

type Ctx = { params: Promise<{ shop: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const shop = await storeFor(params);
  if (!shop) return fail("Store not found.", 404);
  const c = await currentCustomer(shop);
  if (!c) return ok({ customer: null });
  return ok({ customer: { email: c.email, name: c.name, fit: customerFit(c) }, orders: await ordersOfCustomer(shop.id, c.id) });
}

/** Save the signed-in customer's fit profile (height, weight, measurements). */
export async function PATCH(req: Request, { params }: Ctx) {
  const shop = await storeFor(params);
  if (!shop) return fail("Store not found.", 404);
  const c = await currentCustomer(shop);
  if (!c) return fail("Sign in first.", 401);
  const b = await body<{ fit?: Record<string, unknown> }>(req);
  const fit = Object.fromEntries(Object.entries(b?.fit ?? {}).filter(([k, v]) => /^[a-z]{1,12}$/i.test(k) && typeof v === "number" && v > 0 && v < 400));
  await saveCustomerFit(shop.id, c.id, fit);
  return ok();
}
