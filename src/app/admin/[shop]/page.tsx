import { notFound } from "next/navigation";
import { ownedShop } from "@/server/auth";
import { fileRegistry, listOrders, listProducts, secretsOf, settingsOf, stats, themeOf } from "@/server/shops";
import HomeView from "@/admin/views/HomeView";

export default async function AdminHome({ params }: { params: Promise<{ shop: string }> }) {
  const owned = await ownedShop((await params).shop);
  if (!owned) notFound();
  const { shop, merchant } = owned;
  const [products, images, secrets, numbers, orders] = await Promise.all([
    listProducts(shop.id), fileRegistry(shop.id), secretsOf(shop), stats(shop.id), listOrders(shop.id),
  ]);
  const settings = settingsOf(shop);
  const setup = [
    { done: products.some((p) => images[`p-${p.id}-0`]), label: "Add a product with your own photo", href: "/products" },
    { done: !!images.hero, label: "Add a hero image to your home page", href: "/online-store" },
    { done: JSON.stringify(themeOf(shop, "draft")) === JSON.stringify(themeOf(shop, "published")), label: "Publish your theme changes", href: "/online-store" },
    { done: !settings.features.realTryOn || !!secrets.tryonKey || !!process.env.MODEL_API_KEY, label: "Connect photo try-on (Meta Model API key)", href: "/apps" },
    { done: products.some((p) => p.live && p.measurements && Object.keys(p.measurements).length), label: "Add garment measurements so the fit room can advise sizes", href: "/products" },
  ];
  return <HomeView name={merchant.name.split(" ")[0]} stats={numbers} recent={orders.slice(0, 6)} setup={setup} />;
}
