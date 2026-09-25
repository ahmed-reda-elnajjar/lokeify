"use client";

import Link from "@/storefront/components/ShopLink";
import { useRouter } from "@/storefront/lib/navigation";
import { CATEGORIES } from "@/storefront/lib/data";
import { money } from "@/storefront/lib/format";
import { bagCount, isDirty, openBag, setMenu, signOut, useStore } from "@/storefront/lib/store";
import { adminHref } from "@/storefront/lib/shop";

export type NavKey = "new" | "tops" | "bottoms" | "outerwear" | "accessories" | "lookbook" | "search" | "account" | "bag";

const NAV: { key: NavKey; label: string; href: string }[] = [
  { key: "new", label: "New", href: "/shop/new" },
  ...CATEGORIES.map((c) => ({ key: c.key as NavKey, label: c.name, href: `/shop/${c.key}` })),
  { key: "lookbook", label: "Lookbook", href: "/lookbook" },
];

export function Header({ active, back }: { active?: NavKey; back?: boolean }) {
  const s = useStore();
  const router = useRouter();
  const n = bagCount(s);
  const role = s.session.role;
  const on = (k: NavKey) => (k === active ? "on" : undefined);
  const brand = s.shop.name;
  const admin = adminHref();

  return (
    <>
      <header className="hdr">
        <Link href="/" className="brand">{brand}</Link>
        <nav aria-label="Shop">
          {NAV.map((x) => (
            <Link key={x.key} href={x.href} className={on(x.key)}>{x.label}</Link>
          ))}
        </nav>
        <div className="tools">
          <Link href="/search" className={on("search")}>Search</Link>
          {role === "admin" && <a href={admin}>Admin</a>}
          <Link href={s.customer ? "/account" : "/signin"} className={on("account")}>{s.customer ? "Account" : "Sign in"}</Link>
          <button className={`unbtn ${on("bag") ?? ""}`} onClick={openBag}>Bag ({n})</button>
        </div>
      </header>

      <header className="hdr-m">
        {back ? (
          <>
            <button className="unbtn" onClick={() => router.back()}>← Back</button>
            <Link href="/" className="brand">{brand}</Link>
            <button className="unbtn" onClick={openBag}>Bag {n}</button>
          </>
        ) : (
          <>
            <Link href="/" className="brand">{brand}</Link>
            <div className="tools">
              <Link href="/search">Search</Link>
              <button className="unbtn" onClick={openBag}>Bag {n}</button>
              <button className="unbtn" onClick={() => setMenu(true)} aria-expanded={s.ui.menuOpen}>Menu</button>
            </div>
          </>
        )}
      </header>

      {s.ui.menuOpen && (
        <div className="menu-sheet" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="hdr-m" style={{ display: "flex" }}>
            <span className="brand">{brand}</span>
            <button className="unbtn" onClick={() => setMenu(false)}>Close ×</button>
          </div>
          {NAV.map((x) => (
            <Link key={x.key} href={x.href} onClick={() => setMenu(false)}>{x.label}</Link>
          ))}
          {role === "admin" && <a href={admin} onClick={() => setMenu(false)}>Admin</a>}
          {s.customer && <Link href="/account" onClick={() => setMenu(false)}>Account</Link>}
          {!s.customer ? (
            <Link href="/signin" onClick={() => setMenu(false)}>Sign in</Link>
          ) : (
            <button className="item" onClick={() => (void signOut(), setMenu(false))}>Sign out</button>
          )}
        </div>
      )}

      {role === "admin" && (
        <div className="preview-bar">
          <span>Owner preview: {isDirty(s) ? "you are seeing your unpublished theme draft" : "this is what customers see"}. Hidden products show here too.</span>
          <a href={isDirty(s) ? adminHref("/online-store") : admin} className="u b" style={{ color: "inherit" }}>{isDirty(s) ? "Publish in admin" : "Back to admin"}</a>
        </div>
      )}
    </>
  );
}

export function Footer() {
  const s = useStore();
  const st = s.shop.settings;
  return (
    <footer className="foot">
      <div>
        <span className="brand" style={{ fontSize: 18 }}>{s.shop.name}</span>
        <span className="muted">{st.tagline}</span>
        <span className="muted" style={{ fontSize: 12 }}>Powered by <a href="/" className="u" style={{ color: "inherit" }}>Lokeify</a></span>
      </div>
      <div><span className="label">Shop</span>{CATEGORIES.map((c) => <Link key={c.key} href={`/shop/${c.key}`}>{c.name}</Link>)}</div>
      <div>
        <span className="label">Help</span>
        {st.freeShippingOver > 0 && <span>Free shipping over {money(st.freeShippingOver)}</span>}
        <span>30-day returns</span>
        {st.contactEmail && <a href={`mailto:${st.contactEmail}`}>{st.contactEmail}</a>}
      </div>
      <div><span className="label">Account</span><Link href="/account">Orders</Link><Link href="/signin">Sign in</Link></div>
    </footer>
  );
}
