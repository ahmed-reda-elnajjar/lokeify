import "../globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { currentMerchant } from "@/server/auth";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const me = await currentMerchant();
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar signedIn={!!me} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
