import { one } from "@/server/db";
import { verifyPassword } from "@/server/crypto";
import { startMerchantSession, type MerchantRow } from "@/server/auth";
import { ensureSeeded } from "@/server/seed";
import { shopsOf } from "@/server/shops";
import { body, fail, ok } from "@/server/http";

export async function POST(req: Request) {
  await ensureSeeded();
  const b = await body<{ email?: string; password?: string }>(req);
  const email = (b?.email ?? "").trim().toLowerCase();
  const m = email ? await one<MerchantRow>(`SELECT * FROM merchants WHERE email = ?`, email) : undefined;
  if (!m || typeof b?.password !== "string" || !verifyPassword(b.password, m.password)) return fail("Wrong email or password.", 401);
  await startMerchantSession(m.id);
  return ok({ slug: (await shopsOf(m.id))[0]?.slug ?? null });
}
