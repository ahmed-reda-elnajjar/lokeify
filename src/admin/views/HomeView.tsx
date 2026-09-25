"use client";

import Link from "next/link";
import type { OrderRecord } from "@/shared/shop";
import { useAdmin, useMoney } from "../context";
import { Badge, Card, EmptyState, LinkButton, PageHeader, statusTone } from "../ui";

interface Stats { orders30: number; revenue30: number; toFulfil: number; customers: number; products: number; subscribers: number; byDay: { day: string; revenue: number; n: number }[] }

export default function HomeView({ name, stats, recent, setup }: { name: string; stats: Stats; recent: OrderRecord[]; setup: { done: boolean; label: string; href: string }[] }) {
  const { shop } = useAdmin();
  const money = useMoney();
  const base = `/admin/${shop.slug}`;
  const left = setup.filter((s) => !s.done).length;

  // Last 30 days, one bar per day.
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10);
    return { day: d, revenue: stats.byDay.find((x) => x.day === d)?.revenue ?? 0 };
  });
  const max = Math.max(1, ...days.map((d) => d.revenue));

  return (
    <>
      <PageHeader title={`Good to see you, ${name}`} sub={<>Your store is live at <a className="text-accent hover:underline" href={`/s/${shop.slug}`} target="_blank" rel="noreferrer">/s/{shop.slug}</a></>} actions={<LinkButton href={`/s/${shop.slug}`} newTab>View store ↗</LinkButton>} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Sales · 30 days", money(stats.revenue30)],
          ["Orders · 30 days", String(stats.orders30)],
          ["To fulfil", String(stats.toFulfil)],
          ["Customers", String(stats.customers)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-border bg-surface px-4 py-3">
            <div className="text-xs text-muted">{l}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Sales, last 30 days" className="lg:col-span-2">
          <div className="flex h-40 items-end gap-[3px]" role="img" aria-label="Daily sales for the last 30 days">
            {days.map((d) => (
              <div key={d.day} className="group relative flex-1">
                <div className="w-full rounded-t bg-accent/80 transition group-hover:bg-accent" style={{ height: `${Math.max(2, (d.revenue / max) * 150)}px`, opacity: d.revenue ? 1 : 0.25 }} />
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[11px] text-white group-hover:block">
                  {d.day.slice(5)} · {money(d.revenue)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted"><span>{days[0].day.slice(5)}</span><span>Today</span></div>
        </Card>

        <Card title={left ? `Set up your store · ${left} left` : "Setup complete"}>
          <ul className="flex flex-col gap-2">
            {setup.map((s) => (
              <li key={s.label}>
                <Link href={base + s.href} className="flex items-start gap-2 text-sm hover:underline">
                  <span className={s.done ? "text-accent" : "text-muted"} aria-hidden>{s.done ? "✓" : "○"}</span>
                  <span className={s.done ? "text-muted line-through" : ""}>{s.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 text-xs text-muted">{stats.products} products · {stats.subscribers} newsletter sign-ups</div>
        </Card>
      </div>

      <Card title="Recent orders" action={<Link href={`${base}/orders`} className="text-sm text-accent hover:underline">All orders</Link>} className="mt-4">
        {recent.length === 0 ? (
          <EmptyState title="No orders yet" body="When customers check out, their orders show up here." action={<LinkButton href={`/s/${shop.slug}`} newTab>Open your store</LinkButton>} />
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-t border-border first:border-t-0">
                    <td className="px-5 py-2.5 font-medium"><Link href={`${base}/orders/${encodeURIComponent(o.no.slice(1))}`} className="hover:underline">{o.no}</Link></td>
                    <td className="px-2 py-2.5 text-muted">{new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td>
                    <td className="px-2 py-2.5">{o.name || o.email}</td>
                    <td className="px-2 py-2.5"><Badge tone={statusTone(o.status)}>{o.status}</Badge></td>
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
