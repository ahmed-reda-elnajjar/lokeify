"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { Button, Field, Input, Select } from "./ui";
import { CURRENCIES, slugify } from "@/shared/shop";

/** One step: your account and your first store (like Shopify's sign-up). */
export default function SignupForm({ existing }: { existing?: boolean }) {
  const [f, setF] = useState({ name: "", email: "", password: "", storeName: "", slug: "", currency: "EGP", demo: true });
  const [slugEdited, setSlugEdited] = useState(false);
  const [avail, setAvail] = useState<boolean | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const slug = slugEdited ? slugify(f.slug) : slugify(f.storeName);

  useEffect(() => {
    if (!slug) return setAvail(null);
    const t = setTimeout(() => {
      api<{ available: boolean }>(`/api/shops?slug=${encodeURIComponent(slug)}`).then((r) => setAvail(r.available)).catch(() => setAvail(null));
    }, 300);
    return () => clearTimeout(t);
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ slug: string }>(existing ? "/api/shops" : "/api/auth/signup", { method: "POST", body: JSON.stringify({ ...f, slug }) });
      window.location.href = `/admin/${r.slug}`;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  };

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  return (
    <form onSubmit={submit} className="flex w-full max-w-lg flex-col gap-5 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold">{existing ? "Open another store" : "Start your store"}</h1>
        <p className="mt-1 text-sm text-muted">{existing ? "It gets its own products, orders and customers." : "Your store, admin and 3D fit room are ready in a minute."}</p>
      </div>
      {!existing && (
        <>
          <Field label="Your name">
            <Input autoComplete="name" value={f.name} onChange={set("name")} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <Input type="email" autoComplete="email" value={f.email} onChange={set("email")} required />
            </Field>
            <Field label="Password" hint="At least 8 characters.">
              <Input type="password" autoComplete="new-password" value={f.password} onChange={set("password")} required minLength={8} />
            </Field>
          </div>
        </>
      )}
      <Field label="Store name">
        <Input value={f.storeName} onChange={set("storeName")} placeholder="e.g. Nile Streetwear" required />
      </Field>
      <Field
        label="Store address"
        error={avail === false ? "That address is taken or not allowed." : null}
        hint={slug ? <>Customers shop at <b>/s/{slug}</b>{avail ? " — available" : ""}</> : "Letters, numbers and dashes."}
      >
        <div className="flex items-center rounded-lg border border-border bg-surface-2 pl-3 text-sm text-muted focus-within:border-foreground/60">
          <span>/s/</span>
          <input
            className="w-full rounded-r-lg bg-surface px-2 py-2 text-foreground outline-none"
            value={slugEdited ? f.slug : slug}
            onChange={(e) => (setSlugEdited(true), setF({ ...f, slug: e.target.value }))}
          />
        </div>
      </Field>
      <Field label="Currency">
        <Select value={f.currency} onChange={set("currency")}>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </Field>
      <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
        <input type="checkbox" className="mt-1" checked={f.demo} onChange={set("demo")} />
        <span>
          <b>Start with demo products</b>
          <span className="block text-muted">10 streetwear pieces with photos, sizes and measurements, so you can try the fit room straight away. Edit or delete them any time.</span>
        </span>
      </label>
      {err && <p className="text-sm text-red-700" role="alert">{err}</p>}
      <Button kind="primary" type="submit" disabled={busy || avail === false} className="py-2.5">
        {busy ? "Creating your store…" : existing ? "Create store" : "Create my store"}
      </Button>
      {!existing && (
        <p className="text-center text-sm text-muted">
          Already have an account? <a href="/login" className="text-accent hover:underline">Log in</a>
        </p>
      )}
    </form>
  );
}
