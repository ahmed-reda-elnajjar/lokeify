import { notFound } from "next/navigation";
import { ownedShop } from "@/server/auth";
import { listProducts, settingsOf, themeOf } from "@/server/shops";
import OnlineStoreView from "@/admin/views/OnlineStoreView";

export const metadata = { title: "Online store" };

export default async function OnlineStorePage({ params }: { params: Promise<{ shop: string }> }) {
  const owned = await ownedShop((await params).shop);
  if (!owned) notFound();
  const { shop } = owned;
  const s = settingsOf(shop);
  return (
    <OnlineStoreView
      draft={themeOf(shop, "draft")}
      published={themeOf(shop, "published")}
      products={(await listProducts(shop.id)).map((p) => ({ id: p.id, name: p.name, live: p.live, category: p.category }))}
      site={{ name: shop.name, tagline: s.tagline, drop: s.drop, trending: s.trending }}
    />
  );
}
