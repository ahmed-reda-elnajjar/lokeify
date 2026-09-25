// Sessions are signed cookies: "lk_m" for merchants (the admin), and one
// "lk_c_<shopId>" per shop for that shop's customers, so signing into one
// store never signs you into another.

import { cache } from "react";
import { cookies } from "next/headers";
import { one } from "./db";
import { sign, unsign } from "./crypto";
import { customerById, shopBySlug, type ShopRow } from "./shops";
import { ensureSeeded } from "./seed";

const DAY = 86400;
const M_COOKIE = "lk_m";
const cCookie = (shopId: string) => `lk_c_${shopId}`;

export interface MerchantRow { id: string; email: string; name: string; password: string; created_at: number }

const base = { httpOnly: true, sameSite: "lax" as const, path: "/", secure: process.env.NODE_ENV === "production" };

/** The signed-in merchant (cached for one page render: layouts and pages all ask). */
export const currentMerchant = cache(async (): Promise<MerchantRow | null> => {
  // cookies() first: it marks the page as dynamic, so `next build` never touches the database.
  const jar = await cookies();
  await ensureSeeded();
  const s = await unsign<{ m: string; exp: number }>(jar.get(M_COOKIE)?.value);
  if (!s || s.exp < Date.now()) return null;
  return (await one<MerchantRow>(`SELECT * FROM merchants WHERE id = ?`, s.m)) ?? null;
});

export async function startMerchantSession(merchantId: string) {
  const jar = await cookies();
  jar.set(M_COOKIE, await sign({ m: merchantId, exp: Date.now() + 30 * DAY * 1000 }), { ...base, maxAge: 30 * DAY });
}

export async function endMerchantSession() {
  (await cookies()).delete(M_COOKIE);
}

/** The shop, if the signed-in merchant owns it. */
export const ownedShop = cache(async (slug: string): Promise<{ merchant: MerchantRow; shop: ShopRow } | null> => {
  const merchant = await currentMerchant();
  if (!merchant) return null;
  const shop = await shopBySlug(slug);
  if (!shop || shop.owner_id !== merchant.id) return null;
  return { merchant, shop };
});

export async function currentCustomer(shop: ShopRow) {
  const jar = await cookies();
  const s = await unsign<{ c: string; exp: number }>(jar.get(cCookie(shop.id))?.value);
  if (!s || s.exp < Date.now()) return null;
  return customerById(shop.id, s.c);
}

export async function startCustomerSession(shop: ShopRow, customerId: string) {
  const jar = await cookies();
  jar.set(cCookie(shop.id), await sign({ c: customerId, exp: Date.now() + 60 * DAY * 1000 }), { ...base, maxAge: 60 * DAY });
}

export async function endCustomerSession(shop: ShopRow) {
  (await cookies()).delete(cCookie(shop.id));
}

export const validEmail = (e: unknown): e is string => typeof e === "string" && /^\S+@\S+\.\S+$/.test(e) && e.length <= 200;
