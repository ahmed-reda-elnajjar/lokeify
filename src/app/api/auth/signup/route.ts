import { one, run, tx } from "@/server/db";
import { hashPassword, newId } from "@/server/crypto";
import { startMerchantSession, validEmail } from "@/server/auth";
import { ensureSeeded, demoProducts, demoTheme, seedDemoImages } from "@/server/seed";
import { createShop, slugAvailable } from "@/server/shops";
import { body, fail, ok } from "@/server/http";
import { CURRENCIES, slugify } from "@/shared/shop";

/** Create a merchant account and their first store in one step (like Shopify's sign-up). */
export async function POST(req: Request) {
  await ensureSeeded();
  const b = await body<{ name?: string; email?: string; password?: string; storeName?: string; slug?: string; currency?: string; demo?: boolean }>(req);
  if (!b) return fail("Invalid request.");
  const name = (b.name ?? "").trim();
  const storeName = (b.storeName ?? "").trim();
  const slug = slugify(b.slug || storeName);
  const currency = CURRENCIES.includes(b.currency as (typeof CURRENCIES)[number]) ? b.currency! : "EGP";
  if (!name) return fail("Tell us your name.");
  if (!validEmail(b.email)) return fail("Enter a valid email address.");
  if (typeof b.password !== "string" || b.password.length < 8) return fail("Use a password of at least 8 characters.");
  if (storeName.length < 2) return fail("Give your store a name.");
  if (!(await slugAvailable(slug))) return fail(`The address /s/${slug || "…"} is taken or not allowed. Try another store address.`);
  const email = b.email.trim().toLowerCase();
  if (await one(`SELECT id FROM merchants WHERE email = ?`, email)) return fail("There's already an account with that email. Log in instead.");

  const merchantId = newId("mer_");
  const password = hashPassword(b.password);
  let shop;
  try {
    shop = await tx(async () => {
      await run(`INSERT INTO merchants (id, email, name, password, created_at) VALUES (?, ?, ?, ?, ?)`, merchantId, email, name, password, Date.now());
      return createShop(merchantId, {
        name: storeName,
        slug,
        currency,
        ...(b.demo ? { products: demoProducts(), theme: { ...demoTheme(), hero: { ...demoTheme().hero, title: storeName.toUpperCase() } } } : {}),
      });
    });
  } catch (e) {
    if (e instanceof Error && /UNIQUE/i.test(e.message)) return fail("That email or store address was just taken. Try another.");
    throw e;
  }
  if (b.demo) await seedDemoImages(shop.id);
  await startMerchantSession(merchantId);
  return ok({ slug: shop.slug });
}
