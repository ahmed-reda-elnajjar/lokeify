"use client";

import { useRef, useState } from "react";
import { useAdmin } from "./context";
import { api, adminUrl } from "./api";
import { cx } from "./ui";
import { uploadInPieces, UploadHttpError } from "@/shared/upload";

/**
 * Upload / replace / remove the file in one of the shop's slots
 * ("hero", "p-<id>-0", "model-<id>", "tryon-model-male", …).
 * `fallback` is a built-in image shown until something is uploaded.
 */
export function SlotUpload({
  slot, label, fallback, kind = "image", aspect = "aspect-square", className, compact,
}: { slot: string; label?: string; fallback?: string; kind?: "image" | "model"; aspect?: string; className?: string; compact?: boolean }) {
  const { shop, images, setImages } = useAdmin();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const url = images[slot];

  const upload = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await uploadInPieces(adminUrl(shop.slug, "/files"), slot, file, file.name);
      setImages(r.images);
    } catch (e) {
      if (e instanceof UploadHttpError && e.status === 401) window.location.href = "/login";
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      const r = await api<{ images: Record<string, string> }>(`${adminUrl(shop.slug, "/files")}?slot=${encodeURIComponent(slot)}`, { method: "DELETE" });
      setImages(r.images);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't remove it.");
    } finally {
      setBusy(false);
    }
  };

  const picker = (
    <input
      ref={input}
      type="file"
      hidden
      accept={kind === "model" ? ".glb,model/gltf-binary" : "image/*"}
      onChange={(e) => {
        void upload(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );

  if (kind === "model") {
    return (
      <div className={cx("flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm", className)}>
        <span className={url ? "font-medium" : "text-muted"}>{busy ? "Uploading…" : url ? "3D file uploaded (.glb)" : label ?? "No 3D file"}</span>
        <button type="button" className="text-accent hover:underline" onClick={() => input.current?.click()} disabled={busy}>
          {url ? "Replace" : "Upload .glb"}
        </button>
        {url && (
          <button type="button" className="text-red-700 hover:underline" onClick={() => void remove()} disabled={busy}>
            Remove
          </button>
        )}
        {err && <span className="w-full text-xs text-red-700">{err}</span>}
        {picker}
      </div>
    );
  }

  const shown = url ?? fallback;
  return (
    <div className={cx("flex flex-col gap-1", className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onDragOver={(e) => (e.preventDefault(), setDrag(true))}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void upload(e.dataTransfer.files?.[0]);
        }}
        className={cx(
          "group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed bg-surface-2 text-center text-xs text-muted transition",
          aspect,
          drag ? "border-accent bg-emerald-50" : "border-border hover:border-foreground/40",
        )}
        aria-label={`${url ? "Replace" : "Add"} ${label ?? "image"}`}
      >
        {shown ? <img src={shown} alt={label ?? ""} className="h-full w-full object-cover" /> : <span className="px-2">{busy ? "Uploading…" : compact ? "+" : `Add ${label ?? "image"}`}</span>}
        {busy && shown && <span className="absolute inset-0 flex items-center justify-center bg-white/70">Uploading…</span>}
        {url && !busy && (
          <button
            type="button"
            onClick={(e) => (e.stopPropagation(), void remove())}
            className="absolute right-1 top-1 hidden rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] text-red-700 shadow group-hover:block"
          >
            Remove
          </button>
        )}
      </div>
      {!compact && label && <span className="text-xs text-muted">{label}{!url && fallback ? " (built-in)" : ""}</span>}
      {err && <span className="text-xs text-red-700">{err}</span>}
      {picker}
    </div>
  );
}
