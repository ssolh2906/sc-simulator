import { GROUPS, type Group } from "@/content/cellTypes";
import { genesIn } from "@/content/genes";
import { cd14Cells } from "./de";
import { expr, geneIndex } from "./expression";
import { getSamples } from "./samples";
import { median } from "./stats";
import type { SampleValue } from "./composition";

const CONTROL = genesIn("control").map(geneIndex);

/** AddModuleScore idea: mean of the gene set minus mean of control genes, per cell. */
export function moduleScore(cell: Parameters<typeof expr>[0], genes: number[]): number {
  const avg = (gs: number[]) => gs.reduce((s, g) => s + expr(cell, g), 0) / gs.length;
  return avg(genes) - avg(CONTROL);
}

const cache = new Map<string, Record<Group, SampleValue[]>>();

/** Median CD14 Mono module score per sample, grouped. One point per sample. */
export function moduleBySample(genes: string[]): Record<Group, SampleValue[]> {
  const key = genes.join(",");
  const hit = cache.get(key);
  if (hit) return hit;
  const idx = genes.map(geneIndex);
  const scores = getSamples().map(() => [] as number[]);
  for (const c of cd14Cells()) scores[c.sample].push(moduleScore(c, idx));
  const out = Object.fromEntries(GROUPS.map((g) => [g.key, [] as SampleValue[]])) as Record<Group, SampleValue[]>;
  for (const s of getSamples()) out[s.group].push({ sample: s.id, value: median(scores[s.index]) });
  cache.set(key, out);
  return out;
}
