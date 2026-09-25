import { adminShop, body, fail, ok, unauthorized } from "@/server/http";
import { updateOrder } from "@/server/shops";
import type { FulfillmentStatus, PaymentStatus } from "@/shared/shop";

const STATUSES: FulfillmentStatus[] = ["Processing", "In transit", "Delivered", "Returned", "Cancelled"];
const PAYMENTS: PaymentStatus[] = ["Paid", "Pending", "Refunded"];

/** `no` is the order number without the "#", e.g. CR-1004. */
export async function PATCH(req: Request, { params }: { params: Promise<{ shop: string; no: string }> }) {
  const a = await adminShop(params);
  if (!a) return unauthorized();
  const b = await body<{ status?: FulfillmentStatus; paymentStatus?: PaymentStatus }>(req);
  if (!b || (b.status && !STATUSES.includes(b.status)) || (b.paymentStatus && !PAYMENTS.includes(b.paymentStatus))) return fail("Invalid status.");
  const o = await updateOrder(a.shop.id, `#${decodeURIComponent((await params).no)}`, b);
  return o ? ok({ order: o }) : fail("Order not found.", 404);
}
