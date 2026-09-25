import { currentCustomer, validEmail } from "@/server/auth";
import { body, fail, ok } from "@/server/http";
import { OrderError, ordersOfCustomer, placeOrder, shopBySlug, type PlaceOrderInput } from "@/server/shops";
import type { OrderAddress } from "@/shared/shop";

type Ctx = { params: Promise<{ shop: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const shop = await shopBySlug((await params).shop);
  if (!shop) return fail("Store not found.", 404);
  const c = await currentCustomer(shop);
  return ok({ orders: c ? await ordersOfCustomer(shop.id, c.id) : [] });
}

/** Checkout. Payment runs in test mode: the order is recorded as paid, nothing is charged. */
export async function POST(req: Request, { params }: Ctx) {
  const shop = await shopBySlug((await params).shop);
  if (!shop) return fail("Store not found.", 404);
  const c = await currentCustomer(shop);
  if (!c) return fail("Sign in to check out.", 401);
  const b = await body<Partial<PlaceOrderInput>>(req);
  if (!b || !Array.isArray(b.lines)) return fail("Invalid order.");
  if (!validEmail(b.email)) return fail("Enter a valid email.");
  const ship = b.shipMethod === "express" || b.shipMethod === "pickup" ? b.shipMethod : "standard";
  const a = b.address as Partial<OrderAddress> | null | undefined;
  const address: OrderAddress | null =
    ship === "pickup" || !a
      ? null
      : { first: String(a.first ?? "").slice(0, 80), last: String(a.last ?? "").slice(0, 80), address: String(a.address ?? "").slice(0, 200), city: String(a.city ?? "").slice(0, 80), postcode: String(a.postcode ?? "").slice(0, 20), country: String(a.country ?? "").slice(0, 60), phone: a.phone ? String(a.phone).slice(0, 30) : undefined };
  if (ship !== "pickup" && (!address?.address || !address.city)) return fail("Add a delivery address.");
  try {
    const order = await placeOrder(shop, c.id, {
      lines: b.lines.slice(0, 50).map((l) => ({ productId: String(l.productId), size: String(l.size), colour: String(l.colour ?? ""), qty: Number(l.qty) })),
      email: b.email,
      name: String(b.name ?? c.name).slice(0, 120),
      shipMethod: ship,
      payMethod: String(b.payMethod ?? "card").slice(0, 20),
      address,
    });
    return ok({ order });
  } catch (e) {
    return fail(e instanceof OrderError ? e.message : "We couldn't place the order. Try again.", e instanceof OrderError ? 409 : 500);
  }
}
