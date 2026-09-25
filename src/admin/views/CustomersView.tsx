"use client";

import { useMemo, useState } from "react";
import type { CustomerRecord } from "@/shared/shop";
import { useMoney } from "../context";
import { Card, EmptyState, Input, PageHeader } from "../ui";

export default function CustomersView({ customers, subscribers }: { customers: CustomerRecord[]; subscribers: number }) {
  const money = useMoney();
  const [q, setQ] = useState("");
  const rows = useMemo(() => customers.filter((c) => !q.trim() || `${c.name} ${c.email}`.toLowerCase().includes(q.trim().toLowerCase())), [customers, q]);
  return (
    <>
      <PageHeader title="Customers" sub={`${customers.length} accounts · ${subscribers} newsletter sign-ups`} />
      <Card>
        <div className="-mx-5 -mt-4 border-b border-border px-5 py-3">
          <Input className="max-w-xs" placeholder="Search customers" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {customers.length === 0 ? (
          <EmptyState title="No customers yet" body="Customers get an account when they sign up or check out in your store." />
        ) : (
          <div className="-mx-5 -mb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr className="border-b border-border">
                  <th className="px-5 py-2 font-medium">Customer</th>
                  <th className="px-2 py-2 font-medium">Joined</th>
                  <th className="px-2 py-2 font-medium">Orders</th>
                  <th className="px-5 py-2 text-right font-medium">Amount spent</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-2.5">
                      <div className="font-medium">{c.name}</div>
                      <a href={`mailto:${c.email}`} className="text-xs text-muted hover:underline">{c.email}</a>
                    </td>
                    <td className="px-2 py-2.5 text-muted">{new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="px-2 py-2.5">{c.orders}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{money(c.spent ?? 0)}</td>
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
