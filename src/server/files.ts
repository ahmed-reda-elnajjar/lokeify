// Uploaded files (product photos, hero, lookbook cut-outs, 3D .glb files, try-on
// model photos) are kept in the database in 512 KB chunks, so they work the same on
// a laptop and on serverless hosts with no lasting disk (Vercel). Browsers send big
// files in pieces of at most 3 MB (Vercel caps a request body at 4.5 MB), and
// /files/<shopId>/<name> streams them back.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { all, one, run, tx, DATA_DIR } from "./db";

/** Where versions before 0.2 wrote uploads; still read so old files keep working. */
const LEGACY_UPLOADS = path.join(DATA_DIR, "uploads");

const CHUNK = 512 * 1024;
const PIECE_MAX = 3.5 * 1024 * 1024;
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_MODEL = 40 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
};

export class UploadError extends Error {}

interface FileRow { shop_id: string; slot: string; path: string; mime: string; size: number; chunks: number; updated_at: number }

const nameOf = (rel: string) => rel.split("/").pop() ?? rel;
export const fileUrl = (shopId: string, rel: string) => `/files/${shopId}/${nameOf(rel)}`;

/** slot → public URL for everything the shop has uploaded. */
export async function fileRegistry(shopId: string): Promise<Record<string, string>> {
  const rows = await all<{ slot: string; path: string; updated_at: number }>(`SELECT slot, path, updated_at FROM files WHERE shop_id = ?`, shopId);
  // A path starting with "/" is a file shipped in public/ (the demo store's photos).
  return Object.fromEntries(rows.map((r) => [r.slot, r.path.startsWith("/") ? r.path : `${fileUrl(shopId, r.path)}?v=${r.updated_at}`]));
}

export interface UploadPiece {
  slot: string;
  piece: Blob;
  /** 0-based index of this piece, and how many there are. */
  part: number;
  parts: number;
  /** The id the server returned for the first piece (pieces after the first). */
  upload?: string;
  filename: string;
  type: string;
  /** Size of the whole file. */
  size: number;
}

/**
 * Stores one piece of an upload. Returns the upload id to send with the next piece,
 * or null once the last piece is in and the file has replaced the slot's old one.
 */
export async function saveUploadPiece(shopId: string, u: UploadPiece): Promise<string | null> {
  if (!/^[a-z0-9][a-z0-9-]{0,80}$/i.test(u.slot)) throw new UploadError("Bad slot name.");
  if (!(Number.isInteger(u.part) && Number.isInteger(u.parts) && u.parts >= 1 && u.parts <= 40 && u.part >= 0 && u.part < u.parts))
    throw new UploadError("Bad upload.");
  if (u.piece.size > PIECE_MAX) throw new UploadError("Send files in pieces of 3 MB or less.");
  const isModel = u.slot.startsWith("model-");
  const glb = /\.glb$/i.test(u.filename) || u.type === "model/gltf-binary";
  if (isModel && !glb) throw new UploadError("Use a .glb file (glTF binary, textures embedded).");
  if (!isModel && !u.type.startsWith("image/")) throw new UploadError("That file isn't an image.");
  if (!(u.size > 0)) throw new UploadError("That file is empty.");
  if (u.size > (isModel ? MAX_MODEL : MAX_IMAGE)) throw new UploadError(isModel ? "3D files must be under 40 MB." : "Images must be under 10 MB.");

  const buf = Buffer.from(await u.piece.arrayBuffer());
  let name: string;
  let idx = 0;
  if (u.part === 0) {
    if (isModel && buf.subarray(0, 4).toString("latin1") !== "glTF") throw new UploadError("That .glb file isn't valid.");
    name = `${u.slot}-${crypto.randomBytes(5).toString("hex")}.${isModel ? "glb" : TYPES[u.type] ?? "img"}`;
  } else {
    name = u.upload ?? "";
    if (!name.startsWith(`${u.slot}-`) || !/^[\w.-]+$/.test(name)) throw new UploadError("Bad upload.");
    if (await one(`SELECT 1 FROM files WHERE shop_id = ? AND path = ?`, shopId, `${shopId}/${name}`)) throw new UploadError("Bad upload.");
    const last = await one<{ n: number | null }>(`SELECT MAX(idx) AS n FROM file_chunks WHERE shop_id = ? AND name = ?`, shopId, name);
    if (last?.n == null) throw new UploadError("That upload expired. Try again.");
    idx = Number(last.n) + 1;
  }
  const now = Date.now();
  for (let off = 0; off < buf.length; off += CHUNK, idx++) {
    await run(`INSERT INTO file_chunks (shop_id, name, idx, data, created_at) VALUES (?, ?, ?, ?, ?)`, shopId, name, idx, buf.subarray(off, off + CHUNK), now);
  }
  if (u.part < u.parts - 1) return name;

  // Last piece: check nothing went missing, then swap the new file in.
  const got = await one<{ bytes: number | null; n: number }>(`SELECT SUM(length(data)) AS bytes, COUNT(*) AS n FROM file_chunks WHERE shop_id = ? AND name = ?`, shopId, name);
  if (Number(got?.bytes ?? 0) !== u.size) {
    await run(`DELETE FROM file_chunks WHERE shop_id = ? AND name = ?`, shopId, name);
    throw new UploadError("Part of the file went missing on the way. Try again.");
  }
  const old = await tx(async () => {
    const prev = await one<FileRow>(`SELECT * FROM files WHERE shop_id = ? AND slot = ?`, shopId, u.slot);
    await run(
      `INSERT INTO files (shop_id, slot, path, mime, size, chunks, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(shop_id, slot) DO UPDATE SET path = excluded.path, mime = excluded.mime, size = excluded.size, chunks = excluded.chunks, updated_at = excluded.updated_at`,
      shopId, u.slot, `${shopId}/${name}`, isModel ? "model/gltf-binary" : u.type, u.size, Number(got!.n), now,
    );
    if (prev) await run(`DELETE FROM file_chunks WHERE shop_id = ? AND name = ?`, shopId, nameOf(prev.path));
    return prev;
  });
  if (old && !old.chunks) unlinkLegacy(old.path);
  // Pieces of uploads that were abandoned half-way.
  await run(
    `DELETE FROM file_chunks WHERE shop_id = ? AND created_at < ?
       AND NOT EXISTS (SELECT 1 FROM files f WHERE f.shop_id = file_chunks.shop_id AND f.path = file_chunks.shop_id || '/' || file_chunks.name)`,
    shopId, now - 86400000,
  );
  return null;
}

