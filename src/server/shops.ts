// Data access for shops, their catalogue, customers and orders.
// Every query is scoped by shop id: one merchant never reads another's rows.

import { cache } from "react";
import { all, one, run, tx } from "./db";
import { decrypt, encrypt, newId } from "./crypto";
import { deleteSlots, fileRegistry } from "./files";
import type { Product, SiteContentLike } from "./types";
import type {
  CustomerRecord, FulfillmentStatus, OrderAddress, OrderRecord, PaymentStatus, PublicShop, ShopSettings, ThemeContent,
} from "@/shared/shop";
import { SEED_SECTIONS, type Section } from "@/storefront/lib/data";

export { fileRegistry };

export interface ShopRow {
  id: string;
  slug: string;
  name: string;
  owner_id: string;
  settings: string;
  theme_draft: string;
  theme_published: string;
  secrets: string;
  order_seq: number;
  created_at: number;
}

export const DEFAULT_SIZE_CHART = [
  { size: "S", eu: "46", chest: "92–96", waist: "78–82", height: "170–175" },
  { size: "M", eu: "48", chest: "96–100", waist: "82–86", height: "175–180" },
  { size: "L", eu: "50", chest: "100–105", waist: "86–91", height: "180–185" },
  { size: "XL", eu: "52", chest: "105–110", waist: "91–96", height: "185–190" },
  { size: "XXL", eu: "54", chest: "110–115", waist: "96–102", height: "185–190" },
];

export function defaultSettings(currency = "EGP"): ShopSettings {
  const at = new Date(Date.now() + 14 * 86400000);
  at.setUTCHours(8, 0, 0, 0);
  return {
    currency,
    tagline: "Made in limited runs.",
    contactEmail: "",
    freeShippingOver: currency === "EGP" ? 2500 : 150,
    standardShipping: currency === "EGP" ? 75 : 8,
    expressShipping: currency === "EGP" ? 150 : 12,
    taxRate: currency === "EGP" ? 0.14 : 0.19,
    drop: { name: "Next drop", at: at.toISOString(), label: at.toUTCString().slice(0, 22), earlyAccessMinutes: 30 },
    trending: [],
    sizeChart: DEFAULT_SIZE_CHART,
    features: { fitRoom: true, realTryOn: true, sizeGuide: true },
    tryonProvider: "meta",
    tryonDailyLimit: 20,
  };
}

export function defaultTheme(name: string): ThemeContent {
  return {
    sections: SEED_SECTIONS.map((s: Section) => ({ ...s, on: s.k !== "countdown" })),
    hero: { title: name.toUpperCase(), kicker: "New collection", cta: "Shop now", body: `Welcome to ${name}. Find your size with our 3D fit room before you buy.` },
    wear: { garmentIds: [], aligned: false, images: {}, topPct: 23, scalePct: 84, xPct: 0, colorPhotos: true, rotateSeconds: 3, title: "THE COLLECTION" },
  };
}

const parse = <T>(s: string | null | undefined, fallback: T): T => {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};

// ── Shops ───────────────────────────────────────────────────────────────────

/** Cached for the length of one page render (layout, metadata and page all ask). */
export const shopBySlug = cache(async (slug: string) => (await one<ShopRow>(`SELECT * FROM shops WHERE slug = ?`, slug.toLowerCase())) ?? null);
export const shopById = async (id: string) => (await one<ShopRow>(`SELECT * FROM shops WHERE id = ?`, id)) ?? null;
export const shopsOf = (merchantId: string) => all<ShopRow>(`SELECT * FROM shops WHERE owner_id = ? ORDER BY created_at`, merchantId);

export function settingsOf(row: ShopRow): ShopSettings {
  const base = defaultSettings();
  const s = parse<Partial<ShopSettings>>(row.settings, {});
  return { ...base, ...s, drop: { ...base.drop, ...s.drop }, features: { ...base.features, ...s.features } };
}

export const themeOf = (row: ShopRow, which: "draft" | "published"): ThemeContent =>
  parse<ThemeContent>(which === "draft" ? row.theme_draft : row.theme_published, defaultTheme(row.name));

export async function publicShop(row: ShopRow): Promise<PublicShop> {
  return { id: row.id, slug: row.slug, name: row.name, settings: settingsOf(row), images: await fileRegistry(row.id) };
}

