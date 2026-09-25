"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FulfillmentStatus, OrderRecord, PaymentStatus } from "@/shared/shop";
import { useAdmin, useMoney } from "../context";
import { api, adminUrl } from "../api";
import { Badge, Button, Card, PageHeader, statusTone } from "../ui";

const NEXT: Partial<Record<FulfillmentStatus, { to: FulfillmentStatus; label: string }>> = {
  Processing: { to: "In transit", label: "Mark as shipped" },
  "In transit": { to: "Delivered", label: "Mark as delivered" },
};

export default function OrderView({ initial, customerOrders }: { initial: OrderRecord; customerOrders: number }) {
  const { shop } = useAdmin();
  const money = useMoney();
  const router = useRouter();
  const [o, setO] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const update = async (patch: { status?: FulfillmentStatus; paymentStatus?: PaymentStatus }, confirm?: string) => {
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ order: OrderRecord }>(adminUrl(shop.slug, `/orders/${encodeURIComponent(o.no.slice(1))}`), { method: "PATCH", body: JSON.stringify(patch) });
      setO(r.order);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't update the order.");
    } finally {
      setBusy(false);
    }
  };

  const next = NEXT[o.status];
  const a = o.address;

  return (
    <>
      <PageHeader
        title={<span className="flex items-center gap-2">{o.no} <Badge tone={statusTone(o.paymentStatus)}>{o.paymentStatus}</Badge> <Badge tone={statusTone(o.status)}>{o.status}</Badge></span>}
        sub={new Date(o.createdAt).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}
        back={{ href: `/admin/${shop.slug}/orders`, label: "Back to orders" }}
        actions={next && <Button kind="primary" disabled={busy} onClick={() => void update({ status: next.to })}>{next.label}</Button>}
      />
      {err && <p className="mb-3 text-sm text-red-700">{err}</p>}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card title={`Items · ${o.itemCount}`}>
            <ul className="-my-2">
              {o.lines.map((l, i) => (
                <li key={i} className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
                  <div>
                    <a href={`/admin/${shop.slug}/products/${encodeURIComponent(l.productId)}`} className="font-medium hover:underline">{l.name}</a>
                    <div className="text-xs text-muted">{[l.colour, l.size].filter(Boolean).join(" · ")}</div>
                  </div>
                  <div className="text-right text-sm tabular-nums">
                    {money(l.price)} × {l.qty}
                    <div className="font-medium">{money(l.price * l.qty)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Payment">
            <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
              <dt className="text-muted">Subtotal</dt><dd className="text-right tabular-nums">{money(o.subtotal)}</dd>
              <dt className="text-muted">Shipping ({o.shipMethod})</dt><dd className="text-right tabular-nums">{o.shipping ? money(o.shipping) : "Free"}</dd>
              <dt className="text-muted">VAT included</dt><dd className="text-right tabular-nums">{money(o.tax)}</dd>
              <dt className="font-semibold">Total</dt><dd className="text-right font-semibold tabular-nums">{money(o.total)}</dd>
              <dt className="text-muted">Paid with</dt><dd className="text-right capitalize">{o.payMethod} (test mode)</dd>
            </dl>
            {o.paymentStatus === "Paid" && o.status !== "Cancelled" && (
              <Button className="mt-3" kind="secondary" disabled={busy} onClick={() => void update({ paymentStatus: "Refunded", status: "Returned" }, "Mark this order as returned and refunded?")}>Refund & mark returned</Button>
            )}
          </Card>
        </div>
        <div className="flex flex-col gap-4">
          <Card title="Customer">
            <div className="text-sm">
              <div className="font-medium">{o.name || "—"}</div>
              <a href={`mailto:${o.email}`} className="text-accent hover:underline">{o.email}</a>
              <div className="mt-1 text-muted">{customerOrders > 1 ? `${customerOrders} orders` : "First order"}</div>
            </div>
          </Card>
          <Card title="Shipping address">
            {a ? (
              <address className="text-sm not-italic leading-relaxed">
                {a.first} {a.last}<br />{a.address}<br />{[a.postcode, a.city].filter(Boolean).join(" ")}<br />{a.country}{a.phone && <><br />{a.phone}</>}
              </address>
            ) : (
              <p className="text-sm text-muted">Store pickup — no delivery.</p>
            )}
          </Card>
          <Card title="Fulfillment">
            <div className="flex flex-col gap-2">
              {(["Processing", "In transit", "Delivered", "Returned"] as FulfillmentStatus[]).map((s) => (
                <Button key={s} kind={o.status === s ? "primary" : "secondary"} disabled={busy || o.status === "Cancelled"} onClick={() => void update({ status: s })}>{s}</Button>
              ))}
              {o.status !== "Cancelled" && (
                <Button kind="danger" disabled={busy} onClick={() => void update({ status: "Cancelled" }, "Cancel this order? Its items go back into stock.")}>Cancel order</Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
