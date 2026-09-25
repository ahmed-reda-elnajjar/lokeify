import { redirect } from "next/navigation";
import "../globals.css";
import { currentMerchant } from "@/server/auth";

export const metadata = { title: { default: "Admin", template: "%s · Lokeify admin" } };

export default async function AdminRoot({ children }: { children: React.ReactNode }) {
  if (!(await currentMerchant())) redirect("/login");
  return <div className="min-h-screen bg-section text-foreground">{children}</div>;
}
