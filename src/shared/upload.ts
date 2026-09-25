// Browser side of shop file uploads. Files go up in pieces of at most 3 MB, since
// serverless hosts cap request bodies (Vercel: 4.5 MB); see src/server/files.ts.

export const UPLOAD_PIECE = 3 * 1024 * 1024;

export class UploadHttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/** Uploads `file` into `slot` through `endpoint` and returns the server's final reply. */
export async function uploadInPieces<T = { images: Record<string, string>; url?: string }>(
  endpoint: string,
  slot: string,
  file: Blob,
  filename: string,
  onProgress?: (done: number) => void,
): Promise<T> {
  const parts = Math.max(1, Math.ceil(file.size / UPLOAD_PIECE));
  const type = file.type || (/\.glb$/i.test(filename) ? "model/gltf-binary" : "application/octet-stream");
  let upload: string | undefined;
  for (let part = 0; part < parts; part++) {
    const form = new FormData();
    form.append("slot", slot);
    form.append("part", String(part));
    form.append("parts", String(parts));
    form.append("size", String(file.size));
    form.append("type", type);
    form.append("name", filename);
    if (upload) form.append("upload", upload);
    form.append("file", file.slice(part * UPLOAD_PIECE, (part + 1) * UPLOAD_PIECE, type), filename);
    const res = await fetch(endpoint, { method: "POST", body: form });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string; upload?: string };
    if (!res.ok) {
      const msg = res.status === 413 ? "That file is too big to upload here." : data.error ?? `Upload failed (${res.status}).`;
      throw new UploadHttpError(msg, res.status);
    }
    onProgress?.((part + 1) / parts);
    if (part === parts - 1) return data;
    if (!data.upload) throw new UploadHttpError("Upload failed.", 500);
    upload = data.upload;
  }
  throw new UploadHttpError("Upload failed.", 500);
}