export const RESERVED_SLUGS = new Set(["admin", "api", "files", "login", "signup", "logout", "s", "new", "www", "lokeify", "help"]);
export async function slugAvailable(slug: string) {
  if (!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(slug) || RESERVED_SLUGS.has(slug)) return false;
  return !(await one(`SELECT 1 FROM shops WHERE slug = ?`, slug));
}

export async function createShop(
  ownerId: string,
  input: { name: string; slug: string; currency?: string; theme?: ThemeContent; settings?: Partial<ShopSettings>; products?: Product[] },
): Promise<ShopRow> {
  const id = newId("shp_");
  const now = Date.now();
  const settings = { ...defaultSettings(input.currency), ...input.settings };
  const theme = input.theme ?? defaultTheme(input.name);
  await tx(async () => {
    await run(
      `INSERT INTO shops (id, slug, name, owner_id, settings, theme_draft, theme_published, secrets, order_seq, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, '', 1000, ?)`,
      id, input.slug, input.name, ownerId, JSON.stringify(settings), JSON.stringify(theme), JSON.stringify(theme), now,
    );
    const products = input.products ?? [];
    for (let i = 0; i < products.length; i++) await insertProduct(id, products[i], now - i);
  });
  return (await shopById(id))!;
}

export async function updateShop(id: string, patch: { name?: string; settings?: Partial<ShopSettings> }) {
  const row = await shopById(id);
  if (!row) return null;
  const cur = settingsOf(row);
  const next: ShopSettings = patch.settings
    ? { ...cur, ...patch.settings, drop: { ...cur.drop, ...patch.settings.drop }, features: { ...cur.features, ...patch.settings.features } }
    : cur;
  await run(`UPDATE shops SET name = ?, settings = ? WHERE id = ?`, patch.name?.trim() || row.name, JSON.stringify(next), id);
  return shopById(id);
}

// Secrets (e.g. the try-on API key) are stored encrypted and never sent to the browser.
export async function secretsOf(row: ShopRow): Promise<Record<string, string>> {
  if (!row.secrets) return {};
  const plain = await decrypt(row.secrets);
  return plain ? parse<Record<string, string>>(plain, {}) : {};
}
export async function setSecret(row: ShopRow, key: string, value: string | null) {
  const s = await secretsOf(row);
  if (value) s[key] = value;
  else delete s[key];
  await run(`UPDATE shops SET secrets = ? WHERE id = ?`, Object.keys(s).length ? await encrypt(JSON.stringify(s)) : "", row.id);
}

// ── Theme (draft → publish) ─────────────────────────────────────────────────

export async function saveThemeDraft(id: string, theme: ThemeContent) {
  await run(`UPDATE shops SET theme_draft = ? WHERE id = ?`, JSON.stringify(theme), id);
}
export const publishTheme = (id: string) => run(`UPDATE shops SET theme_published = theme_draft WHERE id = ?`, id);
export const discardTheme = (id: string) => run(`UPDATE shops SET theme_draft = theme_published WHERE id = ?`, id);

// ── Products ────────────────────────────────────────────────────────────────

