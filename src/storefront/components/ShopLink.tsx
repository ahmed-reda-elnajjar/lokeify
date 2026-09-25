"use client";

// next/link for the storefront: internal hrefs get the /s/<slug> prefix.
import NextLink from "next/link";
import { useContext, type ComponentProps } from "react";
import { shopHref } from "@/storefront/lib/shop";
import { ShopContext } from "@/storefront/lib/context";

type Props = ComponentProps<typeof NextLink>;

export default function Link({ href, ...rest }: Props) {
  const slug = useContext(ShopContext)?.shop.slug;
  const h = typeof href === "string" ? shopHref(href, slug) : href;
  return <NextLink href={h} {...rest} />;
}
