"use client";

import { useState } from "react";
import type { ShopSettings, SizeChartRow, TryonProviderName } from "@/shared/shop";
import { useAdmin } from "../context";
import { api, adminUrl } from "../api";
import { SlotUpload } from "../SlotUpload";
import { Badge, Button, Card, Field, Input, NumberInput, PageHeader, SaveBar, Select, Toggle } from "../ui";

const PROVIDERS: { k: TryonProviderName; l: string; hint: string }[] = [
  { k: "meta", l: "Meta Model API (Muse Image)", hint: "Key from dev.meta.ai. About $0.01 per image." },
  { k: "fashn", l: "FASHN", hint: "Key from fashn.ai." },
  { k: "replicate", l: "Replicate (IDM-VTON)", hint: "API token from replicate.com." },
  { k: "mock", l: "Test mode (no AI)", hint: "Returns the photo unchanged — for trying the flow." },
];

/** Lokeify's own apps: the 3D fit room, photo try-on and the size guide. */
export default function AppsView({ settings, keyHint: hint0, envKey }: { settings: ShopSettings; keyHint: string | null; envKey: boolean }) {
  const { shop } = useAdmin();
  const pick = (s: ShopSettings) => ({ features: s.features, tryonProvider: s.tryonProvider, tryonDailyLimit: s.tryonDailyLimit, sizeChart: s.sizeChart });
  const [saved, setSaved] = useState(pick(settings));
  const [f, setF] = useState(pick(settings));
  const [key, setKey] = useState("");
  const [hint, setHint] = useState(hint0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const dirty = JSON.stringify(f) !== JSON.stringify(saved) || key.trim() !== "";
  const setFeature = (k: keyof ShopSettings["features"], v: boolean) => setF({ ...f, features: { ...f.features, [k]: v } });
  const setRow = (i: number, patch: Partial<SizeChartRow>) => setF({ ...f, sizeChart: f.sizeChart.map((r, j) => (j === i ? { ...r, ...patch } : r)) });

  const save = async (clearKey = false) => {
    setSaving(true);
    setErr(null);
    try {
      const r = await api<{ settings: ShopSettings; tryonKeyHint: string | null }>(adminUrl(shop.slug, "/settings"), {
        method: "PATCH",
        body: JSON.stringify({ settings: f, ...(clearKey ? { tryonKey: "" } : key.trim() ? { tryonKey: key.trim() } : {}) }),
      });
      setSaved(pick(r.settings));
      setF(pick(r.settings));
      setHint(r.tryonKeyHint);
      setKey("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  };

  const provider = PROVIDERS.find((p) => p.k === f.tryonProvider)!;
  const connected = f.tryonProvider === "mock" || !!hint || (f.tryonProvider === "meta" && envKey);

  return (
    <>
      <SaveBar dirty={dirty} saving={saving} onSave={() => void save()} onDiscard={() => (setF(saved), setKey(""))} error={err} />
      <PageHeader title="Fit room & try-on" sub="What shoppers get on every product page." actions={<Button kind="primary" disabled={!dirty || saving} onClick={() => void save()}>{saving ? "Saving…" : "Save"}</Button>} />
      <div className="flex flex-col gap-4">
        <Card title={<span className="flex items-center gap-2">3D fit room <Badge tone={f.features.fitRoom ? "green" : "gray"}>{f.features.fitRoom ? "On" : "Off"}</Badge></span>}>
          <div className="flex flex-col gap-4">
            <Toggle checked={f.features.fitRoom} onChange={(v) => setFeature("fitRoom", v)} label="Let shoppers try pieces on a 3D model" hint="A male and a female model sized to the shopper's height and build. They stand, breathe and walk; a heat map shows where a size is tight or loose." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Custom avatar (optional)" hint="Your own rigged .glb replaces both built-in models. Garment .glb files must be made on it, same pose.">
                <SlotUpload slot="model-avatar-v2" kind="model" label="Using the built-in male and female models" />
              </Field>
              <div className="rounded-lg bg-surface-2 p-3 text-sm text-muted">
                Pieces without their own 3D file are drawn from their shape and measurements — add those on each product under <b>Fit room</b>.
              </div>
            </div>
          </div>
        </Card>

        <Card title={<span className="flex items-center gap-2">Photo try-on <Badge tone={f.features.realTryOn ? (connected ? "green" : "yellow") : "gray"}>{f.features.realTryOn ? (connected ? "On" : "Needs a key") : "Off"}</Badge></span>}>
          <div className="flex flex-col gap-4">
            <Toggle checked={f.features.realTryOn} onChange={(v) => setFeature("realTryOn", v)} label="Let shoppers see pieces on a real photo" hint="They upload a full-body photo (or use your model photos below) and the AI dresses it in up to 3 pieces. Photos stay on the shopper's device." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Service" hint={provider.hint}>
                <Select value={f.tryonProvider} onChange={(e) => setF({ ...f, tryonProvider: e.target.value as TryonProviderName })}>
                  {PROVIDERS.map((p) => <option key={p.k} value={p.k}>{p.l}</option>)}
                </Select>
              </Field>
              {f.tryonProvider !== "mock" && (
                <Field label="API key" hint={hint ? <>Saved key ending {hint}. <button type="button" className="text-red-700 hover:underline" onClick={() => void save(true)}>Remove</button></> : f.tryonProvider === "meta" && envKey ? "Using the server's key (MODEL_API_KEY) until you add your own." : "Stored encrypted; never shown to shoppers."}>
                  <Input type="password" autoComplete="off" placeholder={hint ? "Paste a new key to replace it" : "Paste your key"} value={key} onChange={(e) => setKey(e.target.value)} />
                </Field>
              )}
              <Field label="Looks per shopper per day"><NumberInput value={f.tryonDailyLimit} onChange={(n) => setF({ ...f, tryonDailyLimit: Math.max(0, Math.min(1000, Math.round(n ?? 0))) })} /></Field>
            </div>
            <div>
              <div className="mb-1 text-sm font-medium">Your models</div>
              <p className="mb-3 text-xs text-muted">One full-body photo per group, for shoppers who don&apos;t use their own: standing, facing the camera, arms slightly away from the body, fitted clothes, plain background.</p>
              <div className="flex flex-wrap gap-4">
                <SlotUpload slot="tryon-model-male" label="Male model" fallback={shop.slug === "crate" ? "/demo/crate/lookbook/model.jpg" : undefined} aspect="aspect-[3/4]" className="w-32" />
                <SlotUpload slot="tryon-model-female" label="Female model" aspect="aspect-[3/4]" className="w-32" />
              </div>
            </div>
          </div>
        </Card>

        <Card title={<span className="flex items-center gap-2">Size guide <Badge tone={f.features.sizeGuide ? "green" : "gray"}>{f.features.sizeGuide ? "On" : "Off"}</Badge></span>}>
          <div className="flex flex-col gap-4">
            <Toggle checked={f.features.sizeGuide} onChange={(v) => setFeature("sizeGuide", v)} label="Show the size guide and size advice" hint="Recommends a size from the shopper's height, weight and measurements, using each product's garment measurements." />
            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="text-left text-xs text-muted">
                    <tr>{["Size", "EU", "Chest cm", "Waist cm", "Height cm", ""].map((h) => <th key={h} className="px-1 py-1.5 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {f.sizeChart.map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        {(["size", "eu", "chest", "waist", "height"] as const).map((k) => (
                          <td key={k} className="px-1 py-1"><Input value={r[k]} onChange={(e) => setRow(i, { [k]: e.target.value })} /></td>
                        ))}
                        <td className="px-1 py-1"><Button className="px-2 py-1" onClick={() => setF({ ...f, sizeChart: f.sizeChart.filter((_, j) => j !== i) })} aria-label="Remove row">×</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Button className="mt-2" onClick={() => setF({ ...f, sizeChart: [...f.sizeChart, { size: "", eu: "", chest: "", waist: "", height: "" }] })}>Add size</Button>
              </div>
              <div className="flex flex-col gap-1">
                <SlotUpload slot="fit-model" label="Size guide model photo" aspect="aspect-square" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
