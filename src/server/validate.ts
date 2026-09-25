// Whitelists what the admin may write. Unknown fields are dropped, numbers are
// clamped, strings trimmed; anything else keeps its stored value.

import { CATEGORIES, FIT_STYLES, type Measurements, type Product } from "@/storefront/lib/data";
import { CURRENCIES, type ShopSettings } from "@/shared/shop";

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.slice(0, max) : undefined);
const num = (v: unknown, min = 0, max = 1e9) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : undefined);
const strs = (v: unknown, max = 40) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x.trim()).map((x) => x.trim().slice(0, 40)).slice(0, max) : undefined);

type Nullable<T> = { [K in keyof T]?: T[K] | null };

/** `null` clears an optional field (JSON has no undefined). */
export function cleanProduct(b: Nullable<Product>): Partial<Product> {
  const out: Partial<Product> = {};
  const set = <K extends keyof Product>(k: K, v: Product[K] | undefined) => {
    if (v !== undefined) out[k] = v;
  };
  const clearable = <K extends keyof Product>(k: K, v: Product[K] | undefined) => {
    if (b[k] === null) out[k] = undefined;
    else set(k, v);
  };
  set("name", str(b.name, 120)?.trim() || undefined);
  clearable("description", str(b.description, 4000));
  set("price", num(b.price, 0, 1e7));
  clearable("compareAt", num(b.compareAt, 0, 1e7));
  if (typeof b.category === "string" && CATEGORIES.some((c) => c.key === b.category)) out.category = b.category;
  set("colourways", strs(b.colourways));
  set("sizes", strs(b.sizes, 20));
  if (b.stock && typeof b.stock === "object") {
    out.stock = Object.fromEntries(Object.entries(b.stock).flatMap(([k, v]) => (typeof v === "number" && Number.isFinite(v) ? [[k.slice(0, 20), Math.max(0, Math.round(v))]] : [])));
  }
  clearable("run", num(b.run, 0, 1e6));
  clearable("tag", str(b.tag, 30) || undefined);
  set("drop", str(b.drop, 30));
  set("fabric", str(b.fabric, 200));
  set("fit", str(b.fit, 200));
  if (b.shape === null) out.shape = undefined;
  else if (b.shape && ["jacket", "tee", "hoodie", "pants"].includes(b.shape)) out.shape = b.shape;
  if (b.fitStyle && FIT_STYLES.includes(b.fitStyle)) out.fitStyle = b.fitStyle;
  if (b.measurements && typeof b.measurements === "object") {
    out.measurements = Object.fromEntries(
      Object.entries(b.measurements).map(([size, row]) => [
        size.slice(0, 20),
        Object.fromEntries(Object.entries(row ?? {}).filter(([, v]) => typeof v === "number" && v > 0 && v < 300)) as Measurements,
      ]),
    );
  }
  clearable("modelSize", str(b.modelSize, 20) || undefined);
  clearable("tryonNote", str(b.tryonNote, 300));
  if (typeof b.live === "boolean") out.live = b.live;
  set("images", typeof b.images === "number" ? Math.max(1, Math.min(8, Math.round(b.images))) : undefined);
  return out;
}

export function cleanSettings(b: Partial<ShopSettings>): Partial<ShopSettings> {
  const out: Partial<ShopSettings> = {};
  if (typeof b.currency === "string" && (CURRENCIES as readonly string[]).includes(b.currency)) out.currency = b.currency;
  if (typeof b.tagline === "string") out.tagline = b.tagline.slice(0, 120);
  if (typeof b.contactEmail === "string") out.contactEmail = b.contactEmail.slice(0, 200);
  for (const k of ["freeShippingOver", "standardShipping", "expressShipping"] as const) {
    const v = num(b[k], 0, 1e6);
    if (v !== undefined) out[k] = v;
  }
  const tax = num(b.taxRate, 0, 0.5);
  if (tax !== undefined) out.taxRate = tax;
  if (b.drop && typeof b.drop === "object") {
    const at = str(b.drop.at, 40);
    out.drop = {
      name: str(b.drop.name, 60) ?? "Next drop",
      at: at && !Number.isNaN(Date.parse(at)) ? new Date(at).toISOString() : new Date().toISOString(),
      label: str(b.drop.label, 60) ?? "",
      earlyAccessMinutes: num(b.drop.earlyAccessMinutes, 0, 1440) ?? 30,
    };
  }
  const trending = strs(b.trending, 12);
  if (trending) out.trending = trending;
  if (Array.isArray(b.sizeChart)) {
    out.sizeChart = b.sizeChart.slice(0, 12).map((r) => ({ size: str(r.size, 12) ?? "", eu: str(r.eu, 12) ?? "", chest: str(r.chest, 20) ?? "", waist: str(r.waist, 20) ?? "", height: str(r.height, 20) ?? "" }));
  }
  if (b.features && typeof b.features === "object") {
    out.features = {
      fitRoom: b.features.fitRoom !== false,
      realTryOn: b.features.realTryOn !== false,
      sizeGuide: b.features.sizeGuide !== false,
    };
  }
  if (b.tryonProvider && ["meta", "fashn", "replicate", "mock"].includes(b.tryonProvider)) out.tryonProvider = b.tryonProvider;
  const lim = num(b.tryonDailyLimit, 0, 1000);
  if (lim !== undefined) out.tryonDailyLimit = Math.round(lim);
  return out;
}
