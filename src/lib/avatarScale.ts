import { Measurements } from "@/types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export interface AvatarScale {
  heightScale: number;
  bodyWidthScale: number;
  chestFactor: number;
  waistFactor: number;
  hipFactor: number;
  shoulderScale: number;
  shoeScale: number;
}

// Baseline measurements a "default" avatar is modeled at (175cm / 70kg build).
// Everything below is a simple, deliberately-approximate ratio mapping —
// not real body reconstruction — used only to make the placeholder mannequin
// visually respond to the user's inputs.
export function computeAvatarScale(m: Measurements): AvatarScale {
  const heightScale = clamp(m.heightCm / 175, 0.85, 1.2);
  const chestFactor = clamp(m.chestCm / 96, 0.75, 1.35);
  const waistFactor = clamp(m.waistCm / 82, 0.75, 1.4);
  const hipFactor = clamp(m.hipCm / 98, 0.75, 1.35);
  const weightFactor = clamp(m.weightKg / 70, 0.75, 1.4);
  const bodyWidthScale = clamp(
    chestFactor * 0.5 + weightFactor * 0.5,
    0.8,
    1.35
  );
  const shoulderScale = clamp(m.shoulderCm / 46, 0.85, 1.2);
  const shoeScale = clamp(m.shoeSize / 42, 0.88, 1.15);

  return {
    heightScale,
    bodyWidthScale,
    chestFactor,
    waistFactor,
    hipFactor,
    shoulderScale,
    shoeScale,
  };
}
