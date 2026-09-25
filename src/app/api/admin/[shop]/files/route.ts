import { adminShop, fail, ok, unauthorized } from "@/server/http";
import { deleteUpload, fileRegistry, saveUploadPiece, UploadError } from "@/server/files";
import { isShopSlot } from "@/shared/shop";

type Ctx = { params: Promise<{ shop: string }> };

export const maxDuration = 60;

/**
 * multipart/form-data with `slot` and `file`. Big files come in pieces (see
 * src/shared/upload.ts): `part`, `parts`, `size`, `type`, `name`, and from the
 * second piece on the `upload` id the first reply gave. Replies `{ upload }` while
 * pieces are missing, then the shop's file map.
 */
export async function POST(req: Request, { params }: Ctx) {
  const a = await adminShop(params);
  if (!a) return unauthorized();
  const form = await req.formData().catch(() => null);
  const slot = form?.get("slot");
  const file = form?.get("file");
  if (typeof slot !== "string" || !isShopSlot(slot) || !(file instanceof Blob)) return fail("Send a slot and a file.");
  const field = (k: string) => {
    const v = form!.get(k);
    return typeof v === "string" ? v : undefined;
  };
  const named = file instanceof File ? file : null;
  const parts = field("parts");
  try {
    const upload = await saveUploadPiece(a.shop.id, {
      slot,
      piece: file,
      part: parts ? Number(field("part")) : 0,
      parts: parts ? Number(parts) : 1,
      upload: field("upload"),
      filename: field("name") ?? named?.name ?? slot,
      type: field("type") || file.type || "application/octet-stream",
      size: parts ? Number(field("size")) : file.size,
    });
    if (upload) return ok({ upload });
  } catch (e) {
    if (e instanceof UploadError) return fail(e.message);
    console.error("upload failed", e);
    return fail("Upload failed.", 500);
  }
  const images = await fileRegistry(a.shop.id);
  return ok({ url: images[slot], images });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const a = await adminShop(params);
  if (!a) return unauthorized();
  const slot = new URL(req.url).searchParams.get("slot") ?? "";
  if (!isShopSlot(slot)) return fail("Bad slot.");
  await deleteUpload(a.shop.id, slot);
  return ok({ images: await fileRegistry(a.shop.id) });
}
