"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CATEGORIES, type Product } from "@/storefront/lib/data";
import { useAdmin, useMoney } from "../context";
import { api, adminUrl } from "../api";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, cx } from "../ui";

const stockOf = (p: Product) => Object.values(p.stock).reduce((a, n) => a + n, 0);

export default function ProductsView({ products }: { products: Product[] }) {
  const { shop, images } = useAdmin();
  const money = useMoney();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "draft">("all");
  const [cat, setCat] = useState("");
  const [busy, setBusy] = useState(false);
  const base = `/admin/${shop.slug}/products`;

  const rows = useMemo(
    () =>
      products.filter(
        (p) =>
          (status === "all" || (status === "active") === p.live) &&
          (!cat || p.category === cat) &&
          (!q.trim() || `${p.name} ${p.fabric} ${p.tag ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())),
      ),
    [products, q, status, cat],
  );

  const add = async () => {
    setBusy(true);
    try {
      const r = await api<{ product: Product }>(adminUrl(shop.slug, "/products"), { method: "POST", body: JSON.stringify({ name: "New product" }) });
      router.push(`${base}/${encodeURIComponent(r.product.id)}`);
    } catch {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Products" actions={<Button kind="primary" onClick={() => void add()} disabled={busy}>{busy ? "Adding…" : "Add product"}</Button>} />
      <Card>
        <div className="-mx-5 -mt-4 flex flex-wrap gap-2 border-b border-border px-5 py-3">
          <div className="flex rounded-lg bg-surface-2 p-0.5 text-sm">
            {(["all", "active", "draft"] as const).map((k) => (
              <button key={k} className={cx("rounded-md px-3 py-1 capitalize", status === k && "bg-surface font-medium shadow-sm")} onClick={() => setStatus(k)}>
                {k}
              </button>
            ))}
          </div>
          <Input className="max-w-xs" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select className="max-w-44" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
          </Select>
        </div>
        {products.length === 0 ? (
          <EmptyState title="Add your first product" body="Products get photos, prices, sizes with stock, and measurements the fit room uses to recommend a size." action={<Button kind="primary" onClick={() => void add()}>Add product</Button>} />
        ) : rows.length === 0 ? (
          <EmptyState title="No products match" body="Try another search or filter." />
        ) : (
          <div className="-mx-5 -mb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr className="border-b border-border">
                  <th className="px-5 py-2 font-medium">Product</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Inventory</th>
                  <th className="px-2 py-2 font-medium">Category</th>
                  <th className="px-2 py-2 font-medium">3D / fit</th>
                  <th className="px-5 py-2 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const img = images[`p-${p.id}-0`] ?? p.photo;
                  const stock = stockOf(p);
                  const hasSpecs = !!p.measurements && Object.values(p.measurements).some((m) => Object.keys(m).length);
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-2/60">
                      <td className="px-5 py-2">
                        <Link href={`${base}/${encodeURIComponent(p.id)}`} className="flex items-center gap-3">
                          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-surface-2">{img && <img src={img} alt="" className="h-full w-full object-cover" />}</span>
                          <span className="font-medium hover:underline">{p.name}</span>
                        </Link>
                      </td>
                      <td className="px-2 py-2"><Badge tone={p.live ? "green" : "gray"}>{p.live ? "Active" : "Draft"}</Badge></td>
                      <td className={cx("px-2 py-2", stock === 0 && "text-red-700")}>{stock} in stock{p.sizes.length > 1 ? ` · ${p.sizes.length} sizes` : ""}</td>
                      <td className="px-2 py-2 text-muted">{CATEGORIES.find((c) => c.key === p.category)?.name}</td>
                      <td className="px-2 py-2 text-muted">{[images[`model-${p.id}`] ? "3D" : null, hasSpecs ? "Specs" : null].filter(Boolean).join(" · ") || "—"}</td>
                      <td className="px-5 py-2 text-right tabular-nums">{money(p.price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
