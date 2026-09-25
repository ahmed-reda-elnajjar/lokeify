"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { PublicShop } from "@/shared/shop";

interface AdminCtx {
  shop: PublicShop;
  images: Record<string, string>;
  setImages: (m: Record<string, string>) => void;
  setShop: (s: PublicShop) => void;
}

const Ctx = createContext<AdminCtx | null>(null);

export function AdminProvider({ shop: initial, children }: { shop: PublicShop; children: ReactNode }) {
  const [shop, setShop] = useState(initial);
  const [images, setImages] = useState(initial.images);
  return <Ctx.Provider value={{ shop, images, setImages, setShop }}>{children}</Ctx.Provider>;
}

export function useAdmin() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdmin outside AdminProvider");
  return c;
}

/** Money in the shop's currency. */
export function useMoney() {
  const { shop } = useAdmin();
  const f = new Intl.NumberFormat("en-US", { style: "currency", currency: shop.settings.currency, maximumFractionDigits: 2 });
  return (n: number) => f.format(n);
}
