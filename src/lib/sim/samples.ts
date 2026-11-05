import { CELL_TYPES, type Group } from "@/content/cellTypes";
import { createRng, SEED } from "./rng";

export type Sample = {
  id: string;
  index: number;
  group: Group;
  /** Real cells that pass the paper's QC. */
  nCells: number;
  /** Fraction of each cell type (sums to 1). */
  props: number[];
  /** Multiplier on CD14 Mono HLA class II expression. */
  hlaFactor: number;
  /** Multiplier on CD14 Mono ISG expression. */
  isgFactor: number;
  /** One of the COVID samples with little or no ISG signal. */
  isgLow: boolean;
  /** IFI27 rises in most donors, even some ISG-low ones. */
  ifi27Up: boolean;
};

// Generic IDs: donor-level mapping to the paper's C1–C7 is not verified.
const PLAN: { id: string; group: Group }[] = [
  ...[1, 2, 3, 4, 5, 6].map((i) => ({ id: `H${i}`, group: "healthy" as const })),
  ...[1, 2, 3, 4].map((i) => ({ id: `N${i}`, group: "nonvent" as const })),
  ...[1, 2, 3, 4].map((i) => ({ id: `A${i}`, group: "ards" as const })),
];

// 3 of 8 COVID samples are ISG-low (paper: 3 donors). Which IDs is our choice.
const ISG_LOW = new Set(["N2", "A1", "A3"]);
const IFI27_FLAT = new Set(["A3"]);

// Rare or strongly changing types vary more between people.
const NOISY = new Set(["gdt", "pb", "pdc", "cdc", "neut"]);

let cache: Sample[] | null = null;

export function getSamples(): Sample[] {
  if (cache) return cache;
  const rng = createRng(SEED + 1);
  cache = PLAN.map(({ id, group }, index) => {
    const raw = CELL_TYPES.map(
      (t) => t.pct[group] * Math.exp(rng.gauss() * (NOISY.has(t.key) ? 0.35 : 0.2)),
    );
    const sum = raw.reduce((a, b) => a + b, 0);
    const covid = group !== "healthy";
    const isgLow = ISG_LOW.has(id);
    return {
      id,
      index,
      group,
      nCells: 120 + Math.floor(rng.next() * 41),
      props: raw.map((v) => v / sum),
      hlaFactor:
        group === "healthy"
          ? 1 + rng.gauss() * 0.02
          : (group === "ards" ? 0.64 : 0.7) + rng.gauss() * 0.02,
      isgFactor: !covid || isgLow ? 1 + rng.gauss() * 0.04 : 2.1 + rng.next() * 0.6,
      isgLow: covid && isgLow,
      ifi27Up: covid && !IFI27_FLAT.has(id),
    };
  });
  return cache;
}

export const covidSamples = () => getSamples().filter((s) => s.group !== "healthy");
