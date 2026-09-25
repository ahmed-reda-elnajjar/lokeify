import { startCustomerSession, validEmail } from "@/server/auth";
import { hashPassword } from "@/server/crypto";
import { body, fail, ok } from "@/server/http";
import { createCustomer, customerByEmail, shopBySlug } from "@/server/shops";

export async function POST(req: Request, { params }: { params: Promise<{ shop: string }> }) {
  const shop = await shopBySlug((await params).shop);
  if (!shop) return fail("Store not found.", 404);
  const b = await body<{ name?: string; email?: string; password?: string }>(req);
  const name = (b?.name ?? "").trim();
  if (!name) return fail("Tell us your name.");
  if (!validEmail(b?.email)) return fail("Enter a valid email address.");
  if (typeof b?.password !== "string" || b.password.length < 6) return fail("Passwords are at least 6 characters.");
  if (await customerByEmail(shop.id, b.email)) return fail("You already have an account here. Sign in instead.");
  const c = await createCustomer(shop.id, { email: b.email, name: name.slice(0, 80), passwordHash: hashPassword(b.password) });
  await startCustomerSession(shop, c.id);
  return ok({ customer: { email: c.email, name: c.name, fit: null }, orders: [] });
}
