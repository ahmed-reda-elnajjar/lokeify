import { redirect } from "next/navigation";
import { currentMerchant } from "@/server/auth";
import { shopsOf } from "@/server/shops";

export default async function AdminIndex() {
  const me = await currentMerchant();
  if (!me) redirect("/login");
  const first = (await shopsOf(me.id))[0];
  redirect(first ? `/admin/${first.slug}` : "/admin/new");
}
