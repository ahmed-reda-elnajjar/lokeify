"use client";

// Storefront state for one Lokeify shop. The catalogue, theme, session and
// orders come from the server (ShopProvider hands them over on each page view);
// the bag, wishlist, fit profile and saved looks are the shopper's own and are
// kept in this browser per shop. Components read it via useStore() and change
// it only through the actions below.

import { useContext, useSyncExternalStore } from "react";
import type { OrderRecord, PublicShop, ThemeContent } from "@/shared/shop";
import { applyShopSettings, type Hero, type MeasureKey, type Measurements, type Order, type Product, type Role, type Section, type WearFit, type WearSettings, wearFitOf } from "./data";
import type { BodyProfile } from "./fit";
import { ShopContext, type ShopBoot } from "./context";
import { setCurrency } from "./format";
import { setImageRegistry } from "./images";
import { adminApi, json, setShopSlug, shopApi } from "./shop";

export interface SiteContent {
  products: Product[];
  sections: Section[];
  hero: Hero;
  wear: WearSettings;
}

export interface BagLine {
  productId: string;
  size: string;
  colour: string;
  qty: number;
}

export interface Session {
  role: Role;
  email: string;
  name: string;
}

export type FitTab = "guide" | "fit" | "real";

export interface UiState {
  bagOpen: boolean;
  menuOpen: boolean;
  fitRoom: { open: boolean; tab: FitTab; productId?: string };
  toast: string | null;
}

/** A generated try-on image the customer kept; the picture itself lives in IndexedDB under `look-<id>`. */
export interface SavedLook {
  id: string;
  items: string[];
  at: number;
}

export interface State {
  v: 1;
  shop: PublicShop;
  /** role "admin" = the shop's owner (sees drafts, edits in place); "customer" = signed-in shopper. */
  session: Session;
  /** The signed-in shopper, if any (the owner can be both). */
  customer: { email: string; name: string } | null;
  draft: SiteContent;
  published: SiteContent;
  bag: BagLine[];
  wishlist: string[];
  orders: Order[];
  fit: BodyProfile;
  looks: SavedLook[];
  /** The customer agreed to send their photo to the try-on service. */
  tryonConsent: boolean;
  ui: UiState;
}

const EMPTY_THEME: ThemeContent = {
  sections: [],
  hero: { title: "", kicker: "", cta: "", body: "" },
  wear: { garmentIds: [], topPct: 23, scalePct: 84, xPct: 0, colorPhotos: true, rotateSeconds: 3, title: "" },
};
const UI: UiState = { bagOpen: false, menuOpen: false, fitRoom: { open: false, tab: "fit" }, toast: null };
const GUEST: Session = { role: "guest", email: "", name: "" };

/** crate-style order for the account page, from the server's order record. */
export const toOrder = (o: OrderRecord): Order => ({
  no: o.no, email: o.email, date: new Date(o.createdAt).toISOString().slice(0, 10), lines: o.lines, itemCount: o.itemCount, total: o.total, status: o.status,
});

/** The state a page starts from: server data only (no browser data), identical on server and client. */
export function stateFromBoot(b: ShopBoot): State {
  const published: SiteContent = { products: b.products.filter((p) => p.live), ...b.published };
  const draft: SiteContent = b.owner && b.draft ? { products: b.products, ...b.draft } : published;
  const session: Session = b.owner
    ? { role: "admin", email: b.owner.email, name: b.owner.name }
    : b.customer
      ? { role: "customer", email: b.customer.email, name: b.customer.name }
      : GUEST;
  return {
    v: 1,
    shop: b.shop,
    session,
    customer: b.customer ? { email: b.customer.email, name: b.customer.name } : null,
    draft,
    published,
    bag: [],
    wishlist: [],
    orders: b.orders.map(toOrder),
    fit: { h: 178, w: 74, ...(b.customer?.fit ?? {}) } as BodyProfile,
    looks: [],
    tryonConsent: false,
    ui: UI,
  };
}

const INITIAL: State = {
  v: 1,
  shop: { id: "", slug: "", name: "", images: {}, settings: {} as PublicShop["settings"] },
  session: GUEST,
  customer: null,
  draft: { products: [], ...EMPTY_THEME },
  published: { products: [], ...EMPTY_THEME },
  bag: [],
  wishlist: [],
  orders: [],
  fit: { h: 178, w: 74 },
  looks: [],
  tryonConsent: false,
  ui: UI,
};

let state: State = INITIAL;
let bootNonce = "";
const listeners = new Set<() => void>();

