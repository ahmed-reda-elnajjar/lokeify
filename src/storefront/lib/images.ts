"use client";

// Pictures and 3D files by slot id ("hero", "p-<id>-<i>", "model-<id>", "look-<id>", …).
//   Shop slots (see isShopSlot) belong to the store: they come from the server's
//   file registry, and only the store's owner can upload or remove them.
//   Every other slot is the shopper's own (their photo, saved looks, try-on cache)
//   and stays in this browser, in IndexedDB, one database per shop.

import { useContext, useEffect, useState } from "react";
import { isShopSlot } from "@/shared/shop";
import { uploadInPieces } from "@/shared/upload";
import { ShopContext } from "./context";
import { adminApi, json, shopSlug } from "./shop";

// ── Shop files (server) ─────────────────────────────────────────────────────

let registry: Record<string, string> = {};
const listeners = new Map<string, Set<() => void>>();
const emit = (id: string) => listeners.get(id)?.forEach((l) => l());

export function setImageRegistry(map: Record<string, string>) {
  const before = registry;
  registry = { ...map };
  const changed = [...new Set([...Object.keys(before), ...Object.keys(map)])].filter((k) => before[k] !== map[k]);
  // Deferred: this can run while a component renders (a new page view hands over the file list).
  if (changed.length) queueMicrotask(() => changed.forEach(emit));
}

// ── Shopper files (IndexedDB) ───────────────────────────────────────────────

const STORE = "slots";
const dbs = new Map<string, Promise<IDBDatabase>>();
function db(): Promise<IDBDatabase> {
  const name = `lokeify-images-${shopSlug()}`;
  let p = dbs.get(name);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const req = indexedDB.open(name, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    dbs.set(name, p);
  }
  return p;
}

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const req = run(d.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

const local = new Map<string, string | null>();
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("lokeify-images") : null;

async function refresh(id: string) {
  const blob = await tx<Blob | undefined>("readonly", (s) => s.get(id)).catch(() => undefined);
  const old = local.get(id);
  if (old) URL.revokeObjectURL(old);
  local.set(id, blob ? URL.createObjectURL(blob) : null);
  emit(id);
}

channel?.addEventListener("message", (e) => {
  const d = e.data as { slug?: string; id?: string };
  if (d?.slug === shopSlug() && d.id && listeners.has(d.id)) void refresh(d.id);
});

// ── API (same as before, whichever side the slot lives on) ─────────────────

export async function putImage(id: string, file: Blob) {
  if (isShopSlot(id)) {
    const name = file instanceof File ? file.name : id.startsWith("model-") ? `${id}.glb` : `${id}.${(file.type.split("/")[1] || "png").replace("jpeg", "jpg")}`;
    const res = await uploadInPieces(adminApi("/files"), id, file, name);
    setImageRegistry(res.images);
    return;
  }
  await tx("readwrite", (s) => s.put(file, id));
  await refresh(id);
  channel?.postMessage({ slug: shopSlug(), id });
}

export async function getImageBlob(id: string): Promise<Blob | undefined> {
  if (isShopSlot(id)) {
    const url = registry[id];
    if (!url) return undefined;
    const r = await fetch(url);
    return r.ok ? r.blob() : undefined;
  }
  return tx<Blob | undefined>("readonly", (s) => s.get(id));
}

export async function removeImage(id: string) {
  if (isShopSlot(id)) {
    const res = await json<{ images: Record<string, string> }>(`${adminApi("/files")}?slot=${encodeURIComponent(id)}`, { method: "DELETE" });
    setImageRegistry(res.images);
    return;
  }
  await tx("readwrite", (s) => s.delete(id));
  await refresh(id);
  channel?.postMessage({ slug: shopSlug(), id });
}

const current = (id: string) => (isShopSlot(id) ? registry[id] ?? null : local.get(id) ?? null);

/** URL for the file in slot `id`, or null when the slot is empty. */
export function useImage(id: string): string | null {
  const boot = useContext(ShopContext);
  // Server render and hydration use the page's own file list, so both agree.
  const [url, setUrl] = useState<string | null>(() => (isShopSlot(id) ? boot?.shop.images[id] ?? null : null));
  useEffect(() => {
    const update = () => setUrl(current(id));
    let set = listeners.get(id);
    if (!set) listeners.set(id, (set = new Set()));
    set.add(update);
    if (isShopSlot(id) || local.has(id)) update();
    else void refresh(id);
    return () => {
      set!.delete(update);
    };
  }, [id]);
  return url;
}

/** URLs for several slots at once (slot id → URL, only filled slots). */
export function useImages(ids: string[]): Record<string, string> {
  const key = ids.join("|");
  const boot = useContext(ShopContext);
  const [map, setMap] = useState<Record<string, string>>(() =>
    Object.fromEntries(ids.flatMap((id) => (isShopSlot(id) && boot?.shop.images[id] ? [[id, boot.shop.images[id]]] : []))),
  );
  useEffect(() => {
    const list = key ? key.split("|") : [];
    const update = () => {
      const next: Record<string, string> = {};
      for (const id of list) {
        const u = current(id);
        if (u) next[id] = u;
      }
      setMap(next);
    };
    for (const id of list) {
      let set = listeners.get(id);
      if (!set) listeners.set(id, (set = new Set()));
      set.add(update);
      if (!isShopSlot(id) && !local.has(id)) void refresh(id);
    }
    update();
    return () => {
      for (const id of list) listeners.get(id)?.delete(update);
    };
  }, [key]);
  return map;
}
