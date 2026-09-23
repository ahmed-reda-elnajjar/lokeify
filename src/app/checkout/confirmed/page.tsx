"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/utils";

function ConfirmedContent() {
  const params = useSearchParams();
  const order = params.get("order") ?? "LK-000000";
  const total = Number(params.get("total") ?? 0);
  const currency = params.get("currency") ?? "EGP";
  const itemCount = params.get("items") ?? "0";
  const name = params.get("name") ?? "there";

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-5 px-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-3xl">
        ✓
      </div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Order Confirmed
      </h1>
      <p className="text-muted">
        Thanks, {name}! Your order{" "}
        <span className="font-mono text-foreground">{order}</span> has been
        placed.
      </p>

      <div className="w-full rounded-xl border border-border bg-surface p-5 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Items</span>
          <span>{itemCount}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border pt-2 font-medium">
          <span>Total paid</span>
          <span>{formatPrice(total, currency)}</span>
        </div>
      </div>

      <p className="text-xs text-muted">
        This is a prototype order — no real payment was processed and nothing
        will be shipped.
      </p>

      <div className="mt-2 flex gap-3">
        <Link
          href="/store"
          className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Continue Shopping
        </Link>
        <Link
          href="/"
          className="rounded-full border border-foreground px-6 py-3 text-sm font-medium transition-colors hover:bg-surface-2"
        >
          Back Home
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmedPage() {
  return (
    <Suspense fallback={<div className="h-[60vh]" />}>
      <ConfirmedContent />
    </Suspense>
  );
}
