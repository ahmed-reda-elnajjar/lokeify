"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/store/cartStore";
import CartItemRow from "@/components/cart/CartItemRow";
import CartSummary from "@/components/cart/CartSummary";

export default function CartPage() {
  const items = useCartStore((s) => s.items);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Your Cart
      </h1>

      {items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-20 text-center">
          <span className="text-4xl">🛒</span>
          <p className="text-muted">Your cart is empty.</p>
          <Link
            href="/store"
            className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            Browse Store X
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {items.map((item) => (
              <CartItemRow
                key={`${item.productId}-${item.size}-${item.color.name}`}
                item={item}
              />
            ))}
          </div>
          <CartSummary items={items} />
        </div>
      )}
    </div>
  );
}