const storageKey = () => `lokeify:${state.shop.slug}:v1`;
type Saved = Pick<State, "bag" | "wishlist" | "fit" | "looks" | "tryonConsent">;

function readSaved(slug: string): Partial<Saved> {
  try {
    const raw = window.localStorage.getItem(`lokeify:${slug}:v1`);
    return raw ? (JSON.parse(raw) as Partial<Saved>) : {};
  } catch {
    return {};
  }
}

function persist() {
  try {
    const { bag, wishlist, fit, looks, tryonConsent } = state;
    window.localStorage.setItem(storageKey(), JSON.stringify({ bag, wishlist, fit, looks, tryonConsent }));
  } catch {
    // Storage full or blocked: the session keeps working in memory.
  }
}

/** Point the module at the shop being viewed (safe to call during render; only acts when the data changed). */
export function hydrateStore(b: ShopBoot) {
  setShopSlug(b.shop.slug);
  setCurrency(b.shop.settings.currency);
  applyShopSettings(b.shop.settings);
  if (typeof window === "undefined") return;
  if (bootNonce === b.nonce && state.shop.slug === b.shop.slug) return;
  const sameShop = state.shop.slug === b.shop.slug;
  bootNonce = b.nonce;
  setImageRegistry(b.shop.images);
  const base = stateFromBoot(b);
  const saved = readSaved(b.shop.slug);
  const products = base.draft.products;
  state = {
    ...base,
    bag: (saved.bag ?? []).filter((l) => products.some((p) => p.id === l.productId)),
    wishlist: saved.wishlist ?? [],
    // A signed-in customer's saved profile wins over this browser's.
    fit: b.customer?.fit ? base.fit : { ...base.fit, ...saved.fit },
    looks: saved.looks ?? [],
    tryonConsent: saved.tryonConsent ?? false,
    ui: sameShop ? state.ui : UI,
  };
  queueMicrotask(() => listeners.forEach((l) => l()));
}

function set(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const next = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...next };
  const uiOnly = Object.keys(next).every((k) => k === "ui");
  if (!uiOnly) persist();
  listeners.forEach((l) => l());
}

function setUi(patch: Partial<UiState>) {
  set((s) => ({ ui: { ...s.ui, ...patch } }));
}

