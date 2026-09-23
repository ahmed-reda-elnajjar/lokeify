"use client";

import { ClothingCategory } from "@/types";
import { ActiveClothing } from "@/components/avatar/AvatarModel";
import { cn } from "@/lib/utils";

const categoryLabels: Record<ClothingCategory, string> = {
  tshirt: "T-Shirt",
  pants: "Pants",
  jacket: "Jacket",
};

const swatches: Record<ClothingCategory, string[]> = {
  tshirt: ["#1a1a1a", "#d9c9ad", "#2f4f6f", "#b5573a"],
  pants: ["#a68a5b", "#22314f", "#5a5f3d", "#5b7391"],
  jacket: ["#161616", "#4a5240", "#8c4a2f", "#3355a8"],
};

interface Props {
  clothing: ActiveClothing;
  onToggle: (category: ClothingCategory) => void;
  onColor: (category: ClothingCategory, color: string) => void;
}

export default function ClothingSwitcher({ clothing, onToggle, onColor }: Props) {
  return (
    <div className="space-y-5">
      {(Object.keys(categoryLabels) as ClothingCategory[]).map((cat) => (
        <div key={cat} className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{categoryLabels[cat]}</span>
            <button
              type="button"
              onClick={() => onToggle(cat)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                clothing[cat].active
                  ? "bg-brand text-white"
                  : "border border-border text-muted hover:border-brand"
              )}
            >
              {clothing[cat].active ? "Wearing" : "Try On"}
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            {swatches[cat].map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => onColor(cat, hex)}
                className={cn(
                  "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                  clothing[cat].color === hex
                    ? "border-brand"
                    : "border-transparent"
                )}
                style={{ backgroundColor: hex }}
                aria-label={hex}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
