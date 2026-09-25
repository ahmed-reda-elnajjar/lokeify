"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BOTTOM_MEASURES, CATEGORIES, FIT_STYLES, TOP_MEASURES, isBottom, type CategoryKey, type FitShape, type FitStyle, type MeasureKey, type Product } from "@/storefront/lib/data";
import { useAdmin } from "../context";
import { api, adminUrl } from "../api";
import { SlotUpload } from "../SlotUpload";
import { Button, Card, Chips, Field, Input, NumberInput, PageHeader, SaveBar, Select, Textarea, Toggle, cx } from "../ui";

const SHAPES: { k: FitShape; l: string }[] = [
  { k: "tee", l: "Tee" },
  { k: "hoodie", l: "Hoodie / sweat" },
  { k: "jacket", l: "Jacket / vest" },
  { k: "pants", l: "Trousers / shorts" },
];
const SIZE_PRESETS: Record<string, string[]> = { Apparel: ["S", "M", "L", "XL", "XXL"], Waist: ["28", "30", "32", "34", "36"], "One size": ["One size"] };

/** Product page in the admin: everything the storefront, the fit room and the photo try-on read. */
export default function ProductEditor({ initial }: { initial: Product }) {
  const { shop } = useAdmin();
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [p, setP] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const dirty = JSON.stringify(p) !== JSON.stringify(saved);
  const set = (patch: Partial<Product>) => setP((x) => ({ ...x, ...patch }));
  const cur = shop.settings.currency;
  const photos = Math.max(1, Math.min(4, p.images ?? 3));

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      const r = await api<{ product: Product }>(adminUrl(shop.slug, `/products/${encodeURIComponent(p.id)}`), { method: "PATCH", body: JSON.stringify({ ...p, compareAt: p.compareAt ?? null, run: p.run ?? null, modelSize: p.modelSize ?? null, tag: p.tag ?? null, shape: p.shape ?? null }) });
      setSaved(r.product);
      setP(r.product);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete ${p.name}? This can't be undone.`)) return;
    await api(adminUrl(shop.slug, `/products/${encodeURIComponent(p.id)}`), { method: "DELETE" });
    router.push(`/admin/${shop.slug}/products`);
    router.refresh();
  };

  const setSizes = (sizes: string[]) => {
    const stock = Object.fromEntries(sizes.map((z) => [z, p.stock[z] ?? 0]));
    set({ sizes, stock });
  };
  const cols = isBottom(p) ? BOTTOM_MEASURES : TOP_MEASURES;
  const setMeasure = (z: string, k: MeasureKey, v: number | null) => {
    const row = { ...p.measurements?.[z] };
    if (v == null || !(v > 0)) delete row[k];
    else row[k] = Math.round(v * 10) / 10;
    set({ measurements: { ...p.measurements, [z]: row } });
  };
  const totalStock = p.sizes.reduce((a, z) => a + (p.stock[z] ?? 0), 0);

  return (
    <>
      <SaveBar dirty={dirty} saving={saving} onSave={() => void save()} onDiscard={() => setP(saved)} error={err} />
      <PageHeader
        title={saved.name}
        back={{ href: `/admin/${shop.slug}/products`, label: "Back to products" }}
        actions={
          <>
            <a href={`/s/${shop.slug}/product/${encodeURIComponent(p.id)}`} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">Preview ↗</a>
            <Button kind="primary" onClick={() => void save()} disabled={!dirty || saving}>{saving ? "Saving…" : "Save"}</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <div className="flex flex-col gap-4">
              <Field label="Title">
                <Input value={p.name} onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field label="Description">
                <Textarea rows={5} value={p.description ?? ""} onChange={(e) => set({ description: e.target.value })} placeholder="What it is, how it feels, how to wash it." />
              </Field>
            </div>
          </Card>

          <Card title="Media" action={<span className="text-xs text-muted">Saved as soon as you drop them</span>}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: photos }, (_, i) => (
                <SlotUpload key={i} slot={`p-${p.id}-${i}`} label={i === 0 ? "Cover photo" : `Photo ${i + 1}`} fallback={i === 0 ? p.photo : undefined} aspect="aspect-[3/4]" />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-muted">Photos on the product page</span>
              <Select className="w-20" value={photos} onChange={(e) => set({ images: Number(e.target.value) })}>
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </div>
          </Card>

          <Card title="Pricing">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price">
                <NumberInput prefix={cur} value={p.price} onChange={(n) => set({ price: n ?? 0 })} />
              </Field>
              <Field label="Compare-at price" hint="Shown crossed out when it's higher than the price.">
                <NumberInput prefix={cur} value={p.compareAt ?? null} onChange={(n) => set({ compareAt: n ?? undefined })} />
              </Field>
            </div>
          </Card>

          <Card title="Variants & inventory">
            <div className="flex flex-col gap-4">
              <Field label="Colourways" hint="Press Enter after each one.">
                <Chips values={p.colourways} onChange={(colourways) => set({ colourways })} placeholder="Black, Bone, Olive…" />
              </Field>
              <Field label="Sizes" hint={<>Presets: {Object.entries(SIZE_PRESETS).map(([k, v]) => <button key={k} type="button" className="mr-2 text-accent hover:underline" onClick={() => setSizes(v)}>{k}</button>)}</>}>
                <Chips values={p.sizes} onChange={setSizes} placeholder="S, M, L…" />
              </Field>
              {p.sizes.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs text-muted"><tr><th className="py-1.5 font-medium">Size</th><th className="py-1.5 font-medium">In stock</th></tr></thead>
                    <tbody>
                      {p.sizes.map((z) => (
                        <tr key={z} className="border-t border-border">
                          <td className="py-1.5 pr-4 font-medium">{z}</td>
                          <td className="py-1.5"><NumberInput className="w-32" value={p.stock[z] ?? 0} onChange={(n) => set({ stock: { ...p.stock, [z]: Math.max(0, Math.round(n ?? 0)) } })} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-2 text-xs text-muted">{totalStock} units in total. A size with 0 shows as sold out.</p>
                </div>
              )}
              <Field label="Limited run" hint={'Optional. Shows "9/250 left in this run" on the product page.'}>
                <NumberInput className="max-w-40" value={p.run ?? null} onChange={(n) => set({ run: n ? Math.round(n) : undefined })} />
              </Field>
            </div>
          </Card>

          <Card title="Fit room" action={<span className="text-xs text-muted">Size advice, 3D fit and photo try-on read this</span>}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Drawn as" hint="The 3D shape used when there's no .glb file.">
                  <Select value={p.shape ?? ""} onChange={(e) => set({ shape: (e.target.value || undefined) as FitShape | undefined })}>
                    <option value="">Not wearable (no fit room)</option>
                    {SHAPES.map((x) => <option key={x.k} value={x.k}>{x.l}</option>)}
                  </Select>
                </Field>
                <Field label="Cut" hint="How much room the design leaves; sets the ease the fit engine aims for.">
                  <div className="flex rounded-lg bg-surface-2 p-0.5 text-sm">
                    {FIT_STYLES.map((f) => (
                      <button key={f} type="button" className={cx("flex-1 rounded-md px-3 py-1.5 capitalize", (p.fitStyle ?? "regular") === f && "bg-surface font-medium shadow-sm")} onClick={() => set({ fitStyle: f as FitStyle })}>{f}</button>
                    ))}
                  </div>
                </Field>
              </div>
              {p.sizes.length > 0 && (
                <div>
                  <div className="mb-1.5 text-sm font-medium">Garment measurements (cm, laid flat)</div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead className="text-left text-xs text-muted">
                        <tr>
                          <th className="py-1.5 pr-2 font-medium">Size</th>
                          {cols.map((c) => <th key={c.k} className="px-1 py-1.5 font-medium">{c.l}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {p.sizes.map((z) => (
                          <tr key={z} className="border-t border-border">
                            <td className="py-1.5 pr-2 font-medium">{z}</td>
                            {cols.map((c) => (
                              <td key={c.k} className="px-1 py-1.5"><NumberInput value={p.measurements?.[z]?.[c.k] ?? null} onChange={(n) => setMeasure(z, c.k, n)} /></td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {isBottom(p)
                      ? "Waist straight across the top of the waistband, hip 18 cm below it, thigh 2 cm below the crotch. Inseam crotch to hem; rise crotch seam to top of waistband, front."
                      : "Chest 2 cm below the armpits, waist and hem straight across, length from the high shoulder point to the hem, sleeve from the shoulder seam to the cuff. Leave sleeve empty for sleeveless pieces."}
                  </p>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="3D file (.glb)" hint="Optional. Modelled on the fit-room avatar, same pose.">
                  <SlotUpload slot={`model-${p.id}`} kind="model" />
                </Field>
                <Field label="Modelled in size">
                  <Select value={p.modelSize ?? ""} onChange={(e) => set({ modelSize: e.target.value || undefined })}>
                    <option value="">{p.sizes.includes("M") ? "M (default)" : "Middle size (default)"}</option>
                    {p.sizes.map((z) => <option key={z} value={z}>{z}</option>)}
                  </Select>
                </Field>
              </div>
              {p.category !== "accessories" && (
                <Field label="Photo try-on details" hint="Tells the AI exactly what to keep, e.g. “round neck, no zip, no collar, short sleeves”.">
                  <Input value={p.tryonNote ?? ""} onChange={(e) => set({ tryonNote: e.target.value })} />
                </Field>
              )}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Status">
            <Toggle checked={p.live} onChange={(live) => set({ live })} label={p.live ? "Active" : "Draft"} hint={p.live ? "Customers can see and buy it." : "Hidden from customers."} />
          </Card>
          <Card title="Organization">
            <div className="flex flex-col gap-4">
              <Field label="Category">
                <Select value={p.category} onChange={(e) => set({ category: e.target.value as CategoryKey })}>
                  {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Tag" hint={'Shown on the product card, e.g. "New" or "Low stock".'}>
                <Input value={p.tag ?? ""} onChange={(e) => set({ tag: e.target.value || undefined })} />
              </Field>
              <Field label="Drop / collection" hint={'Shown as "Drop 07" on the product page.'}>
                <Input value={p.drop} onChange={(e) => set({ drop: e.target.value })} />
              </Field>
            </div>
          </Card>
          <Card title="Details">
            <div className="flex flex-col gap-4">
              <Field label="Fabric">
                <Input value={p.fabric} onChange={(e) => set({ fabric: e.target.value })} placeholder="240gsm organic cotton jersey" />
              </Field>
              <Field label="Fit">
                <Input value={p.fit} onChange={(e) => set({ fit: e.target.value })} placeholder="Boxy, dropped shoulder" />
              </Field>
            </div>
          </Card>
          <Button kind="danger" onClick={() => void remove()}>Delete product</Button>
        </div>
      </div>
    </>
  );
}
