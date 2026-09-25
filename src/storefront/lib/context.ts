"use client";

import { createContext, useContext } from "react";
import type { OrderRecord, PublicShop, ThemeContent } from "@/shared/shop";
import type { Product } from "./data";
import type { BodyProfile } from "./fit";

/** Everything the server knows for this page view; rendered into the page once. */
export interface ShopBoot {
  shop: PublicShop;
  /** "admin" when the signed-in merchant owns this shop (they see drafts and can edit in place). */
  owner: { email: string; name: string } | null;
  customer: { email: string; name: string; fit: Partial<BodyProfile> | null } | null;
  orders: OrderRecord[];
  /** Live products for shoppers; every product for the owner. */
  products: Product[];
  published: ThemeContent;
  draft: ThemeContent | null;
  /** Changes on every server render, so a refresh re-reads the server data. */
  nonce: string;
}

export const ShopContext = createContext<ShopBoot | null>(null);

export function useShopBoot(): ShopBoot {
  const b = useContext(ShopContext);
  if (!b) throw new Error("Storefront component rendered outside <ShopProvider>.");
  return b;
}
