import { notFound } from "next/navigation";
import { ownedShop } from "@/server/auth";
import { listOrders } from "@/server/shops";
import OrdersView from "@/admin/views/OrdersView";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ params }: { params: Promise<{ shop: string }> }) {
  const owned = await ownedShop((await params).shop);
  if (!owned) notFound();
  return <OrdersView orders={await listOrders(owned.shop.id)} />;
}
