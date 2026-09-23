"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/lib/store/cartStore";
import { SHIPPING_FEE } from "@/components/cart/CartSummary";
import { formatPrice } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = items.length > 0 ? SHIPPING_FEE : 0;
  const total = subtotal + shipping;
  const currency = items[0]?.currency ?? "EGP";
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
        <span className="text-4xl">🛒</span>
        <h1 className="text-xl font-semibold">Your cart is empty</h1>
        <Link
          href="/store"
          className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Browse Store X
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const orderId = `LK-${Math.floor(100000 + Math.random() * 900000)}`;

    setTimeout(() => {
      clearCart();
      const params = new URLSearchParams({
        order: orderId,
        total: String(total),
        currency,
        items: String(itemCount),
        name: fullName || "there",
      });
      router.push(`/checkout/confirmed?${params.toString()}`);
    }, 900);
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_300px]">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Checkout
        </h1>
        <p className="mt-1 text-sm text-muted">
          Demo checkout — no real payment is processed.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-medium">Shipping details</h2>
            <div className="space-y-3">
              <input
                required
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-brand"
              />
              <input
                required
                placeholder="Address"
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-brand"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="City"
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-brand"
                />
                <input
                  required
                  placeholder="Phone"
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-brand"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-medium">Payment</h2>
            <div className="space-y-3">
              <input
                required
                placeholder="Card number"
                inputMode="numeric"
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-brand"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="MM / YY"
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-brand"
                />
                <input
                  required
                  placeholder="CVV"
                  inputMode="numeric"
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-brand"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">
              This is a prototype — payment fields are cosmetic only.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-brand py-3.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60 sm:w-auto sm:px-10"
          >
            {submitting ? "Placing order..." : `Place Order — ${formatPrice(total, currency)}`}
          </button>
        </form>
      </div>

      <div className="h-fit rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-medium text-muted">Order Summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Items ({itemCount})</span>
            <span>{formatPrice(subtotal, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Shipping</span>
            <span>{formatPrice(shipping, currency)}</span>
          </div>
        </div>
        <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-semibold">
          <span>Total</span>
          <span>{formatPrice(total, currency)}</span>
        </div>
      </div>
    </div>
  );
}