if (typeof window !== "undefined") {
  // Keep several open tabs of the same shop in step.
  window.addEventListener("storage", (e) => {
    if (!state.shop.slug || e.key !== storageKey()) return;
    const saved = readSaved(state.shop.slug);
    state = { ...state, ...saved };
    listeners.forEach((l) => l());
  });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore(): State {
  const boot = useContext(ShopContext);
  const server = boot ? serverSnapshot(boot) : INITIAL;
  return useSyncExternalStore(subscribe, () => (state.shop.slug ? state : server), () => server);
}

const snapshots = new WeakMap<ShopBoot, State>();
function serverSnapshot(b: ShopBoot): State {
  let s = snapshots.get(b);
  if (!s) snapshots.set(b, (s = stateFromBoot(b)));
  return s;
}

const noop = () => () => {};
/** False during SSR and hydration, true once the browser's saved state is in use. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}

export function getState(): State {
  return state;
}

// ── Derived reads ──────────────────────────────────────────────────────────

/** The owner sees their draft theme and hidden products; everyone else sees what was published. */
export function siteFor(s: State): SiteContent {
  return s.session.role === "admin" ? s.draft : s.published;
}

export function isDirty(s: State): boolean {
  const theme = (c: SiteContent) => JSON.stringify([c.sections, c.hero, c.wear]);
  return theme(s.draft) !== theme(s.published);
}

export function productById(s: State, id: string): Product | undefined {
  return siteFor(s).products.find((p) => p.id === id);
}

export function bagCount(s: State): number {
  return s.bag.reduce((a, l) => a + l.qty, 0);
}

export function bagLines(s: State) {
  const products = siteFor(s).products;
  return s.bag.flatMap((l) => {
    const p = products.find((x) => x.id === l.productId);
    return p ? [{ ...l, product: p, lineTotal: p.price * l.qty }] : [];
  });
}

export function bagSubtotal(s: State): number {
  return bagLines(s).reduce((a, l) => a + l.lineTotal, 0);
}

export function stockLeft(p: Product): number {
  return Object.values(p.stock).reduce((a, n) => a + n, 0);
}

// ── Session (customer accounts, per shop) ──────────────────────────────────

interface AccountReply {
  customer: { email: string; name: string; fit: Partial<BodyProfile> | null } | null;
  orders?: OrderRecord[];
}

function applyAccount(r: AccountReply) {
  set((s) => ({
    customer: r.customer ? { email: r.customer.email, name: r.customer.name } : null,
    session: s.session.role === "admin" ? s.session : r.customer ? { role: "customer", email: r.customer.email, name: r.customer.name } : GUEST,
    orders: (r.orders ?? []).map(toOrder),
    fit: r.customer?.fit ? ({ ...s.fit, ...r.customer.fit } as BodyProfile) : s.fit,
  }));
}

/** Sign in (or with `name`, create an account). Resolves to the role, or throws with a message to show. */
export async function signIn(email: string, password: string, name?: string): Promise<Role> {
  const r = await json<AccountReply>(shopApi(name !== undefined ? "/account/signup" : "/account/login"), {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
  applyAccount(r);
  // New accounts keep the fit profile this browser already had.
  if (name !== undefined) void saveFitRemote();
  return state.session.role;
}

export async function signOut() {
  await fetch(shopApi("/account/logout"), { method: "POST" }).catch(() => undefined);
  set((s) => ({
    customer: null,
    orders: [],
    session: s.session.role === "admin" ? s.session : GUEST,
    ui: { ...s.ui, bagOpen: false, menuOpen: false },
  }));
}

// ── Bag ────────────────────────────────────────────────────────────────────

export function addToBag(productId: string, size: string, colour: string) {
  set((s) => {
    const i = s.bag.findIndex((l) => l.productId === productId && l.size === size && l.colour === colour);
    const bag = i >= 0 ? s.bag.map((l, j) => (j === i ? { ...l, qty: l.qty + 1 } : l)) : [...s.bag, { productId, size, colour, qty: 1 }];
    return { bag, ui: { ...s.ui, bagOpen: true, fitRoom: { ...s.ui.fitRoom, open: false } } };
  });
}

export function setQty(index: number, qty: number) {
  set((s) => ({ bag: qty <= 0 ? s.bag.filter((_, j) => j !== index) : s.bag.map((l, j) => (j === index ? { ...l, qty } : l)) }));
}

export function toggleWishlist(productId: string) {
  set((s) => ({ wishlist: s.wishlist.includes(productId) ? s.wishlist.filter((x) => x !== productId) : [...s.wishlist, productId] }));
}

export interface CheckoutInput {
  email: string;
  name: string;
  shipMethod: "standard" | "express" | "pickup";
  payMethod: string;
  address: { first: string; last: string; address: string; city: string; postcode: string; country: string } | null;
}

/** Places the order on the server (which prices it and takes the stock), then empties the bag. */
export async function placeOrder(input: CheckoutInput): Promise<Order> {
  const lines = state.bag.map(({ productId, size, colour, qty }) => ({ productId, size, colour, qty }));
  const { order } = await json<{ order: OrderRecord }>(shopApi("/orders"), { method: "POST", body: JSON.stringify({ ...input, lines }) });
  const taken = new Map<string, number>();
  for (const l of order.lines) taken.set(`${l.productId}|${l.size}`, (taken.get(`${l.productId}|${l.size}`) ?? 0) + l.qty);
  const lessStock = (c: SiteContent): SiteContent => ({
    ...c,
    products: c.products.map((p) => {
      const stock = { ...p.stock };
      let hit = false;
      for (const z of Object.keys(stock)) {
        const n = taken.get(`${p.id}|${z}`);
        if (n) (stock[z] = Math.max(0, stock[z] - n)), (hit = true);
      }
      return hit ? { ...p, stock } : p;
    }),
  });
  const o = toOrder(order);
  set((s) => ({ orders: [o, ...s.orders], bag: [], draft: lessStock(s.draft), published: lessStock(s.published) }));
  return o;
}

// ── Fit profile ────────────────────────────────────────────────────────────

let fitTimer: ReturnType<typeof setTimeout> | undefined;
async function saveFitRemote() {
  if (!state.customer) return;
  await fetch(shopApi("/account"), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fit: state.fit }) }).catch(() => undefined);
}

/** Update the body profile. Passing `undefined` for a measurement goes back to the estimate. */
export function setFit(patch: Partial<BodyProfile>) {
  set((s) => {
    const fit: BodyProfile = { ...s.fit, ...patch };
    for (const k of Object.keys(patch) as (keyof BodyProfile)[]) if (fit[k] === undefined) delete (fit as Partial<BodyProfile>)[k];
    return { fit };
  });
  clearTimeout(fitTimer);
  fitTimer = setTimeout(() => void saveFitRemote(), 800);
}

