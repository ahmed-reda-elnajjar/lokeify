"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { PublicShop } from "@/shared/shop";
import { AdminProvider } from "./context";
import { api } from "./api";
import { cx } from "./ui";

const NAV = [
  { href: "", label: "Home", icon: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/orders", label: "Orders", icon: "M4 4h16v4H4zM4 10h16v10H4zM9 14h6" },
  { href: "/products", label: "Products", icon: "M20 7l-8-4-8 4 8 4 8-4zM4 7v10l8 4 8-4V7" },
  { href: "/customers", label: "Customers", icon: "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21a8 8 0 0 1 16 0" },
  { href: "/online-store", label: "Online store", icon: "M3 5h18v12H3zM8 21h8M12 17v4" },
  { href: "/apps", label: "Fit room & try-on", icon: "M12 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM6 21v-6l-2-4h16l-2 4v6" },
  { href: "/settings", label: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.3 2.9a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 2.9h5l.3-2.9a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1z" },
];

export default function AdminShell({
  shop, shops, merchant, toFulfil, ephemeral, children,
}: { shop: PublicShop; shops: { slug: string; name: string }[]; merchant: { name: string; email: string }; toFulfil: number; ephemeral?: boolean; children: ReactNode }) {
  const path = usePathname();
  const base = `/admin/${shop.slug}`;
  const [menu, setMenu] = useState(false);
  const [switcher, setSwitcher] = useState(false);
  const active = (href: string) => (href ? path === base + href || path.startsWith(`${base + href}/`) : path === base);

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.href = "/login";
  };

  const nav = (
    <nav className="flex flex-col gap-0.5 p-3" aria-label="Admin">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={base + n.href}
          onClick={() => setMenu(false)}
          className={cx(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            active(n.href) ? "bg-surface font-semibold shadow-sm" : "text-foreground/80 hover:bg-surface/70",
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
            <path d={n.icon} />
          </svg>
          <span className="flex-1">{n.label}</span>
          {n.href === "/orders" && toFulfil > 0 && <span className="rounded-full bg-foreground px-1.5 text-[11px] font-semibold text-white">{toFulfil}</span>}
        </Link>
      ))}
      <div className="mt-4 border-t border-border pt-3">
        <a href={`/s/${shop.slug}`} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground/80 hover:bg-surface/70">
          View your store <span aria-hidden>↗</span>
        </a>
      </div>
    </nav>
  );

  return (
    <AdminProvider shop={shop}>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 bg-[#1a1a1a] px-3 text-white sm:px-4">
        <div className="flex items-center gap-2">
          <button className="rounded-lg p-2 hover:bg-white/10 lg:hidden" onClick={() => setMenu((m) => !m)} aria-label="Menu" aria-expanded={menu}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5"><path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <a href="/admin" className="text-base font-semibold tracking-tight">
            Loke<span className="text-emerald-400">ify</span>
          </a>
          <div className="relative ml-2">
            <button className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15" onClick={() => setSwitcher((v) => !v)} aria-expanded={switcher}>
              <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500 text-[11px] font-bold">{shop.name.slice(0, 1).toUpperCase()}</span>
              <span className="max-w-40 truncate">{shop.name}</span>
              <span aria-hidden>▾</span>
            </button>
            {switcher && (
              <div className="absolute left-0 top-10 w-64 rounded-xl border border-border bg-surface p-1.5 text-foreground shadow-lg">
                {shops.map((s) => (
                  <a key={s.slug} href={`/admin/${s.slug}`} className={cx("block rounded-lg px-3 py-2 text-sm hover:bg-surface-2", s.slug === shop.slug && "font-semibold")}>
                    {s.name} <span className="text-muted">/s/{s.slug}</span>
                  </a>
                ))}
                <a href="/admin/new" className="mt-1 block rounded-lg border-t border-border px-3 py-2 text-sm text-accent hover:bg-surface-2">+ Open another store</a>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <a href={`/s/${shop.slug}`} target="_blank" rel="noreferrer" className="hidden rounded-lg px-3 py-1.5 hover:bg-white/10 sm:block">View store ↗</a>
          <span className="hidden text-white/60 md:inline">{merchant.email}</span>
          <button className="rounded-lg px-3 py-1.5 hover:bg-white/10" onClick={() => void logout()}>Log out</button>
        </div>
      </header>
      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-border bg-section lg:block">{nav}</aside>
        {menu && (
          <div className="fixed inset-0 top-14 z-30 bg-black/30 lg:hidden" onClick={() => setMenu(false)}>
            <aside className="h-full w-64 bg-section" onClick={(e) => e.stopPropagation()}>{nav}</aside>
          </div>
        )}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {ephemeral && (
            <div className="mx-auto mb-5 max-w-5xl rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <b>Demo mode:</b> this deployment has no database connected, so products, orders and uploads can disappear at any time.
              Connect a Turso database (set <code>TURSO_DATABASE_URL</code> and <code>TURSO_AUTH_TOKEN</code>) to keep them.
            </div>
          )}
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </AdminProvider>
  );
}
