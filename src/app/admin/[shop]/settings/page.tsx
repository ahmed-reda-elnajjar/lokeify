import { notFound } from "next/navigation";
import { ownedShop } from "@/server/auth";
import { settingsOf } from "@/server/shops";
import SettingsView from "@/admin/views/SettingsView";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ params }: { params: Promise<{ shop: string }> }) {
  const owned = await ownedShop((await params).shop);
  if (!owned) notFound();
  return <SettingsView name={owned.shop.name} settings={settingsOf(owned.shop)} />;
}
