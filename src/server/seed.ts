// First run: a demo merchant with the CRATE store (the original crate-store
// catalogue, lookbook and settings), so the platform has something to show.
//   Admin:    demo@lokeify.com / demo1234  → /admin/crate
//   Customer: sam@example.com  / demo1234  → /s/crate/signin

import { one, run, tx } from "./db";
import { hashPassword, newId } from "./crypto";
import { createCustomer, createShop, defaultSettings, placeOrder, shopBySlug, type ShopRow } from "./shops";
import { SEED_HERO, SEED_PRODUCTS, SEED_SECTIONS, SEED_WEAR, SEED_TRENDING, type Product, type WearSettings } from "@/storefront/lib/data";
import type { ThemeContent } from "@/shared/shop";


const demoPhoto = (p?: string) => (p ? `/demo/crate${p}` : undefined);

/** The CRATE catalogue with its photos pointing at public/demo/crate. */
export function demoProducts(): Product[] {
  return SEED_PRODUCTS.map((p) => ({ ...p, photo: demoPhoto(p.photo) }));
}

export function demoTheme(): ThemeContent {
  const wear: WearSettings = {
    ...SEED_WEAR,
    images: Object.fromEntries(Object.entries(SEED_WEAR.images ?? {}).map(([k, v]) => [k, `/demo/crate${v}`])),
  };
  return { sections: SEED_SECTIONS, hero: SEED_HERO, wear };
}

function nextSaturday10Cet() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + ((6 - d.getUTCDay() + 7) % 7 || 7));
  d.setUTCHours(8, 0, 0, 0);
  return d;
}

let seeding: Promise<void> | null = null;

/** Creates the demo store the first time the platform starts (once, even with several servers). */
export function ensureSeeded(): Promise<void> {
  if (!seeding) {
    seeding = seed().catch(async () => {
      // Another server may be seeding the same database right now: look again once.
      await new Promise((r) => setTimeout(r, 400));
      return seed();
    }).catch((e) => {
      seeding = null;
      throw e;
    });
  }
  return seeding;
}

async function seed() {
  if (await one(`SELECT id FROM merchants LIMIT 1`)) return;
  await tx(async () => {
    const claim = await run(`INSERT INTO meta (key, value) VALUES ('seeded', ?) ON CONFLICT(key) DO NOTHING`, String(Date.now()));
    if (!claim.changes) return;

    const merchantId = newId("mer_");
    await run(`INSERT INTO merchants (id, email, name, password, created_at) VALUES (?, ?, ?, ?, ?)`, merchantId, "demo@lokeify.com", "Crate Team", hashPassword("demo1234"), Date.now());

    const drop = nextSaturday10Cet();
    const shop = await createShop(merchantId, {
      name: "CRATE",
      slug: "crate",
      currency: "USD",
      theme: demoTheme(),
      products: demoProducts(),
      settings: {
        ...defaultSettings("USD"),
        tagline: "Limited runs. No restocks.",
        contactEmail: "hello@crate.store",
        freeShippingOver: 150,
        standardShipping: 8,
        expressShipping: 12,
        taxRate: 0.19,
        drop: { name: "Drop 08", at: drop.toISOString(), label: `${drop.toUTCString().slice(0, 11)}, 10:00 CET`, earlyAccessMinutes: 30 },
        trending: SEED_TRENDING,
      },
    });
    await seedOrders(shop);
  });
}

async function seedOrders(shop: ShopRow) {
  const sam = await createCustomer(shop.id, { email: "sam@example.com", name: "Sam Okafor", passwordHash: hashPassword("demo1234") });
  const address = { first: "Sam", last: "Okafor", address: "Torstraße 12", city: "Berlin", postcode: "10119", country: "Germany" };
  const orders: [string, string, number, string][] = [
    ["480gsm-hoodie", "L", 21, "Delivered"],
    ["double-knee-carpenter", "32", 9, "Delivered"],
    ["boxy-heavy-tee", "M", 2, "In transit"],
  ];
  for (const [productId, size, daysAgo, status] of orders) {
    const o = await placeOrder(shop, sam.id, {
      lines: [{ productId, size, colour: "Black", qty: 1 }], email: sam.email, name: sam.name, shipMethod: "standard", payMethod: "card", address,
    });
    await run(`UPDATE orders SET created_at = ?, status = ? WHERE id = ?`, Date.now() - daysAgo * 86400000, status, o.id);
  }
}

export const demoShopExists = async () => !!(await shopBySlug("crate"));
