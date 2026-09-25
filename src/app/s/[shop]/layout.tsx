import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import "@/storefront/styles/modernist.css";
import "@/storefront/styles/crate.css";
import { ShopProvider } from "@/storefront/components/ShopProvider";
import { loadStorefront } from "@/server/storefront";
import { settingsOf, shopBySlug } from "@/server/shops";
import { ensureSeeded } from "@/server/seed";

type Props = { children: React.ReactNode; params: Promise<{ shop: string }> };

export async function generateMetadata({ params }: { params: Promise<{ shop: string }> }): Promise<Metadata> {
  const { shop: slug } = await params;
  await cookies();
  await ensureSeeded();
  const row = await shopBySlug(slug);
  if (!row) return { title: "Store not found" };
  return { title: { default: row.name, template: `%s · ${row.name}` }, description: settingsOf(row).tagline };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f3f2f2" };

/** Every store on Lokeify lives at /s/<slug>. */
export default async function StorefrontLayout({ children, params }: Props) {
  const boot = await loadStorefront((await params).shop);
  if (!boot) notFound();
  return <ShopProvider boot={boot}>{children}</ShopProvider>;
}
