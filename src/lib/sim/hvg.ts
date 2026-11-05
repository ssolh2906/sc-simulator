import { clamp, createRng, SEED } from "./rng";

export type HvgGene = { name: string; mean: number; variance: number; labeled: boolean; housekeeping: boolean };

/** Each dot stands for about this many genes, out of ~20,000. */
export const TOTAL_GENES = 20000;
const N_BACKGROUND = 380;

const MARKERS: [string, number, number][] = [
  ["LYZ", 1.1, 9.4], ["LTF", -0.5, 8.9], ["NKG7", 0.45, 8.4], ["S100A8", 0.9, 8.1], ["JCHAIN", -0.2, 7.8],
  ["GNLY", 0.5, 7.6], ["CD3E", 0.3, 7.2], ["CD14", 0.2, 6.9], ["MS4A1", -0.1, 6.6], ["FCGR3A", 0.1, 6.2],
  ["IFI27", -0.4, 5.8], ["LILRA4", -0.9, 5.4], ["HLA-DRA", 0.95, 5.1],
];
const HOUSEKEEPING: [string, number, number][] = [
  ["GAPDH", 0.95, 0.8], ["RPL13", 1.25, 1.15], ["ACTB", 1.55, 0.75], ["B2M", 1.8, 1.2], ["MALAT1", 2.05, 0.85],
];

let cache: HvgGene[] | null = null;

/** Mean vs residual variance, sorted by variance (most variable first). */
export function hvgGenes(): HvgGene[] {
  if (cache) return cache;
  const r = createRng(SEED + 4);
  const genes: HvgGene[] = [
    ...MARKERS.map(([name, mean, variance]) => ({ name, mean, variance, labeled: true, housekeeping: false })),
    ...HOUSEKEEPING.map(([name, mean, variance]) => ({ name, mean, variance, labeled: true, housekeeping: true })),
  ];
  for (let i = 0; i < N_BACKGROUND; i++) {
    const spike = r.next() < 0.08 ? r.next() * 2.8 : 0;
    genes.push({
      name: `gene ${i + 1}`,
      mean: -1.6 + r.next() * 3.4,
      variance: clamp(0.9 + Math.abs(r.gauss()) * 0.55 + spike, 0.3, 4.6),
      labeled: false,
      housekeeping: false,
    });
  }
  cache = genes.sort((a, b) => b.variance - a.variance);
  return cache;
}

/** How many dots fall inside the top-N selection. */
export const dotsSelected = (nTop: number) => Math.round((hvgGenes().length * nTop) / TOTAL_GENES);
