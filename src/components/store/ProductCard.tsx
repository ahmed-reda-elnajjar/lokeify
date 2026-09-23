import Link from "next/link";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import ProductImagePlaceholder from "@/components/store/ProductImagePlaceholder";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/store/${product.id}`}
      className="group overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-brand"
    >
      <ProductImagePlaceholder
        category={product.category}
        accentHex={product.accentHex}
        className="aspect-[4/5] w-full transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <div className="p-4">
        <p className="text-xs text-muted">{product.brand}</p>
        <h3 className="mt-1 font-medium">{product.name}</h3>
        <p className="mt-2 text-sm text-muted">
          {formatPrice(product.price, product.currency)}
        </p>
      </div>
    </Link>
  );
}
