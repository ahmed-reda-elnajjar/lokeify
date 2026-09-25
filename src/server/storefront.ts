// What a storefront page view needs from the server, in one object.

import crypto from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { currentCustomer, currentMerchant } from "./auth";
import { ensureSeeded } from "./seed";
import { customerFit, listProducts, ordersOfCustomer, publicShop, shopBySlug, themeOf } from "./shops";
import type { ShopBoot } from "@/storefront/lib/context";

export const loadStorefront = cache(async (slug: string): Promise<ShopBoot | null> => {
  await cookies(); // dynamic page: never prerendered at build time
  await ensureSeeded();
  const row = await shopBySlug(slug);
  if (!row) return null;
  const [merchant, customer] = await Promise.all([currentMerchant(), currentCustomer(row)]);
  const isOwner = !!merchant && merchant.id === row.owner_id;
  const [shop, orders, products] = await Promise.all([
    publicShop(row),
    customer ? ordersOfCustomer(row.id, customer.id) : Promise.resolve([]),
    listProducts(row.id, { liveOnly: !isOwner }),
  ]);
  return {
    shop,
    owner: isOwner ? { email: merchant!.email, name: merchant!.name } : null,
    customer: customer ? { email: customer.email, name: customer.name, fit: customerFit(customer) } : null,
    orders,
    products,
    published: themeOf(row, "published"),
    draft: isOwner ? themeOf(row, "draft") : null,
    nonce: crypto.randomBytes(6).toString("hex"),
  };
});
