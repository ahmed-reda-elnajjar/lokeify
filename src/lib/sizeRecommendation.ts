import { Measurements, Product } from "@/types";

export interface SizeRecommendation {
  size: string;
  confidence: "high" | "medium" | "low";
  note: string;
}

export function recommendSize(
  measurements: Measurements | null,
  product: Product
): SizeRecommendation | null {
  if (!measurements) return null;

  const referenceCm =
    product.category === "pants"
      ? measurements.waistCm + (measurements.hipCm - measurements.waistCm) * 0.4
      : measurements.chestCm;

  const exact = product.sizeChart.find(
    (entry) => referenceCm >= entry.chestMinCm && referenceCm < entry.chestMaxCm
  );

  if (exact) {
    return {
      size: exact.size,
      confidence: "high",
      note: `Based on your measurements, ${exact.size} should fit true to size.`,
    };
  }

  const sorted = [...product.sizeChart].sort(
    (a, b) => a.chestMinCm - b.chestMinCm
  );
  const smallest = sorted[0];
  const largest = sorted[sorted.length - 1];

  if (referenceCm < smallest.chestMinCm) {
    return {
      size: smallest.size,
      confidence: "medium",
      note: `You're a little under our size chart — ${smallest.size} is the closest fit.`,
    };
  }

  return {
    size: largest.size,
    confidence: "medium",
    note: `You're a little over our size chart — ${largest.size} is the closest fit.`,
  };
}
