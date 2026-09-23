import productsData from "@/data/products.json";
import { Product } from "@/types";
import ProductCard from "@/components/store/ProductCard";

const products = productsData as Product[];

export default function StorePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-wide text-muted">
          Demo storefront
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Store X</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          A fictional Egyptian streetwear brand, built to show how any store
          on Lokeify gets try-on and sizing for every product, out of the box.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
