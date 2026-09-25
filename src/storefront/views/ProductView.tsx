"use client";

import Link from "@/storefront/components/ShopLink";
import { useParams, useRouter } from "@/storefront/lib/navigation";
import { useState } from "react";
import { Footer, Header, type NavKey } from "@/storefront/components/Header";
import { ImageSlot, productImg } from "@/storefront/components/ImageSlot";
import { ProductCard, SWATCH } from "@/storefront/components/ProductCard";
import { CATEGORIES, FREE_SHIPPING_OVER } from "@/storefront/lib/data";
import { money } from "@/storefront/lib/format";
import { addToBag, openFitRoom, siteFor, stockLeft, toast, toggleWishlist, useStore } from "@/storefront/lib/store";

const SHOTS = ["on-model, front", "on-model, back", "flat lay", "detail: zip + label"];

/** 2e Product · Grid gallery and ruled buy box, with the 2f limited-run counter. */
export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const s = useStore();
  const products = siteFor(s).products;
  const p = products.find((x) => x.id === id && (x.live || s.session.role === "admin"));

  const [sizePick, setSize] = useState<string | null>(null);
  const [colourPick, setColour] = useState<string | null>(null);
  const [shot, setShot] = useState(0);

  if (!p) {
    return (
      <>
        <Header />
        <main className="empty-note" style={{ minHeight: "50vh" }}>
          <h1 style={{ fontSize: 42 }}>This piece isn&apos;t available.</h1>
          <Link href="/shop/new" className="u">Back to the shop</Link>
        </main>
      </>
    );
  }

  // Defaults are derived, not stored, so they follow admin edits and late hydration.
  const size = sizePick ?? (["M", ...p.sizes].find((z) => p.sizes.includes(z) && (p.stock[z] ?? 0) > 0) ?? null);
  const colour = colourPick && p.colourways.includes(colourPick) ? colourPick : p.colourways[0];
  const cat = CATEGORIES.find((c) => c.key === p.category);
  const left = stockLeft(p);
  const soldOut = left === 0;
  const saved = s.wishlist.includes(p.id);
  const admin = s.session.role === "admin";
  const features = s.shop.settings.features;
  const shots = SHOTS.slice(0, Math.max(1, Math.min(SHOTS.length, p.images ?? SHOTS.length)));
  const related = products.filter((x) => x.live && x.id !== p.id).sort((a, b) => Number(a.category === p.category) - Number(b.category === p.category) || b.added - a.added).slice(0, 4);

  const add = () => {
    if (!size) return toast("Pick a size first.");
    if (!s.customer && s.session.role !== "admin") {
      toast("Sign in to add pieces to your bag.");
      return router.push(`/signin?next=/product/${p.id}`);
    }
    addToBag(p.id, size, colour);
  };
  const cta = soldOut ? "Sold out" : size ? "Add to bag" : "Pick a size";

  const sizeGrid = (
    <div className="sizes" style={{ gridTemplateColumns: `repeat(${Math.min(p.sizes.length, 5)}, 1fr)` }} role="radiogroup" aria-label="Size">
      {p.sizes.map((z) => {
        const n = p.stock[z] ?? 0;
        return (
          <button key={z} role="radio" aria-checked={size === z} disabled={n === 0} className={`pick ${n === 0 ? "off" : size === z ? "on" : ""}`} onClick={() => setSize(z)}>
            <span style={{ fontWeight: size === z ? 600 : 400 }}>{z}</span>
            {n > 0 && n <= 3 && <small>{n} left</small>}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <Header active={p.category as NavKey} back />
      <main>
        <div className="pdp">
          <div className="gallery">
            {shots.map((ph, i) => (
              <div key={i} className="ph grayscale"><ImageSlot id={productImg(p.id, i)} src={i === 0 ? p.photo : undefined} placeholder={ph} alt={`${p.name}, ${ph}`} editable={admin} /></div>
            ))}
          </div>

          <div className="pdp-m-gallery only-m" onScroll={(e) => setShot(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
            {shots.map((ph, i) => (
              <div key={i} className="ph grayscale"><ImageSlot id={productImg(p.id, i)} src={i === 0 ? p.photo : undefined} placeholder={ph} alt={`${p.name}, ${ph}`} editable={admin} /></div>
            ))}
          </div>

          <div className="buy">
            <div className="only-d" style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span className="muted"><Link href={`/shop/${p.category}`}>{cat?.name}</Link> / {p.name}</span>
              {p.drop && <span className="tag tag-accent">Drop {p.drop}</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="only-m" style={{ fontSize: 12, marginBottom: -4 }}>{shot + 1} / {shots.length}</div>
              <h1>{p.name}</h1>
              <span style={{ fontSize: 22 }}>
                {money(p.price)}
                {p.compareAt && p.compareAt > p.price ? <s className="muted" style={{ fontSize: 16, marginLeft: 10 }}>{money(p.compareAt)}</s> : null}
              </span>
            </div>
            {p.description && <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, whiteSpace: "pre-line" }}>{p.description}</p>}

            {p.run && (
              <div className="run">
                <b>{left}/{p.run}</b>
                <span>{soldOut ? "This run has sold out. No restocks." : "left in this run. No restocks."}</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 13 }}>Colour: <b>{colour}</b></span>
              <div className="swatches" role="radiogroup" aria-label="Colour">
                {p.colourways.map((c) => (
                  <button key={c} role="radio" aria-checked={c === colour} aria-label={c} className={`swatch ${c === colour ? "on" : ""}`} style={{ background: SWATCH[c] ?? "var(--color-neutral-500)" }} onClick={() => setColour(c)} />
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>Size</span>
                {p.shape && features.sizeGuide && <button className="unbtn u" onClick={() => openFitRoom("guide", p.id)}>Size guide</button>}
              </div>
              {sizeGrid}
              {p.fit && <span className="muted" style={{ fontSize: 13 }}>Cut {p.fit.toLowerCase()}. Take your usual size.</span>}
              {p.shape && features.fitRoom && (
                <button className="btn btn-secondary row h44" onClick={() => openFitRoom("fit", p.id)}><span>Not sure? Try it on in 3D</span><span>→</span></button>
              )}
              {p.category !== "accessories" && features.realTryOn && !features.fitRoom && (
                <button className="btn btn-secondary row h44" onClick={() => openFitRoom("real", p.id)}><span>See it on your photo</span><span>→</span></button>
              )}
            </div>

            <div className="desk-cta">
              <button className="btn btn-primary row h56" onClick={add} disabled={soldOut}><span>{cta}</span><span>{money(p.price)} →</span></button>
              <button className="btn btn-secondary row h48" onClick={() => toggleWishlist(p.id)} aria-pressed={saved}><span>{saved ? "Saved to wishlist" : "Save to wishlist"}</span><span>{saved ? "✓" : "+"}</span></button>
            </div>

            <div className="spec">
              {p.fabric && <div><span>Fabric</span><span>{p.fabric}</span></div>}
              {p.fit && <div><span>Fit</span><span>{p.fit}</span></div>}
              <div><span>Shipping</span><span>{Number.isFinite(FREE_SHIPPING_OVER) ? `Free over ${money(FREE_SHIPPING_OVER)} · ` : ""}30-day returns</span></div>
            </div>
          </div>
        </div>

        <div className="sec-head"><h2>Wear it with</h2></div>
        <div className="pgrid bt">{related.map((x) => <ProductCard key={x.id} p={x} ratio="45" showCw={false} />)}</div>

        <div className="sticky-buy only-m">
          <button className="btn btn-primary row h52 w100" onClick={add} disabled={soldOut}><span>{soldOut ? "Sold out" : size ? `Add to bag · ${size}` : "Pick a size"}</span><span>{money(p.price)} →</span></button>
        </div>
      </main>
      <Footer />
    </>
  );
}
