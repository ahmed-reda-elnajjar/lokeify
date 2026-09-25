import { redirect } from "next/navigation";
import { currentMerchant } from "@/server/auth";
import SignupForm from "@/admin/SignupForm";

export const metadata = { title: "Start your store" };

export default async function SignupPage() {
  if (await currentMerchant()) redirect("/admin/new");
  return <SignupForm />;
}
