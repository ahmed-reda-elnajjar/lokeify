"use client";

interface Slot {
  key: "front" | "side" | "face";
  label: string;
  hint: string;
}

const slots: Slot[] = [
  { key: "front", label: "Front photo", hint: "Standing straight, arms relaxed" },
  { key: "side", label: "Side photo", hint: "Profile view" },
  { key: "face", label: "Face photo", hint: "Clear, front-facing" },
];

interface Props {
  previews: Record<Slot["key"], string | null>;
  onSelect: (key: Slot["key"], file: File) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export default function PhotoUpload({
  previews,
  onSelect,
  onBack,
  onSubmit,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {slots.map((slot) => (
          <label
            key={slot.key}
            className="group relative flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface p-4 text-center transition-colors hover:border-brand"
          >
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onSelect(slot.key, file);
              }}
            />
            {previews[slot.key] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previews[slot.key]!}
                alt={slot.label}
                className="absolute inset-0 h-full w-full rounded-xl object-cover"
              />
            ) : (
              <>
                <span className="text-2xl">📷</span>
                <span className="text-sm font-medium">{slot.label}</span>
                <span className="text-xs text-muted">{slot.hint}</span>
              </>
            )}
          </label>
        ))}
      </div>

      <p className="text-xs text-muted">
        Photos are used only to preview here — nothing is uploaded or
        processed in this prototype.
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-foreground px-6 py-3 text-sm font-medium transition-colors hover:bg-surface-2"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="flex-1 rounded-full bg-brand py-3 text-sm font-medium text-white transition-colors hover:bg-brand-dark sm:flex-none sm:px-8"
        >
          Generate My Avatar
        </button>
      </div>
    </div>
  );
}
