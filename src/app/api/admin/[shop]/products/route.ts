import { adminShop, body, ok, unauthorized } from "@/server/http";
import { createProduct, listProducts } from "@/server/shops";
import { cleanProduct } from "@/server/validate";
import type { Product } from "@/storefront/lib/data";

type Ctx = { params: Promise<{ shop: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const a = await adminShop(params);
  if (!a) return unauthorized();
  return ok({ products: await listProducts(a.shop.id) });
}

export async function POST(req: Request, { params }: Ctx) {
  const a = await adminShop(params);
  if (!a) return unauthorized();
  const b = (await body<Partial<Product>>(req)) ?? {};
  return ok({ product: await createProduct(a.shop.id, cleanProduct(b)) });
}
