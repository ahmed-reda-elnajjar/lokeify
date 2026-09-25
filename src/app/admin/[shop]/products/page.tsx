import { notFound } from "next/navigation";
import { ownedShop } from "@/server/auth";
import { listProducts } from "@/server/shops";
import ProductsView from "@/admin/views/ProductsView";

export const metadata = { title: "Products" };

export default async function ProductsPage({ params }: { params: Promise<{ shop: string }> }) {
  const owned = await ownedShop((await params).shop);
  if (!owned) notFound();
  return <ProductsView products={await listProducts(owned.shop.id)} />;
}
