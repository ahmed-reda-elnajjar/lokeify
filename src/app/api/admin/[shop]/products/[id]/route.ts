import { adminShop, body, fail, ok, unauthorized } from "@/server/http";
import { deleteProduct, getProduct, updateProduct } from "@/server/shops";
import { cleanProduct } from "@/server/validate";
import type { Product } from "@/storefront/lib/data";

type Ctx = { params: Promise<{ shop: string; id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const a = await adminShop(params);
  if (!a) return unauthorized();
  const p = await getProduct(a.shop.id, (await params).id);
  return p ? ok({ product: p }) : fail("Product not found.", 404);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const a = await adminShop(params);
  if (!a) return unauthorized();
  const b = await body<Partial<Product>>(req);
  if (!b) return fail("Invalid request.");
  const p = await updateProduct(a.shop.id, (await params).id, cleanProduct(b));
  return p ? ok({ product: p }) : fail("Product not found.", 404);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const a = await adminShop(params);
  if (!a) return unauthorized();
  await deleteProduct(a.shop.id, (await params).id);
  return ok();
}
