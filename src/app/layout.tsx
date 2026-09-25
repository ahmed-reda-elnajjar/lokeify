import type { Metadata } from "next";
import { Inter } from "next/font/google";

// Root shell only. Each area brings its own styles:
//   (marketing), (auth), admin → Tailwind (globals.css)
//   s/[shop]                   → the storefront theme (src/storefront/styles)
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Lokeify — Fashion stores with a 3D fit room", template: "%s · Lokeify" },
  description:
    "Launch your fashion store with a 3D fit room, AI photo try-on and size recommendations built in — the commerce platform for Egyptian fashion brands.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
