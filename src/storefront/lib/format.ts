"use client";

import { useEffect, useState } from "react";

// Prices use the shop's currency (set by the storefront provider).
let currency = "USD";
const fmt = new Map<string, Intl.NumberFormat>();
export function setCurrency(code: string) {
  currency = code;
}
function format(n: number, digits: number) {
  const k = `${currency}|${digits}`;
  let f = fmt.get(k);
  if (!f) fmt.set(k, (f = new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits })));
  return f.format(n);
}
export const money = (n: number) => (Number.isFinite(n) ? format(n, Number.isInteger(n) ? 0 : 2) : "");
export const money2 = (n: number) => (Number.isFinite(n) ? format(n, 2) : "");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-09-19" → "19 Sep 2026" */
export function longDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTHS[m - 1]} ${y}`;
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

/** Current time, ticking every `ms`. Null until mounted so SSR and hydration agree. */
export function useNow(ms = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function countdown(to: Date, now: Date | null) {
  const ms = now ? Math.max(0, to.getTime() - now.getTime()) : 0;
  const m = Math.floor(ms / 60000);
  return { live: !!now && ms === 0, days: Math.floor(m / 1440), hours: Math.floor((m % 1440) / 60), minutes: m % 60, ready: !!now };
}
