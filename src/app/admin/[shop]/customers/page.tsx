import { notFound } from "next/navigation";
import { ownedShop } from "@/server/auth";
import { listCustomers, subscriberCount } from "@/server/shops";
import CustomersView from "@/admin/views/CustomersView";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ params }: { params: Promise<{ shop: string }> }) {
  const owned = await ownedShop((await params).shop);
  if (!owned) notFound();
  const [customers, subscribers] = await Promise.all([listCustomers(owned.shop.id), subscriberCount(owned.shop.id)]);
  return <CustomersView customers={customers} subscribers={subscribers} />;
}
