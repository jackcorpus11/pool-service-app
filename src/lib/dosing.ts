// Pool/spa chemical dosing estimates.
// Formulas from industry-standard rates (per 10,000 gallons), verified across
// multiple pool-chemistry references. THESE ARE ESTIMATES — always add gradually
// and retest. Add in the safe order, never mix chemicals.

export type DoseResult = {
  chemical: string;      // what to add
  amount: string;        // how much (formatted with unit)
  direction: "raise" | "lower";
  note?: string;         // any caveat
};

// scale factor: how many "10,000-gallon units" this pool is
function volumeFactor(gallons: number): number {
  return gallons / 10000;
}

// ── pH ──
// Lower pH: muriatic acid 31.45% — ~3 fl oz per 10k gal per 0.1 drop
// Raise pH: soda ash — ~7 oz per 10k gal per 0.2 rise
export function dosePH(current: number, target: number, gallons: number): DoseResult | null {
  const diff = target - current;
  if (Math.abs(diff) < 0.1) return null; // close enough
  const vf = volumeFactor(gallons);

  if (diff < 0) {
    // need to LOWER pH → muriatic acid
    const steps = Math.abs(diff) / 0.1;
    const flOz = steps * 3 * vf;
    return {
      chemical: "Muriatic acid (31.45%)",
      amount: `${flOz.toFixed(1)} fl oz`,
      direction: "lower",
      note: "Add slowly to circulating water, away from skimmer. Lowers alkalinity too.",
    };
  } else {
    // need to RAISE pH → soda ash
    const steps = diff / 0.2;
    const oz = steps * 7 * vf;
    const maxOz = 4 * 16 * vf; // max 4 lb per 10k gal
    const capped = Math.min(oz, maxOz);
    return {
      chemical: "Soda ash",
      amount: `${capped.toFixed(1)} oz`,
      direction: "raise",
      note: capped < oz ? "Capped at max safe single dose — retest and repeat if needed." : "Raises alkalinity slightly too.",
    };
  }
}

// ── Total Alkalinity ──
// Raise: baking soda ~1.5 lb per 10k gal per 10 ppm
// Lower: muriatic acid ~25.6 fl oz per 10k gal per 10 ppm (acid-and-aerate)
export function doseAlkalinity(current: number, target: number, gallons: number): DoseResult | null {
  const diff = target - current;
  if (Math.abs(diff) < 5) return null;
  const vf = volumeFactor(gallons);

  if (diff > 0) {
    const lb = (diff / 10) * 1.5 * vf;
    return {
      chemical: "Baking soda (sodium bicarbonate)",
      amount: `${lb.toFixed(2)} lb`,
      direction: "raise",
      note: "Add no more than ~10 ppm rise per day for best results.",
    };
  } else {
    const flOz = (Math.abs(diff) / 10) * 25.6 * vf;
    return {
      chemical: "Muriatic acid (31.45%)",
      amount: `${flOz.toFixed(1)} fl oz`,
      direction: "lower",
      note: "Add in one spot with pump off, then aerate to restore pH. Lowers pH too.",
    };
  }
}

// ── Free Chlorine ──
// Raise: liquid chlorine 12.5% ~10.7 fl oz per 10k gal per 1 ppm
export function doseChlorine(current: number, target: number, gallons: number): DoseResult | null {
  const diff = target - current;
  if (Math.abs(diff) < 0.5) return null;
  const vf = volumeFactor(gallons);

  if (diff > 0) {
    const flOz = diff * 10.7 * vf;
    return {
      chemical: "Liquid chlorine (12.5%)",
      amount: `${flOz.toFixed(1)} fl oz`,
      direction: "raise",
      note: "Pour over return jets with pump running. Never mix with acid.",
    };
  } else {
    return {
      chemical: "Free chlorine is above target",
      amount: "Let it drop naturally",
      direction: "lower",
      note: "Don't add chlorine. Wait for sunlight/use to lower it before swimming.",
    };
  }
}

// ── Calcium Hardness ──
// Raise: calcium chloride ~1.25 lb per 10k gal per 10 ppm (approx)
export function doseCalcium(current: number, target: number, gallons: number): DoseResult | null {
  const diff = target - current;
  if (Math.abs(diff) < 10) return null;
  const vf = volumeFactor(gallons);

  if (diff > 0) {
    const lb = (diff / 10) * 1.25 * vf;
    return {
      chemical: "Calcium chloride",
      amount: `${lb.toFixed(2)} lb`,
      direction: "raise",
      note: "Add last, after other chemistry is balanced.",
    };
  } else {
    return {
      chemical: "Calcium hardness is high",
      amount: "Partial drain & refill",
      direction: "lower",
      note: "Can't be lowered chemically — dilute with fresh water if needed.",
    };
  }
}

// the safe order to add chemicals (industry standard)
export const TREATMENT_ORDER = ["Alkalinity", "pH", "Chlorine", "Calcium"];