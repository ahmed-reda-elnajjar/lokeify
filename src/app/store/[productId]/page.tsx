import { notFound } from "next/navigation";
import productsData from "@/data/products.json";
import { Product } from "@/types";
import ProductDetailClient from "@/components/store/ProductDetailClient";

const products = productsData as Product[];

export function generateStaticParams() {
  return products.map((p) => ({ productId: p.id }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = products.find((p) => p.id === productId);

  if (!product) notFound();

  return <ProductDetailClient product={product} />;
}
