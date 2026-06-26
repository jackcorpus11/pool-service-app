// Standard target ranges for pool water chemistry.
// Pools and hot tubs differ, so each has its own set.
// Sources: these are widely-published industry ranges, but always defer to
// your own test kit guidance and professional judgment.

export type Range = { min: number; max: number; unit: string; label: string };

export const POOL_RANGES: Record<string, Range> = {
  ph: { min: 7.4, max: 7.6, unit: "", label: "pH" },
  freeChlorine: { min: 1, max: 3, unit: "ppm", label: "Free chlorine" },
  totalAlkalinity: { min: 80, max: 120, unit: "ppm", label: "Total alkalinity" },
  cyanuricAcid: { min: 30, max: 50, unit: "ppm", label: "Cyanuric acid" },
  calciumHardness: { min: 200, max: 400, unit: "ppm", label: "Calcium hardness" },
  salt: { min: 2700, max: 3400, unit: "ppm", label: "Salt" },
  waterTemp: { min: 78, max: 82, unit: "°F", label: "Water temp" },
};

export const HOT_TUB_RANGES: Record<string, Range> = {
  ph: { min: 7.2, max: 7.8, unit: "", label: "pH" },
  freeChlorine: { min: 2, max: 4, unit: "ppm", label: "Free chlorine" },
  totalAlkalinity: { min: 80, max: 120, unit: "ppm", label: "Total alkalinity" },
  cyanuricAcid: { min: 30, max: 50, unit: "ppm", label: "Cyanuric acid" },
  calciumHardness: { min: 150, max: 250, unit: "ppm", label: "Calcium hardness" },
  salt: { min: 2700, max: 3400, unit: "ppm", label: "Salt" },
  waterTemp: { min: 100, max: 104, unit: "°F", label: "Water temp" },
};

// given a reading key and value, say whether it's low / good / high
export function checkRange(
  key: string,
  value: number | null,
  isHotTub: boolean
): "low" | "good" | "high" | "none" {
  if (value === null || isNaN(value)) return "none";
  const ranges = isHotTub ? HOT_TUB_RANGES : POOL_RANGES;
  const r = ranges[key];
  if (!r) return "none";
  if (value < r.min) return "low";
  if (value > r.max) return "high";
  return "good";
}