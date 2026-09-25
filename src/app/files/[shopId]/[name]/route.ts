import { openFile } from "@/server/files";

/**
 * Serves a shop's uploaded file, streamed from the database. Names carry a random
 * part, so browsers and the CDN can keep them forever.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ shopId: string; name: string }> }) {
  const { shopId, name } = await params;
  if (!/^[\w-]+$/.test(shopId) || !/^[\w.-]+$/.test(name)) return new Response("Not found", { status: 404 });
  const f = await openFile(shopId, name);
  if (!f) return new Response("Not found", { status: 404 });
  return new Response(f.body, {
    headers: {
      "Content-Type": f.mime,
      "Content-Length": String(f.size),
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
