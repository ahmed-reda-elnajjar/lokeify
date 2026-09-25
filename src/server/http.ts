// Small helpers for the JSON route handlers.

import { NextResponse } from "next/server";
import { ownedShop } from "./auth";

export const ok = (data: unknown = { ok: true }, status = 200) => NextResponse.json(data, { status });
export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function body<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as T) : null;
  } catch {
    return null;
  }
}

/** For /api/admin/[shop]/…: the merchant must be signed in and own the shop. */
export async function adminShop(params: Promise<{ shop: string }>) {
  const { shop: slug } = await params;
  const owned = await ownedShop(slug);
  return owned;
}

export const unauthorized = () => fail("Sign in to your Lokeify account first.", 401);
