import { notFound } from "next/navigation";
import { ownedShop } from "@/server/auth";
import { getProduct } from "@/server/shops";
import ProductEditor from "@/admin/views/ProductEditor";

export const metadata = { title: "Product" };

export default async function ProductPage({ params }: { params: Promise<{ shop: string; id: string }> }) {
  const { shop: slug, id } = await params;
  const owned = await ownedShop(slug);
  if (!owned) notFound();
  const p = await getProduct(owned.shop.id, decodeURIComponent(id));
  if (!p) notFound();
  return <ProductEditor initial={p} />;
}
