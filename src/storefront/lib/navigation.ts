"use client";

// next/navigation for the storefront: router pushes get the /s/<slug> prefix.
import { useContext, useMemo } from "react";
import { useRouter as useNextRouter } from "next/navigation";
import { shopHref } from "./shop";
import { ShopContext } from "./context";

export { useParams, usePathname, useSearchParams } from "next/navigation";

export function useRouter() {
  const r = useNextRouter();
  const slug = useContext(ShopContext)?.shop.slug;
  return useMemo(
    () => ({
      ...r,
      push: (href: string, opts?: Parameters<typeof r.push>[1]) => r.push(shopHref(href, slug), opts),
      replace: (href: string, opts?: Parameters<typeof r.replace>[1]) => r.replace(shopHref(href, slug), opts),
      prefetch: (href: string) => r.prefetch(shopHref(href, slug)),
    }),
    [r, slug],
  );
}
