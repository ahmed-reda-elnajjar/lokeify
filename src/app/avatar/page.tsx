"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAvatarStore } from "@/lib/store/avatarStore";
import { useTryOnStore } from "@/lib/store/tryOnStore";
import AvatarScene from "@/components/avatar/AvatarScene";
import AvatarModel, { ActiveClothing } from "@/components/avatar/AvatarModel";
import ClothingSwitcher from "@/components/avatar/ClothingSwitcher";
import { ClothingCategory } from "@/types";

export default function AvatarPage() {
  const router = useRouter();
  const hasHydrated = useAvatarStore((s) => s.hasHydrated);
  const generated = useAvatarStore((s) => s.generated);
  const measurements = useAvatarStore((s) => s.measurements);
  const tryOn = useTryOnStore();

  const [clothing, setClothing] = useState<ActiveClothing>({
    tshirt: {
      active: tryOn.category === "tshirt",
      color: tryOn.category === "tshirt" ? tryOn.color.hex : "#1a1a1a",
    },
    pants: {
      active: tryOn.category === "pants",
      color: tryOn.category === "pants" ? tryOn.color.hex : "#22314f",
    },
    jacket: {
      active: tryOn.category === "jacket",
      color: tryOn.category === "jacket" ? tryOn.color.hex : "#161616",
    },
  });

  if (!hasHydrated) {
    return <div className="h-[70vh]" />;
  }

  if (!generated) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-24 text-center">
        <span className="text-4xl">🧍</span>
        <h1 className="text-2xl font-semibold">No avatar yet</h1>
        <p className="text-sm text-muted">
          You haven&apos;t created your 3D avatar. It only takes a minute —
          measurements, a couple of photos, and you&apos;re set.
        </p>
        <Link
          href="/create-avatar"
          className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Create Your Avatar
        </Link>
      </div>
    );
  }

  const toggleCategory = (cat: ClothingCategory) => {
    setClothing((c) => ({
      ...c,
      [cat]: { ...c[cat], active: !c[cat].active },
    }));
  };

  const setColor = (cat: ClothingCategory, color: string) => {
    setClothing((c) => ({
      ...c,
      [cat]: { ...c[cat], active: true, color },
    }));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {tryOn.productName ? `Trying on: ${tryOn.productName}` : "Your Avatar"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Rotate, zoom, and try on different items and colors.
          </p>
        </div>
        <button
          onClick={() => router.push("/create-avatar")}
          className="rounded-full border border-foreground px-4 py-2 text-sm transition-colors hover:bg-surface-2"
        >
          Edit Measurements
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="h-[420px] overflow-hidden rounded-2xl border border-border sm:h-[520px]">
          <AvatarScene>
            <AvatarModel measurements={measurements} clothing={clothing} />
          </AvatarScene>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-medium text-muted">Wardrobe</h2>
          <ClothingSwitcher
            clothing={clothing}
            onToggle={toggleCategory}
            onColor={setColor}
          />
          <Link
            href="/store"
            className="mt-5 block rounded-full bg-brand px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            Browse Store X
          </Link>
        </div>
      </div>
    </div>
  );
}
