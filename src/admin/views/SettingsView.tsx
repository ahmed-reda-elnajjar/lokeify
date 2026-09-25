"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CURRENCIES, type ShopSettings } from "@/shared/shop";
import { useAdmin } from "../context";
import { api, adminUrl } from "../api";
import { Button, Card, Field, Input, NumberInput, PageHeader, SaveBar, Select } from "../ui";

export default function SettingsView({ name: name0, settings }: { name: string; settings: ShopSettings }) {
  const { shop, setShop } = useAdmin();
  const router = useRouter();
  const pick = (n: string, s: ShopSettings) => ({
    name: n, currency: s.currency, contactEmail: s.contactEmail, freeShippingOver: s.freeShippingOver,
    standardShipping: s.standardShipping, expressShipping: s.expressShipping, taxPct: Math.round(s.taxRate * 1000) / 10,
  });
  const [saved, setSaved] = useState(pick(name0, settings));
  const [f, setF] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const dirty = JSON.stringify(f) !== JSON.stringify(saved);

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      const { name, taxPct, ...rest } = f;
      const r = await api<{ name: string; settings: ShopSettings }>(adminUrl(shop.slug, "/settings"), {
        method: "PATCH",
        body: JSON.stringify({ name, settings: { ...rest, taxRate: taxPct / 100 } }),
      });
      const next = pick(r.name, r.settings);
      setSaved(next);
      setF(next);
      setShop({ ...shop, name: r.name, settings: r.settings });
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  };

  const cur = f.currency;
  return (
    <>
      <SaveBar dirty={dirty} saving={saving} onSave={() => void save()} onDiscard={() => setF(saved)} error={err} />
      <PageHeader title="Settings" actions={<Button kind="primary" disabled={!dirty || saving} onClick={() => void save()}>{saving ? "Saving…" : "Save"}</Button>} />
      <div className="flex flex-col gap-4">
        <Card title="Store details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Store name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Contact email" hint="Shown in the store footer."><Input type="email" value={f.contactEmail} onChange={(e) => setF({ ...f, contactEmail: e.target.value })} /></Field>
            <Field label="Store address" hint="Fixed when the store was created.">
              <Input value={`/s/${shop.slug}`} readOnly className="bg-surface-2 text-muted" />
            </Field>
            <Field label="Currency" hint="Prices are stored as numbers; changing this doesn't convert them.">
              <Select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
          </div>
        </Card>
        <Card title="Shipping">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Standard shipping"><NumberInput prefix={cur} value={f.standardShipping} onChange={(n) => setF({ ...f, standardShipping: Math.max(0, n ?? 0) })} /></Field>
            <Field label="Express shipping"><NumberInput prefix={cur} value={f.expressShipping} onChange={(n) => setF({ ...f, expressShipping: Math.max(0, n ?? 0) })} /></Field>
            <Field label="Free standard shipping over" hint="0 = never free."><NumberInput prefix={cur} value={f.freeShippingOver} onChange={(n) => setF({ ...f, freeShippingOver: Math.max(0, n ?? 0) })} /></Field>
          </div>
        </Card>
        <Card title="Taxes">
          <Field label="VAT included in prices (%)" hint="Shown as “VAT incl.” at checkout and on orders.">
            <NumberInput className="max-w-40" value={f.taxPct} onChange={(n) => setF({ ...f, taxPct: Math.max(0, Math.min(50, n ?? 0)) })} />
          </Field>
        </Card>
        <Card title="Payments">
          <p className="text-sm text-muted">Test mode: orders are recorded as paid and nothing is charged. Card, PayPal and Klarna buttons at checkout are placeholders until a payment provider (e.g. Paymob or Stripe) is connected.</p>
        </Card>
      </div>
    </>
  );
}
