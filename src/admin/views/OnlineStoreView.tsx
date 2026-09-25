"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ShopSettings, ThemeContent } from "@/shared/shop";
import { useAdmin } from "../context";
import { api, adminUrl } from "../api";
import { SlotUpload } from "../SlotUpload";
import { Badge, Button, Card, Chips, Field, Input, LinkButton, NumberInput, PageHeader, SaveBar, Textarea, Toggle, cx } from "../ui";

type Site = { name: string; tagline: string; drop: ShopSettings["drop"]; trending: string[] };
type P = { id: string; name: string; live: boolean; category: string };

/** "2026-09-26T08:00:00.000Z" → "2026-09-26T10:00" in the browser's zone, for <input type="datetime-local">. */
const toLocal = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function OnlineStoreView({ draft, published, products, site: site0 }: { draft: ThemeContent; published: ThemeContent; products: P[]; site: Site }) {
  const { shop } = useAdmin();
  const router = useRouter();
  const [saved, setSaved] = useState({ theme: draft, site: site0 });
  const [theme, setTheme] = useState(draft);
  const [site, setSite] = useState(site0);
  const [live, setLive] = useState(published);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const dirty = JSON.stringify({ theme, site }) !== JSON.stringify(saved);
  const unpublished = JSON.stringify(saved.theme) !== JSON.stringify(live);

  const setHero = (patch: Partial<ThemeContent["hero"]>) => setTheme((t) => ({ ...t, hero: { ...t.hero, ...patch } }));
  const setWear = (patch: Partial<ThemeContent["wear"]>) => setTheme((t) => ({ ...t, wear: { ...t.wear, ...patch } }));
  const move = (i: number, d: number) =>
    setTheme((t) => {
      const j = i + d;
      if (j < 0 || j >= t.sections.length) return t;
      const a = t.sections.slice();
      [a[i], a[j]] = [a[j], a[i]];
      return { ...t, sections: a };
    });

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      await api(adminUrl(shop.slug, "/theme"), { method: "PUT", body: JSON.stringify(theme) });
      await api(adminUrl(shop.slug, "/settings"), { method: "PATCH", body: JSON.stringify({ name: site.name, settings: { tagline: site.tagline, drop: site.drop, trending: site.trending } }) });
      setSaved({ theme, site });
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  };
  const publish = async () => {
    if (dirty) await save();
    await api(adminUrl(shop.slug, "/theme/publish"), { method: "POST" });
    setLive(theme);
  };
  const discard = async () => {
    if (!window.confirm("Throw away every theme change that isn't published yet?")) return;
    await api(adminUrl(shop.slug, "/theme/discard"), { method: "POST" });
    setTheme(live);
    setSaved((s) => ({ ...s, theme: live }));
  };

  const garments = new Set(theme.wear.garmentIds);
  const wearable = products.filter((p) => p.category !== "accessories" && p.category !== "bottoms");

  return (
    <>
      <SaveBar dirty={dirty} saving={saving} onSave={() => void save()} onDiscard={() => (setTheme(saved.theme), setSite(saved.site))} error={err} />
      <PageHeader
        title="Online store"
        sub={unpublished || dirty ? <span className="flex items-center gap-2"><Badge tone="yellow">Draft</Badge> Customers still see the published version.</span> : <span className="flex items-center gap-2"><Badge tone="green">Published</Badge> Customers see this version.</span>}
        actions={
          <>
            <LinkButton href={`/s/${shop.slug}`} newTab>Preview ↗</LinkButton>
            {unpublished && !dirty && <Button onClick={() => void discard()}>Discard draft</Button>}
            <Button kind="primary" disabled={!unpublished && !dirty} onClick={() => void publish()}>Publish</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card title="Home page sections" action={<span className="text-xs text-muted">Show, hide and reorder</span>}>
            <ol className="-my-1">
              {theme.sections.map((x, i) => (
                <li key={x.k} className={cx("flex items-center gap-3 border-b border-border py-2 last:border-0", !x.on && "opacity-50")}>
                  <span className="w-6 text-xs tabular-nums text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{x.l}</div>
                    <div className="text-xs text-muted">{x.d}</div>
                  </div>
                  <Button className="px-2 py-1" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${x.l} up`}>↑</Button>
                  <Button className="px-2 py-1" disabled={i === theme.sections.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${x.l} down`}>↓</Button>
                  <Button className="w-20 py-1" kind={x.on ? "primary" : "secondary"} onClick={() => setTheme((t) => ({ ...t, sections: t.sections.map((s, j) => (j === i ? { ...s, on: !s.on } : s)) }))}>{x.on ? "Shown" : "Hidden"}</Button>
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Hero">
            <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
              <SlotUpload slot="hero" label="Hero image" aspect="aspect-[4/5]" />
              <div className="flex flex-col gap-3">
                <Field label="Headline"><Input value={theme.hero.title} onChange={(e) => setHero({ title: e.target.value })} /></Field>
                <Field label="Kicker"><Input value={theme.hero.kicker} onChange={(e) => setHero({ kicker: e.target.value })} /></Field>
                <Field label="Intro"><Textarea rows={3} value={theme.hero.body} onChange={(e) => setHero({ body: e.target.value })} /></Field>
                <Field label="Button label"><Input value={theme.hero.cta} onChange={(e) => setHero({ cta: e.target.value })} /></Field>
              </div>
            </div>
          </Card>

          <Card title="Wear carousel" action={<a href={`/s/${shop.slug}/lookbook`} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">Fine-tune on the lookbook page ↗</a>}>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted">A model photo with your jackets and tops rotating on it. Drop a full-body model photo and a cut-out (transparent PNG) of each garment; then line them up on the lookbook page.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title"><Input value={theme.wear.title} onChange={(e) => setWear({ title: e.target.value })} /></Field>
                <Field label="Seconds per garment"><NumberInput value={theme.wear.rotateSeconds} onChange={(n) => setWear({ rotateSeconds: Math.max(1, Math.min(30, n ?? 3)) })} /></Field>
              </div>
              <Toggle checked={theme.wear.colorPhotos} onChange={(v) => setWear({ colorPhotos: v })} label="Show photos in colour" hint="Off shows them in black and white, like the rest of the page." />
              <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                <SlotUpload slot="wear-model" label="Model photo" fallback={theme.wear.images?.model} aspect="aspect-[3/4]" />
                <div>
                  <div className="mb-2 text-sm font-medium">Garments in rotation</div>
                  {wearable.length === 0 ? (
                    <p className="text-sm text-muted">Add tops or outerwear first.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {wearable.map((p) => (
                        <div key={p.id} className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={garments.has(p.id)}
                            onChange={(e) => setWear({ garmentIds: e.target.checked ? [...theme.wear.garmentIds, p.id] : theme.wear.garmentIds.filter((g) => g !== p.id) })}
                            aria-label={`Show ${p.name} in the carousel`}
                          />
                          <div className="flex-1">
                            <div className="text-sm">{p.name}{!p.live && <span className="text-muted"> (draft)</span>}</div>
                            {garments.has(p.id) && <SlotUpload slot={`wear-g-${p.id}`} label="Cut-out" fallback={theme.wear.images?.[p.id]} aspect="aspect-square" className="mt-1 w-24" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Store">
            <div className="flex flex-col gap-3">
              <Field label="Store name" hint="Shown in the header and footer."><Input value={site.name} onChange={(e) => setSite({ ...site, name: e.target.value })} /></Field>
              <Field label="Tagline"><Input value={site.tagline} onChange={(e) => setSite({ ...site, tagline: e.target.value })} /></Field>
            </div>
          </Card>
          <Card title="Drop countdown" action={<span className="text-xs text-muted">Show it under Sections</span>}>
            <div className="flex flex-col gap-3">
              <Field label="Name"><Input value={site.drop.name} onChange={(e) => setSite({ ...site, drop: { ...site.drop, name: e.target.value } })} /></Field>
              <Field label="Goes live">
                <Input type="datetime-local" value={toLocal(site.drop.at)} onChange={(e) => e.target.value && setSite({ ...site, drop: { ...site.drop, at: new Date(e.target.value).toISOString() } })} />
              </Field>
              <Field label="Label" hint={'Shown next to the timer, e.g. "Sat 26.09, 10:00 CET".'}><Input value={site.drop.label} onChange={(e) => setSite({ ...site, drop: { ...site.drop, label: e.target.value } })} /></Field>
              <Field label="Early access for members (minutes)"><NumberInput value={site.drop.earlyAccessMinutes} onChange={(n) => setSite({ ...site, drop: { ...site.drop, earlyAccessMinutes: Math.max(0, Math.round(n ?? 0)) } })} /></Field>
            </div>
          </Card>
          <Card title="Search suggestions">
            <Chips values={site.trending} onChange={(trending) => setSite({ ...site, trending })} placeholder="cargo, puffer…" />
            <p className="mt-2 text-xs text-muted">Shown as "Trending" on the search page.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
