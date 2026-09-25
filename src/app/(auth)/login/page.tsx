import { redirect } from "next/navigation";
import { currentMerchant } from "@/server/auth";
import LoginForm from "@/admin/LoginForm";

export const metadata = { title: "Log in" };

export default async function LoginPage() {
  if (await currentMerchant()) redirect("/admin");
  return <LoginForm />;
}
