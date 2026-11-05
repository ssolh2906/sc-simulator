import { CELL_TYPES, GROUPS, type Group } from "@/content/cellTypes";
import { cleanCells } from "./clusters";
import { getSamples } from "./samples";
import { proportionTest, wilcoxonExact } from "./stats";

export type SampleValue = { sample: string; value: number };

let propCache: number[][] | null = null;

/** Fraction of each cell type within each sample: [sample][type]. */
export function sampleProportions(): number[][] {
  if (propCache) return propCache;
  const samples = getSamples();
  const counts = samples.map(() => new Array<number>(CELL_TYPES.length).fill(0));
  for (const c of cleanCells()) counts[c.sample][c.type]++;
  propCache = counts.map((row) => {
    const n = row.reduce((a, b) => a + b, 0);
    return row.map((v) => v / n);
  });
  return propCache;
}

/** One value per sample, grouped. Samples are the replicates, not cells. */
export function perSample(type: number): Record<Group, SampleValue[]> {
  const props = sampleProportions();
  const out = { healthy: [], nonvent: [], ards: [] } as Record<Group, SampleValue[]>;
  for (const s of getSamples()) out[s.group].push({ sample: s.id, value: props[s.index][type] });
  return out;
}

/** Two-sided exact Wilcoxon rank-sum on per-sample proportions, each group vs Healthy. */
export function perSampleTests(type: number): Record<"nonvent" | "ards", number> {
  const g = perSample(type);
  const vals = (k: Group) => g[k].map((v) => v.value);
  return {
    nonvent: wilcoxonExact(vals("nonvent"), vals("healthy")),
    ards: wilcoxonExact(vals("ards"), vals("healthy")),
  };
}

export type Pooled = { group: Group; count: number; total: number; frac: number };

/** The wrong way: pool every cell in a group as if cells were independent. */
export function pooled(type: number): { rows: Pooled[]; p: Record<"nonvent" | "ards", number> } {
  const samples = getSamples();
  const tally = Object.fromEntries(GROUPS.map((g) => [g.key, { count: 0, total: 0 }])) as Record<
    Group,
    { count: number; total: number }
  >;
  for (const c of cleanCells()) {
    const t = tally[samples[c.sample].group];
    t.total++;
    if (c.type === type) t.count++;
  }
  const rows = GROUPS.map((g) => ({ group: g.key, ...tally[g.key], frac: tally[g.key].count / tally[g.key].total }));
  const h = tally.healthy;
  return {
    rows,
    p: {
      nonvent: proportionTest(tally.nonvent.count, tally.nonvent.total, h.count, h.total),
      ards: proportionTest(tally.ards.count, tally.ards.total, h.count, h.total),
    },
  };
}
