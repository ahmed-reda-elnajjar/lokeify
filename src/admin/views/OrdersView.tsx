"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FulfillmentStatus, OrderRecord } from "@/shared/shop";
import { useAdmin, useMoney } from "../context";
import { Badge, Card, EmptyState, Input, LinkButton, PageHeader, cx, statusTone } from "../ui";

const TABS: ("All" | FulfillmentStatus)[] = ["All", "Processing", "In transit", "Delivered", "Returned", "Cancelled"];

export default function OrdersView({ orders }: { orders: OrderRecord[] }) {
  const { shop } = useAdmin();
  const money = useMoney();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [q, setQ] = useState("");
  const rows = useMemo(
    () => orders.filter((o) => (tab === "All" || o.status === tab) && (!q.trim() || `${o.no} ${o.email} ${o.name}`.toLowerCase().includes(q.trim().toLowerCase()))),
    [orders, tab, q],
  );
  const base = `/admin/${shop.slug}/orders`;

  return (
    <>
      <PageHeader title="Orders" sub={`${orders.length} orders`} />
      <Card>
        <div className="-mx-5 -mt-4 flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          <div className="flex flex-wrap rounded-lg bg-surface-2 p-0.5 text-sm">
            {TABS.map((k) => (
              <button key={k} className={cx("rounded-md px-3 py-1", tab === k && "bg-surface font-medium shadow-sm")} onClick={() => setTab(k)}>
                {k}
                {k !== "All" && <span className="ml-1 text-muted">{orders.filter((o) => o.status === k).length}</span>}
              </button>
            ))}
          </div>
          <Input className="max-w-xs" placeholder="Search order, name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {orders.length === 0 ? (
          <EmptyState title="Your orders will show here" body="Share your store link; when a customer checks out, the order lands here with their address and items." action={<LinkButton href={`/s/${shop.slug}`} newTab>Open your store</LinkButton>} />
        ) : rows.length === 0 ? (
          <EmptyState title="No orders match" body="Try another tab or search." />
        ) : (
          <div className="-mx-5 -mb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr className="border-b border-border">
                  <th className="px-5 py-2 font-medium">Order</th>
                  <th className="px-2 py-2 font-medium">Date</th>
                  <th className="px-2 py-2 font-medium">Customer</th>
                  <th className="px-2 py-2 font-medium">Payment</th>
                  <th className="px-2 py-2 font-medium">Fulfillment</th>
                  <th className="px-2 py-2 font-medium">Items</th>
                  <th className="px-5 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-surface-2/60">
                    <td className="px-5 py-2.5 font-medium"><Link href={`${base}/${encodeURIComponent(o.no.slice(1))}`} className="hover:underline">{o.no}</Link></td>
                    <td className="px-2 py-2.5 text-muted">{new Date(o.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-2 py-2.5">{o.name || o.email}</td>
                    <td className="px-2 py-2.5"><Badge tone={statusTone(o.paymentStatus)}>{o.paymentStatus}</Badge></td>
                    <td className="px-2 py-2.5"><Badge tone={statusTone(o.status)}>{o.status}</Badge></td>
                    <td className="px-2 py-2.5 text-muted">{o.itemCount}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{money(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