/** Empties a slot. */
export async function deleteUpload(shopId: string, slot: string) {
  const old = await tx(async () => {
    const prev = await one<FileRow>(`SELECT * FROM files WHERE shop_id = ? AND slot = ?`, shopId, slot);
    if (!prev) return null;
    await run(`DELETE FROM files WHERE shop_id = ? AND slot = ?`, shopId, slot);
    await run(`DELETE FROM file_chunks WHERE shop_id = ? AND name = ?`, shopId, nameOf(prev.path));
    return prev;
  });
  if (old && !old.chunks) unlinkLegacy(old.path);
}

/** Removes the files in the slots `keep` picks (e.g. a deleted product's photos). */
export async function deleteSlots(shopId: string, pick: (slot: string) => boolean) {
  const rows = (await all<FileRow>(`SELECT * FROM files WHERE shop_id = ?`, shopId)).filter((r) => pick(r.slot));
  if (!rows.length) return;
  await tx(async () => {
    for (const r of rows) {
      await run(`DELETE FROM files WHERE shop_id = ? AND slot = ?`, shopId, r.slot);
      await run(`DELETE FROM file_chunks WHERE shop_id = ? AND name = ?`, shopId, nameOf(r.path));
    }
  });
  rows.filter((r) => !r.chunks).forEach((r) => unlinkLegacy(r.path));
}

/** A shop's file by its public name, as a stream. */
export async function openFile(shopId: string, name: string): Promise<{ mime: string; size: number; body: ReadableStream<Uint8Array> | ArrayBuffer } | null> {
  const f = await one<FileRow>(`SELECT * FROM files WHERE shop_id = ? AND path = ?`, shopId, `${shopId}/${name}`);
  if (!f) return null;
  if (!Number(f.chunks)) {
    const p = path.join(LEGACY_UPLOADS, f.path);
    if (!p.startsWith(LEGACY_UPLOADS) || !fs.existsSync(p)) return null;
    const buf = fs.readFileSync(p);
    return { mime: f.mime, size: buf.length, body: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer };
  }
  const count = Number(f.chunks);
  let i = 0;
  const body = new ReadableStream<Uint8Array>({
    async pull(ctrl) {
      if (i >= count) return ctrl.close();
      const c = await one<{ data: Uint8Array }>(`SELECT data FROM file_chunks WHERE shop_id = ? AND name = ? AND idx = ?`, shopId, name, i++);
      if (!c) return ctrl.error(new Error("File changed while it was being read."));
      ctrl.enqueue(c.data instanceof Uint8Array ? c.data : new Uint8Array(c.data as ArrayBuffer));
    },
  });
  return { mime: f.mime, size: Number(f.size), body };
}

function unlinkLegacy(rel: string) {
  if (rel.startsWith("/")) return; // shipped in public/, not an upload
  try {
    const p = path.join(LEGACY_UPLOADS, rel);
    if (p.startsWith(LEGACY_UPLOADS)) fs.unlinkSync(p);
  } catch {
    // already gone
  }
}
