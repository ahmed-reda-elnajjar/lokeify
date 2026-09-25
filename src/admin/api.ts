"use client";

/** fetch() for the Lokeify JSON APIs: throws Error(message) on failure. */
export async function api<T = Record<string, unknown>>(url: string, init?: RequestInit): Promise<T> {
  const isForm = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const res = await fetch(url, { ...init, headers: init?.body && !isForm ? { "Content-Type": "application/json", ...init?.headers } : init?.headers });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (res.status === 401 && typeof window !== "undefined" && url.startsWith("/api/admin/")) window.location.href = "/login";
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status}).`);
  return data;
}

export const adminUrl = (slug: string, path = "") => `/api/admin/${slug}${path}`;
