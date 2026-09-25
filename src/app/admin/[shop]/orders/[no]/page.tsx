import { notFound } from "next/navigation";
import { ownedShop } from "@/server/auth";
import { customerById, orderByNo, ordersOfCustomer } from "@/server/shops";
import OrderView from "@/admin/views/OrderView";

export const metadata = { title: "Order" };

export default async function OrderPage({ params }: { params: Promise<{ shop: string; no: string }> }) {
  const { shop: slug, no } = await params;
  const owned = await ownedShop(slug);
  if (!owned) notFound();
  const order = await orderByNo(owned.shop.id, `#${decodeURIComponent(no)}`);
  if (!order) notFound();
  const customer = order.customerId ? await customerById(owned.shop.id, order.customerId) : null;
  return <OrderView initial={order} customerOrders={customer ? (await ordersOfCustomer(owned.shop.id, customer.id)).length : 0} />;
}
