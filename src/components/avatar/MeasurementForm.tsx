"use client";

import { useState } from "react";
import { Measurements } from "@/types";

interface Field {
  key: keyof Measurements;
  label: string;
  unit: string;
  min: number;
  max: number;
}

const fields: Field[] = [
  { key: "heightCm", label: "Height", unit: "cm", min: 140, max: 210 },
  { key: "weightKg", label: "Weight", unit: "kg", min: 35, max: 150 },
  { key: "chestCm", label: "Chest", unit: "cm", min: 70, max: 140 },
  { key: "waistCm", label: "Waist", unit: "cm", min: 60, max: 130 },
  { key: "hipCm", label: "Hip", unit: "cm", min: 70, max: 140 },
  { key: "shoulderCm", label: "Shoulder Width", unit: "cm", min: 35, max: 60 },
  { key: "shoeSize", label: "Shoe Size (EU)", unit: "", min: 35, max: 48 },
];

interface Props {
  initial: Measurements;
  onContinue: (measurements: Measurements) => void;
}

export default function MeasurementForm({ initial, onContinue }: Props) {
  const [values, setValues] = useState<Measurements>(initial);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onContinue(values);
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="flex items-center justify-between text-sm text-muted">
              <span>{f.label}</span>
              <span className="font-mono text-foreground">
                {values[f.key]}
                {f.unit}
              </span>
            </label>
            <input
              type="range"
              min={f.min}
              max={f.max}
              value={values[f.key]}
              onChange={(e) =>
                setValues((v) => ({ ...v, [f.key]: Number(e.target.value) }))
              }
              className="mt-2 w-full accent-[var(--brand)]"
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-brand py-3 text-sm font-medium text-white transition-colors hover:bg-brand-dark sm:w-auto sm:px-8"
      >
        Continue to Photos
      </button>
    </form>
  );
}
