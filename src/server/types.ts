import type { Product } from "@/storefront/lib/data";
import type { ThemeContent } from "@/shared/shop";

export type { Product };
export type SiteContentLike = ThemeContent & { products: Product[] };
