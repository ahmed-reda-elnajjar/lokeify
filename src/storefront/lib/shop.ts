"use client";

// Which shop this storefront page belongs to. The storefront code was written
// for one store at "/"; every link, route push and API call goes through here
// so it lands under /s/<slug> instead.

let slug = "";

export function setShopSlug(s: string) {
  slug = s;
}

export const shopSlug = () => slug;
export const shopBase = () => `/s/${slug}`;

/** Paths that are not part of the storefront and must not get the /s/<slug> prefix. */
const GLOBAL = /^\/(admin|api|files|models|demo|brand|login|signup)(\/|$|\?)/;

/** "/product/x" → "/s/<slug>/product/x". External URLs, hashes and platform paths pass through. */
export function shopHref(href: string, forSlug: string = slug): string {
  if (!href.startsWith("/") || href.startsWith("//") || GLOBAL.test(href)) return href;
  const base = `/s/${forSlug}`;
  if (href === base || href.startsWith(`${base}/`) || href.startsWith(`${base}?`)) return href;
  return href === "/" ? base : `${base}${href}`;
}

/** Strips the /s/<slug> prefix from a pathname, e.g. for `?next=` redirects. */
export function shopPath(pathname: string): string {
  const b = shopBase();
  return pathname === b ? "/" : pathname.startsWith(`${b}/`) ? pathname.slice(b.length) : pathname;
}

/** The storefront's JSON API for this shop. */
export const shopApi = (path: string) => `/api/s/${slug}${path}`;
export const adminApi = (path: string) => `/api/admin/${slug}${path}`;
export const adminHref = (path = "") => `/admin/${slug}${path}`;

export async function json<T = Record<string, unknown>>(url: string, init?: RequestInit & { body?: BodyInit | null }): Promise<T> {
  const res = await fetch(url, { ...init, headers: init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json", ...init?.headers } : init?.headers });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status}).`);
  return data;
}
