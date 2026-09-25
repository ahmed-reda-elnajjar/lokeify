import { startCustomerSession } from "@/server/auth";
import { verifyPassword } from "@/server/crypto";
import { body, fail, ok } from "@/server/http";
import { customerByEmail, customerFit, ordersOfCustomer, shopBySlug } from "@/server/shops";

export async function POST(req: Request, { params }: { params: Promise<{ shop: string }> }) {
  const shop = await shopBySlug((await params).shop);
  if (!shop) return fail("Store not found.", 404);
  const b = await body<{ email?: string; password?: string }>(req);
  const c = b?.email ? await customerByEmail(shop.id, b.email) : null;
  if (!c || typeof b?.password !== "string" || !verifyPassword(b.password, c.password)) return fail("Wrong email or password.", 401);
  await startCustomerSession(shop, c.id);
  return ok({ customer: { email: c.email, name: c.name, fit: customerFit(c) }, orders: await ordersOfCustomer(shop.id, c.id) });
}
