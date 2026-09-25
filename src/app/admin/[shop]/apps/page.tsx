import { notFound } from "next/navigation";
import { ownedShop } from "@/server/auth";
import { secretsOf, settingsOf } from "@/server/shops";
import AppsView from "@/admin/views/AppsView";

export const metadata = { title: "Fit room & try-on" };

export default async function AppsPage({ params }: { params: Promise<{ shop: string }> }) {
  const owned = await ownedShop((await params).shop);
  if (!owned) notFound();
  const key = (await secretsOf(owned.shop)).tryonKey;
  return (
    <AppsView
      settings={settingsOf(owned.shop)}
      keyHint={key ? `…${key.slice(-4)}` : null}
      envKey={!!(process.env.MODEL_API_KEY || process.env.META_API_KEY)}
    />
  );
}
