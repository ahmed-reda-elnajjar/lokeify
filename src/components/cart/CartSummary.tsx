import Link from "next/link";
import { CartItem } from "@/types";
import { formatPrice } from "@/lib/utils";

export const SHIPPING_FEE = 60;

export default function CartSummary({ items }: { items: CartItem[] }) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = items.length > 0 ? SHIPPING_FEE : 0;
  const total = subtotal + shipping;
  const currency = items[0]?.currency ?? "EGP";

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-sm font-medium text-muted">Order Summary</h2>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
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
      <Link
        href="/checkout"
        className="mt-5 block rounded-full bg-brand py-3 text-center text-sm font-medium text-white transition-colors hover:bg-brand-dark"
      >
        Checkout
      </Link>
    </div>
  );
}
