import { notFound } from "next/navigation";
import { ownedShop } from "@/server/auth";
import { storageMode } from "@/server/db";
import { publicShop, shopsOf, toFulfilCount } from "@/server/shops";
import AdminShell from "@/admin/AdminShell";

export default async function ShopAdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ shop: string }> }) {
  const owned = await ownedShop((await params).shop);
  if (!owned) notFound();
  const { merchant, shop } = owned;
  const [pub, shops, toFulfil] = await Promise.all([publicShop(shop), shopsOf(merchant.id), toFulfilCount(shop.id)]);
  return (
    <AdminShell
      shop={pub}
      shops={shops.map((s) => ({ slug: s.slug, name: s.name }))}
      merchant={{ name: merchant.name, email: merchant.email }}
      toFulfil={toFulfil}
      ephemeral={storageMode() === "ephemeral"}
    >
      {children}
    </AdminShell>
  );
}
