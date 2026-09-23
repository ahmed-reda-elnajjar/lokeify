"use client";

import { CartItem } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cartStore";
import ProductImagePlaceholder from "@/components/store/ProductImagePlaceholder";
import productsData from "@/data/products.json";
import { Product } from "@/types";

const products = productsData as Product[];

export default function CartItemRow({ item }: { item: CartItem }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const product = products.find((p) => p.id === item.productId);

  return (
    <div className="flex gap-4 rounded-xl border border-border bg-surface p-4">
      <ProductImagePlaceholder
        category={product?.category ?? "tshirt"}
        accentHex={item.accentHex}
        className="h-24 w-20 flex-shrink-0 rounded-lg"
      />

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-muted">
              {item.color.name} · Size {item.size}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeItem(item.productId, item.size, item.color.name)}
            className="text-xs text-muted transition-colors hover:text-accent"
          >
            Remove
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                updateQuantity(
                  item.productId,
                  item.size,
                  item.color.name,
                  item.quantity - 1
                )
              }
              className="h-7 w-7 rounded-full border border-border text-sm transition-colors hover:border-brand"
            >
              −
            </button>
            <span className="w-6 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              onClick={() =>
                updateQuantity(
                  item.productId,
                  item.size,
                  item.color.name,
                  item.quantity + 1
                )
              }
              className="h-7 w-7 rounded-full border border-border text-sm transition-colors hover:border-brand"
            >
              +
            </button>
          </div>
          <p className="text-sm font-medium">
            {formatPrice(item.price * item.quantity, item.currency)}
          </p>
        </div>
      </div>
    </div>
  );
}
