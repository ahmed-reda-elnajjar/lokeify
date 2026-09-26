// Passwords (scrypt), signed session tokens (HMAC-SHA256) and encrypted shop
// secrets (AES-256-GCM). The server secret comes from LOKEIFY_SECRET, or is a
// random value generated once and kept in the database.

import crypto from "node:crypto";
import { storageMode, storedSecret } from "./db";

let key: Promise<Buffer> | null = null;
function secret(): Promise<Buffer> {
  if (!key) {
    const env = process.env.LOKEIFY_SECRET;
    // Demo mode on Vercel (no database connected): every serverless instance has its own
    // throwaway database, so the secret can't live there or instances would reject each
    // other's sessions. Derive one per project instead; set LOKEIFY_SECRET for real use.
    const demo = storageMode() === "ephemeral" ? `lokeify-demo:${process.env.VERCEL_PROJECT_ID ?? ""}:${process.env.VERCEL_GIT_REPO_ID ?? ""}` : null;
    key = (env && env.length >= 16 ? Promise.resolve(env) : demo ? Promise.resolve(demo) : storedSecret())
      .then((s) => crypto.createHash("sha256").update(s).digest())
      .catch((e) => {
        key = null;
        throw e;
      });
  }
  return key;
}

export const newId = (prefix = "") => prefix + crypto.randomBytes(9).toString("base64url").replace(/[-_]/g, "x");

export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [kind, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const want = Buffer.from(hash, "base64");
  const got = crypto.scryptSync(pw, Buffer.from(salt, "base64"), want.length, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(want, got);
}

/** "payload.signature" where payload is base64url JSON. */
export async function sign(data: object): Promise<string> {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const sig = crypto.createHmac("sha256", await secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export async function unsign<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const want = crypto.createHmac("sha256", await secret()).update(payload).digest();
  const got = Buffer.from(sig, "base64url");
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

export async function encrypt(plain: string): Promise<string> {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", await secret(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `${iv.toString("base64")}.${c.getAuthTag().toString("base64")}.${enc.toString("base64")}`;
}

export async function decrypt(box: string): Promise<string | null> {
  const k = await secret();
  try {
    const [iv, tag, enc] = box.split(".");
    const d = crypto.createDecipheriv("aes-256-gcm", k, Buffer.from(iv, "base64"));
    d.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(enc, "base64")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
