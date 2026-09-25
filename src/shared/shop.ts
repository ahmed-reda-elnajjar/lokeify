// Types shared by the server, the merchant admin and the storefront.
// A shop's catalogue lives in the products table; everything a merchant designs
// (home sections, hero, wear carousel) is its "theme", edited as a draft and published.

import type { Hero, Product, Section, WearSettings } from "@/storefront/lib/data";

export interface ThemeContent {
  sections: Section[];
  hero: Hero;
  wear: WearSettings;
}

export interface SizeChartRow {
  size: string;
  eu: string;
  chest: string;
  waist: string;
  height: string;
}

export interface ShopFeatures {
  /** 3D fit room (Locker & fit tab) with the male / female avatars. */
  fitRoom: boolean;
  /** Photo try-on (Real try-on tab) through the shop's AI provider. */
  realTryOn: boolean;
  /** Size guide tab and size advice on product pages. */
  sizeGuide: boolean;
}

export type TryonProviderName = "meta" | "fashn" | "replicate" | "mock";

export interface ShopSettings {
  /** ISO 4217 code used for every price in the shop, e.g. "EGP", "USD". */
  currency: string;
  tagline: string;
  contactEmail: string;
  /** Orders at or above this subtotal ship free (standard shipping). 0 = never free. */
  freeShippingOver: number;
  standardShipping: number;
  expressShipping: number;
  /** VAT included in prices, e.g. 0.14 for 14 %. */
  taxRate: number;
  /** The next drop shown in the countdown banner. */
  drop: { name: string; at: string; label: string; earlyAccessMinutes: number };
  trending: string[];
  sizeChart: SizeChartRow[];
  features: ShopFeatures;
  tryonProvider: TryonProviderName;
  tryonDailyLimit: number;
}

/** What the storefront knows about a shop. Never includes secrets. */
export interface PublicShop {
  id: string;
  slug: string;
  name: string;
  settings: ShopSettings;
  /** Uploaded files by slot id ("hero", "p-<id>-0", "model-<id>", …) → URL. */
  images: Record<string, string>;
}

export interface OrderAddress {
  first: string;
  last: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  phone?: string;
}

export type PaymentStatus = "Paid" | "Pending" | "Refunded";
export type FulfillmentStatus = "Processing" | "In transit" | "Delivered" | "Returned" | "Cancelled";

export interface OrderRecord {
  id: string;
  no: string;
  shopId: string;
  customerId: string | null;
  email: string;
  name: string;
  lines: { productId: string; name: string; size: string; colour: string; qty: number; price: number }[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shipMethod: string;
  payMethod: string;
  address: OrderAddress | null;
  status: FulfillmentStatus;
  paymentStatus: PaymentStatus;
  createdAt: number;
}

export interface CustomerRecord {
  id: string;
  shopId: string;
  email: string;
  name: string;
  createdAt: number;
  orders?: number;
  spent?: number;
}

export type { Product };

export const CURRENCIES = ["EGP", "USD", "EUR", "GBP", "SAR", "AED"] as const;

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);

/** Slots whose files belong to the shop (uploaded by the merchant); everything else is the shopper's own, kept in their browser. */
export const isShopSlot = (slot: string) => /^(hero$|fit-model$|p-|wear-|model-|tryon-model-)/.test(slot);
