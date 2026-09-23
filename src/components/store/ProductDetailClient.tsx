"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { recommendSize } from "@/lib/sizeRecommendation";
import { useAvatarStore } from "@/lib/store/avatarStore";
import { useCartStore } from "@/lib/store/cartStore";
import { useTryOnStore } from "@/lib/store/tryOnStore";
import ProductImagePlaceholder from "@/components/store/ProductImagePlaceholder";
import SizeSelector from "@/components/store/SizeSelector";
import ColorSelector from "@/components/store/ColorSelector";
import SizeRecommendationBadge from "@/components/store/SizeRecommendationBadge";

export default function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const generated = useAvatarStore((s) => s.generated);
  const measurements = useAvatarStore((s) => s.measurements);
  const addItem = useCartStore((s) => s.addItem);
  const setTryOn = useTryOnStore((s) => s.setTryOn);

  const [size, setSize] = useState(product.sizes[1] ?? product.sizes[0]);
  const [color, setColor] = useState(product.colors[0]);
  const [added, setAdded] = useState(false);

  const recommendation = useMemo(
    () => (generated ? recommendSize(measurements, product) : null),
    [generated, measurements, product]
  );

  const handleTryOn = () => {
    setTryOn(product.category, color, product.name);
    router.push("/avatar");
  };

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      size,
      color,
      quantity: 1,
      accentHex: product.accentHex,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
      <ProductImagePlaceholder
        category={product.category}
        accentHex={product.accentHex}
        className="aspect-[4/5] w-full rounded-2xl border border-border"
      />

      <div>
        <p className="text-xs text-muted">{product.brand}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {product.name}
        </h1>
        <p className="mt-3 text-lg text-muted">
          {formatPrice(product.price, product.currency)}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {product.description}
        </p>

        <button
          type="button"
          onClick={handleTryOn}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full gradient-bg py-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.01] sm:w-auto sm:px-8"
        >
          <span>🧍</span> Try On My Avatar
        </button>

        <div className="mt-8">
          <p className="mb-2 text-sm font-medium">Color</p>
          <ColorSelector
            colors={product.colors}
            selected={color}
            onSelect={setColor}
          />
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium">Size</p>
          <SizeSelector
            sizes={product.sizes}
            selected={size}
            recommended={recommendation?.size}
            onSelect={setSize}
          />
        </div>

        <div className="mt-6">
          <SizeRecommendationBadge recommendation={recommendation} />
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className="mt-6 w-full rounded-full border border-border py-3.5 text-sm font-medium transition-colors hover:border-brand sm:w-auto sm:px-8"
        >
          {added ? "Added to Cart ✓" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