// ── Photo try-on ───────────────────────────────────────────────────────────

export function saveLook(look: SavedLook) {
  set((s) => ({ looks: [look, ...s.looks].slice(0, 12) }));
}
export function removeLook(id: string) {
  set((s) => ({ looks: s.looks.filter((l) => l.id !== id) }));
}
export function setTryonConsent(tryonConsent: boolean) {
  set({ tryonConsent });
}
export function clearLooks() {
  set({ looks: [] });
}

// ── UI ─────────────────────────────────────────────────────────────────────

export const openBag = () => setUi({ bagOpen: true });
export const closeBag = () => setUi({ bagOpen: false });
export const setMenu = (menuOpen: boolean) => setUi({ menuOpen });
export const openFitRoom = (tab: FitTab, productId?: string) => setUi({ fitRoom: { open: true, tab, productId } });
export const setFitTab = (tab: FitTab) => setUi({ fitRoom: { ...state.ui.fitRoom, tab } });
export const closeFitRoom = () => setUi({ fitRoom: { ...state.ui.fitRoom, open: false } });

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(message: string) {
  setUi({ toast: message });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => setUi({ toast: null }), 3200);
}

// ── Owner: edit in place (saved to the shop; the theme stays a draft until published in Admin) ──

const productTimers = new Map<string, ReturnType<typeof setTimeout>>();
const productPatches = new Map<string, Partial<Product>>();

export function updateProduct(id: string, patch: Partial<Product>) {
  if (state.session.role !== "admin") return;
  const apply = (c: SiteContent): SiteContent => ({ ...c, products: c.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  set((s) => ({ draft: apply(s.draft), published: apply(s.published) }));
  productPatches.set(id, { ...productPatches.get(id), ...patch });
  clearTimeout(productTimers.get(id));
  productTimers.set(
    id,
    setTimeout(() => {
      const body = productPatches.get(id);
      productPatches.delete(id);
      void json(adminApi(`/products/${encodeURIComponent(id)}`), { method: "PATCH", body: JSON.stringify(body) }).catch((e: Error) => toast(e.message));
    }, 600),
  );
}

/** Set one garment measurement for one size; an empty value clears it. */
export function updateMeasurement(id: string, size: string, key: MeasureKey, value: number | undefined) {
  const p = state.draft.products.find((x) => x.id === id);
  if (!p) return;
  const row: Measurements = { ...p.measurements?.[size] };
  if (value === undefined) delete row[key];
  else row[key] = value;
  updateProduct(id, { measurements: { ...p.measurements, [size]: row } });
}

let themeTimer: ReturnType<typeof setTimeout> | undefined;
function editDraft(fn: (d: SiteContent) => Partial<SiteContent>) {
  if (state.session.role !== "admin") return;
  set((s) => ({ draft: { ...s.draft, ...fn(s.draft) } }));
  clearTimeout(themeTimer);
  themeTimer = setTimeout(() => {
    const { sections, hero, wear } = state.draft;
    void json(adminApi("/theme"), { method: "PUT", body: JSON.stringify({ sections, hero, wear }) }).catch((e: Error) => toast(e.message));
  }, 600);
}

export function updateHero(patch: Partial<Hero>) {
  editDraft((d) => ({ hero: { ...d.hero, ...patch } }));
}

export function updateWear(patch: Partial<WearSettings>) {
  editDraft((d) => ({ wear: { ...d.wear, ...patch } }));
}

/** Adjust one garment's fit on the model photo; the others keep theirs. */
export function updateWearFit(productId: string, patch: Partial<WearFit>) {
  editDraft((d) => ({
    wear: { ...d.wear, fits: { ...d.wear.fits, [productId]: { ...wearFitOf(d.wear, productId), ...patch } } },
  }));
}

/** Copy one garment's fit to every garment in rotation. */
export function applyWearFitToAll(productId: string) {
  editDraft((d) => {
    const fit = wearFitOf(d.wear, productId);
    return { wear: { ...d.wear, ...fit, fits: Object.fromEntries(d.wear.garmentIds.map((id) => [id, fit])) } };
  });
}

export async function publish() {
  await json(adminApi("/theme/publish"), { method: "POST" });
  set((s) => ({ published: { ...s.published, sections: s.draft.sections, hero: s.draft.hero, wear: s.draft.wear } }));
}