async function insertProduct(shopId: string, p: Product, at = Date.now()) {
  await run(
    `INSERT INTO products (shop_id, id, data, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    shopId, p.id, JSON.stringify(p), p.live ? "active" : "draft", at, at,
  );
}

const rowToProduct = (r: { data: string }) => JSON.parse(r.data) as Product;

export async function listProducts(shopId: string, opts: { liveOnly?: boolean } = {}): Promise<Product[]> {
  const rows = await all<{ data: string }>(
    `SELECT data FROM products WHERE shop_id = ? ${opts.liveOnly ? "AND status = 'active'" : ""} ORDER BY created_at DESC`,
    shopId,
  );
  return rows.map(rowToProduct);
}

export async function getProduct(shopId: string, id: string): Promise<Product | null> {
  const r = await one<{ data: string }>(`SELECT data FROM products WHERE shop_id = ? AND id = ?`, shopId, id);
  return r ? rowToProduct(r) : null;
}

export async function createProduct(shopId: string, input: Partial<Product>): Promise<Product> {
  const existing = await listProducts(shopId);
  const base: Product = {
    id: "", name: "New product", price: 0, category: "tops", colourways: ["Black"], sizes: ["S", "M", "L", "XL", "XXL"],
    stock: {}, drop: "", fabric: "", fit: "", shape: "tee", fitStyle: "regular", measurements: {}, live: false,
    added: Math.max(0, ...existing.map((x) => x.added ?? 0)) + 1,
  };
  const p: Product = { ...base, ...input, id: "" };
  let id = slugOf(p.name) || "product";
  if (existing.some((x) => x.id === id)) id = `${id}-${newId().slice(0, 4).toLowerCase()}`;
  p.id = id;
  await insertProduct(shopId, p);
  return p;
}

const slugOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

export async function updateProduct(shopId: string, id: string, patch: Partial<Product>): Promise<Product | null> {
  const cur = await getProduct(shopId, id);
  if (!cur) return null;
  const next: Product = { ...cur, ...patch, id };
  await run(
    `UPDATE products SET data = ?, status = ?, updated_at = ? WHERE shop_id = ? AND id = ?`,
    JSON.stringify(next), next.live ? "active" : "draft", Date.now(), shopId, id,
  );
  return next;
}

/** Deletes the product and its photos, 3D file and lookbook cut-out. */
export async function deleteProduct(shopId: string, id: string) {
  const photo = new RegExp(`^p-${id.replace(/[^\w-]/g, "")}-\\d+$`);
  await run(`DELETE FROM products WHERE shop_id = ? AND id = ?`, shopId, id);
  await deleteSlots(shopId, (slot) => photo.test(slot) || slot === `model-${id}` || slot === `wear-g-${id}`);
}

// ── Customers ───────────────────────────────────────────────────────────────

interface CustomerRow { id: string; shop_id: string; email: string; name: string; password: string; fit: string | null; created_at: number }

export const customerByEmail = async (shopId: string, email: string) =>
  (await one<CustomerRow>(`SELECT * FROM customers WHERE shop_id = ? AND email = ?`, shopId, email.trim().toLowerCase())) ?? null;
export const customerById = async (shopId: string, id: string) =>
  (await one<CustomerRow>(`SELECT * FROM customers WHERE shop_id = ? AND id = ?`, shopId, id)) ?? null;

export async function createCustomer(shopId: string, input: { email: string; name: string; passwordHash: string }) {
  const id = newId("cus_");
  await run(
    `INSERT INTO customers (id, shop_id, email, name, password, fit, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?)`,
    id, shopId, input.email.trim().toLowerCase(), input.name.trim(), input.passwordHash, Date.now(),
  );
  return (await customerById(shopId, id))!;
}

export const saveCustomerFit = (shopId: string, id: string, fit: unknown) =>
  run(`UPDATE customers SET fit = ? WHERE shop_id = ? AND id = ?`, JSON.stringify(fit), shopId, id);
export const customerFit = (c: CustomerRow) => parse<Record<string, number> | null>(c.fit, null);

export async function listCustomers(shopId: string): Promise<CustomerRecord[]> {
  const rows = await all<{ id: string; shop_id: string; email: string; name: string; created_at: number; orders: number; spent: number | null }>(
    `SELECT c.id, c.shop_id, c.email, c.name, c.created_at, COUNT(o.id) AS orders, SUM(CASE WHEN o.status != 'Cancelled' THEN o.total ELSE 0 END) AS spent
       FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
      WHERE c.shop_id = ? GROUP BY c.id ORDER BY c.created_at DESC`,
    shopId,
  );
  return rows.map((r) => ({ id: r.id, shopId: r.shop_id, email: r.email, name: r.name, createdAt: Number(r.created_at), orders: Number(r.orders), spent: Number(r.spent ?? 0) }));
}

// ── Orders ──────────────────────────────────────────────────────────────────

interface OrderRow {
  id: string; shop_id: string; no: string; customer_id: string | null; email: string; name: string; lines: string; item_count: number;
  subtotal: number; shipping: number; tax: number; total: number; ship_method: string; pay_method: string; address: string | null;
  status: string; payment_status: string; created_at: number;
}
const toOrder = (r: OrderRow): OrderRecord => ({
  id: r.id, no: r.no, shopId: r.shop_id, customerId: r.customer_id, email: r.email, name: r.name, lines: parse(r.lines, []),
  itemCount: Number(r.item_count), subtotal: Number(r.subtotal), shipping: Number(r.shipping), tax: Number(r.tax), total: Number(r.total),
  shipMethod: r.ship_method, payMethod: r.pay_method, address: parse<OrderAddress | null>(r.address, null), status: r.status as FulfillmentStatus,
  paymentStatus: r.payment_status as PaymentStatus, createdAt: Number(r.created_at),
});

export const listOrders = async (shopId: string) =>
  (await all<OrderRow>(`SELECT * FROM orders WHERE shop_id = ? ORDER BY created_at DESC`, shopId)).map(toOrder);
export const ordersOfCustomer = async (shopId: string, customerId: string) =>
  (await all<OrderRow>(`SELECT * FROM orders WHERE shop_id = ? AND customer_id = ? ORDER BY created_at DESC`, shopId, customerId)).map(toOrder);
export const orderByNo = async (shopId: string, no: string) => {
  const r = await one<OrderRow>(`SELECT * FROM orders WHERE shop_id = ? AND no = ?`, shopId, no);
  return r ? toOrder(r) : null;
};

export class OrderError extends Error {}

export interface PlaceOrderInput {
  lines: { productId: string; size: string; colour: string; qty: number }[];
  email: string;
  name: string;
  shipMethod: "standard" | "express" | "pickup";
  payMethod: string;
  address: OrderAddress | null;
}

/** Prices, shipping and tax are worked out here from the catalogue, never taken from the browser. Stock is taken in the same transaction. */
export async function placeOrder(shop: ShopRow, customerId: string | null, input: PlaceOrderInput): Promise<OrderRecord> {
  const settings = settingsOf(shop);
  return tx(async () => {
    const lines: OrderRecord["lines"] = [];
    const touched = new Map<string, Product>();
    for (const l of input.lines) {
      const qty = Math.floor(l.qty);
      if (!(qty > 0 && qty <= 50)) throw new OrderError("Check the quantities in your bag.");
      const p = touched.get(l.productId) ?? (await getProduct(shop.id, l.productId));
      if (!p || !p.live) throw new OrderError("Something in your bag is no longer for sale.");
      if (!p.sizes.includes(l.size)) throw new OrderError(`${p.name}: size ${l.size} isn't available.`);
      const left = p.stock[l.size] ?? 0;
      if (left < qty) throw new OrderError(left > 0 ? `${p.name} in ${l.size}: only ${left} left.` : `${p.name} in ${l.size} just sold out.`);
      p.stock = { ...p.stock, [l.size]: left - qty };
      touched.set(p.id, p);
      lines.push({ productId: p.id, name: p.name, size: l.size, colour: l.colour, qty, price: p.price });
    }
    if (!lines.length) throw new OrderError("Your bag is empty.");
    const subtotal = round2(lines.reduce((a, l) => a + l.price * l.qty, 0));
    const shipping =
      input.shipMethod === "express" ? settings.expressShipping
      : input.shipMethod === "pickup" || (settings.freeShippingOver > 0 && subtotal >= settings.freeShippingOver) ? 0
      : settings.standardShipping;
    const total = round2(subtotal + shipping);
    const tax = round2(total - total / (1 + settings.taxRate));
    for (const p of touched.values())
      await run(`UPDATE products SET data = ?, updated_at = ? WHERE shop_id = ? AND id = ?`, JSON.stringify(p), Date.now(), shop.id, p.id);
    const seq = Number((await one<{ order_seq: number }>(`SELECT order_seq FROM shops WHERE id = ?`, shop.id))?.order_seq ?? 1000) + 1;
    await run(`UPDATE shops SET order_seq = ? WHERE id = ?`, seq, shop.id);
    const order: OrderRecord = {
      id: newId("ord_"), no: `#${orderPrefix(shop.name)}-${seq}`, shopId: shop.id, customerId, email: input.email.trim().toLowerCase(), name: input.name.trim(),
      lines, itemCount: lines.reduce((a, l) => a + l.qty, 0), subtotal, shipping, tax, total, shipMethod: input.shipMethod, payMethod: input.payMethod,
      address: input.address, status: "Processing", paymentStatus: "Paid", createdAt: Date.now(),
    };
    await run(
      `INSERT INTO orders (id, shop_id, no, customer_id, email, name, lines, item_count, subtotal, shipping, tax, total, ship_method, pay_method, address, status, payment_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      order.id, shop.id, order.no, customerId, order.email, order.name, JSON.stringify(lines), order.itemCount, subtotal, shipping, tax, total,
      order.shipMethod, order.payMethod, order.address ? JSON.stringify(order.address) : null, order.status, order.paymentStatus, order.createdAt,
    );
    return order;
  });
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const orderPrefix = (name: string) => (name.replace(/[^A-Za-z]/g, "").slice(0, 2) || "LK").toUpperCase();

export async function updateOrder(shopId: string, no: string, patch: { status?: FulfillmentStatus; paymentStatus?: PaymentStatus }) {
  const cur = await orderByNo(shopId, no);
  if (!cur) return null;
  // Cancelling puts the pieces back on the shelf.
  if (patch.status === "Cancelled" && cur.status !== "Cancelled") {
    await tx(async () => {
      for (const l of cur.lines) {
        const p = await getProduct(shopId, l.productId);
        if (p)
          await run(
            `UPDATE products SET data = ? WHERE shop_id = ? AND id = ?`,
            JSON.stringify({ ...p, stock: { ...p.stock, [l.size]: (p.stock[l.size] ?? 0) + l.qty } }), shopId, p.id,
          );
      }
      await run(`UPDATE orders SET status = ? WHERE shop_id = ? AND no = ?`, "Cancelled", shopId, no);
    });
  } else if (patch.status) await run(`UPDATE orders SET status = ? WHERE shop_id = ? AND no = ?`, patch.status, shopId, no);
  if (patch.paymentStatus) await run(`UPDATE orders SET payment_status = ? WHERE shop_id = ? AND no = ?`, patch.paymentStatus, shopId, no);
  return orderByNo(shopId, no);
}

// ── Newsletter ──────────────────────────────────────────────────────────────

export const addSubscriber = (shopId: string, email: string) =>
  run(`INSERT INTO subscribers (shop_id, email, created_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING`, shopId, email.trim().toLowerCase(), Date.now());
export const subscriberCount = async (shopId: string) =>
  Number((await one<{ n: number }>(`SELECT COUNT(*) AS n FROM subscribers WHERE shop_id = ?`, shopId))?.n ?? 0);

// ── Dashboard numbers ───────────────────────────────────────────────────────

const count = async (sql: string, ...p: string[]) => Number((await one<{ n: number }>(sql, ...p))?.n ?? 0);

export async function stats(shopId: string) {
  const since = Date.now() - 30 * 86400000;
  const [o, byDay, toFulfil, customers, products, subscribers] = await Promise.all([
    one<{ n: number; revenue: number | null }>(`SELECT COUNT(*) AS n, SUM(total) AS revenue FROM orders WHERE shop_id = ? AND status != 'Cancelled' AND created_at >= ?`, shopId, since),
    all<{ day: string; revenue: number; n: number }>(
      `SELECT strftime('%Y-%m-%d', created_at / 1000, 'unixepoch') AS day, SUM(total) AS revenue, COUNT(*) AS n
         FROM orders WHERE shop_id = ? AND status != 'Cancelled' AND created_at >= ? GROUP BY day ORDER BY day`,
      shopId, since,
    ),
    toFulfilCount(shopId),
    count(`SELECT COUNT(*) AS n FROM customers WHERE shop_id = ?`, shopId),
    count(`SELECT COUNT(*) AS n FROM products WHERE shop_id = ?`, shopId),
    subscriberCount(shopId),
  ]);
  return {
    orders30: Number(o?.n ?? 0),
    revenue30: Number(o?.revenue ?? 0),
    toFulfil,
    customers,
    products,
    subscribers,
    byDay: byDay.map((d) => ({ day: d.day, revenue: Number(d.revenue), n: Number(d.n) })),
  };
}

export const toFulfilCount = (shopId: string) => count(`SELECT COUNT(*) AS n FROM orders WHERE shop_id = ? AND status = 'Processing'`, shopId);

export type { SiteContentLike };
