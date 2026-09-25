"use client";

// Small building blocks for the merchant admin (Tailwind, Shopify-like).

import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function Card({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-xl border border-border bg-surface shadow-[0_1px_0_rgba(0,0,0,0.04)]", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 px-5 pt-4">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function PageHeader({ title, back, actions, sub }: { title: ReactNode; back?: { href: string; label: string }; actions?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {back && (
          <a href={back.href} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-2" aria-label={back.label}>
            ←
          </a>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{title}</h1>
          {sub && <div className="mt-0.5 text-sm text-muted">{sub}</div>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

type BtnKind = "primary" | "secondary" | "danger" | "plain";
export function Button({ kind = "secondary", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: BtnKind }) {
  return (
    <button
      type="button"
      {...p}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        kind === "primary" && "bg-brand text-white hover:bg-brand-dark",
        kind === "secondary" && "border border-border bg-surface hover:bg-surface-2",
        kind === "danger" && "border border-red-200 bg-surface text-red-700 hover:bg-red-50",
        kind === "plain" && "text-accent hover:underline",
        className,
      )}
    />
  );
}

export function LinkButton({ href, kind = "secondary", children, newTab }: { href: string; kind?: BtnKind; children: ReactNode; newTab?: boolean }) {
  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noreferrer" : undefined}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
        kind === "primary" ? "bg-brand text-white hover:bg-brand-dark" : "border border-border bg-surface hover:bg-surface-2",
      )}
    >
      {children}
    </a>
  );
}

export function Field({ label, hint, error, children }: { label: ReactNode; hint?: ReactNode; error?: string | null; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-700">{error}</span> : hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-foreground/60 focus:ring-2 focus:ring-foreground/10";

export function Input(p: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cx(inputCls, p.className)} />;
}
export function Textarea(p: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cx(inputCls, "min-h-24", p.className)} />;
}
export function Select(p: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={cx(inputCls, "pr-8", p.className)} />;
}

/** Number field that allows an empty box while typing; commits numbers (or null when cleared). */
export function NumberInput({ value, onChange, step = "any", min, placeholder, className, prefix }: { value: number | null | undefined; onChange: (n: number | null) => void; step?: string; min?: number; placeholder?: string; className?: string; prefix?: string }) {
  const [text, setText] = useState(value == null ? "" : String(value));
  useEffect(() => {
    setText((t) => (t.trim() === "" ? value == null : Number(t) === value) ? t : value == null ? "" : String(value));
  }, [value]);
  return (
    <div className={cx("relative", className)}>
      {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{prefix}</span>}
      <input
        inputMode="decimal"
        step={step}
        min={min}
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          const t = e.target.value.replace(",", ".");
          setText(t);
          if (t.trim() === "") onChange(null);
          else if (Number.isFinite(Number(t))) onChange(Number(t));
        }}
        className={cx(inputCls, prefix && "pl-12")}
      />
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx("relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-accent" : "bg-border")}
      >
        <span className={cx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </button>
    </label>
  );
}

const BADGE: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-800 border-emerald-200",
  yellow: "bg-amber-50 text-amber-800 border-amber-200",
  gray: "bg-surface-2 text-muted border-border",
  blue: "bg-sky-50 text-sky-800 border-sky-200",
  red: "bg-red-50 text-red-700 border-red-200",
};
export function Badge({ tone = "gray", children }: { tone?: keyof typeof BADGE; children: ReactNode }) {
  return <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", BADGE[tone])}>{children}</span>;
}

export const statusTone = (s: string): keyof typeof BADGE =>
  s === "Delivered" || s === "Paid" || s === "Active" ? "green" : s === "Processing" || s === "Pending" ? "yellow" : s === "In transit" ? "blue" : s === "Cancelled" || s === "Refunded" ? "red" : "gray";

/** Chips editor for a list of short strings (sizes, colourways, search terms). */
export function Chips({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState("");
  const add = () => {
    const parts = text.split(",").map((x) => x.trim()).filter(Boolean);
    if (!parts.length) return;
    onChange([...values, ...parts.filter((p) => !values.includes(p))]);
    setText("");
  };
  return (
    <div className={cx(inputCls, "flex flex-wrap items-center gap-1.5 py-1.5")}>
      {values.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-sm">
          {v}
          <button type="button" className="text-muted hover:text-foreground" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter((x) => x !== v))}>
            ×
          </button>
        </span>
      ))}
      <input
        value={text}
        placeholder={values.length ? "" : placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !text && values.length) onChange(values.slice(0, -1));
        }}
        onBlur={add}
        className="min-w-24 flex-1 bg-transparent py-0.5 text-sm outline-none"
      />
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-muted">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Shopify-style bar that appears while a form has unsaved changes. */
export function SaveBar({ dirty, saving, onSave, onDiscard, error }: { dirty: boolean; saving: boolean; onSave: () => void; onDiscard: () => void; error?: string | null }) {
  if (!dirty && !error) return null;
  return (
    <div className="sticky top-0 z-30 -mx-4 mb-4 flex items-center justify-between gap-3 border-b border-border bg-foreground px-4 py-2.5 text-white sm:-mx-6 sm:px-6">
      <span className="text-sm">{error ? <span className="text-red-300">{error}</span> : "Unsaved changes"}</span>
      <div className="flex gap-2">
        <button type="button" className="rounded-lg border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10" onClick={onDiscard} disabled={saving}>
          Discard
        </button>
        <button type="button" className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-foreground hover:bg-white/90 disabled:opacity-60" onClick={onSave} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
