import { TYPE_INDEX } from "@/content/cellTypes";
import { cleanCells } from "./clusters";
import { expr, geneIndex } from "./expression";
import { covidSamples, getSamples } from "./samples";
import { wilcoxon } from "./stats";
import type { Cell } from "./cells";

export type DeCell = { gene: string; sample: string; log2fc: number; padj: number; sig: boolean };

/** Bonferroni over the genes FindMarkers tests after its min.pct / logfc prefilters. */
const N_TESTS = 3000;
const LOGFC_MIN = 0.25;

let monoCache: Cell[] | null = null;

export function cd14Cells(): Cell[] {
  monoCache ??= cleanCells().filter((c) => c.type === TYPE_INDEX.cd14);
  return monoCache;
}

/** Seurat-style avg log2FC: log2(mean(expm1(x)) + 1) difference. */
function avgLog2(values: number[]): number {
  const m = values.reduce((s, v) => s + Math.expm1(v), 0) / Math.max(values.length, 1);
  return Math.log2(m + 1);
}

const deCache = new Map<string, DeCell[]>();

/**
 * Paper design: each COVID sample's CD14 Mono vs all healthy CD14 Mono,
 * Wilcoxon test, Bonferroni-adjusted.
 */
export function perSampleDe(genes: string[]): DeCell[] {
  const key = genes.join(",");
  const hit = deCache.get(key);
  if (hit) return hit;
  const samples = getSamples();
  const mono = cd14Cells();
  const healthy = mono.filter((c) => samples[c.sample].group === "healthy");
  const out: DeCell[] = [];
  for (const gene of genes) {
    const gi = geneIndex(gene);
    const ref = healthy.map((c) => expr(c, gi));
    const refLog = avgLog2(ref);
    for (const s of covidSamples()) {
      const vals = mono.filter((c) => c.sample === s.index).map((c) => expr(c, gi));
      const log2fc = avgLog2(vals) - refLog;
      const padj = Math.min(1, wilcoxon(vals, ref) * N_TESTS);
      out.push({ gene, sample: s.id, log2fc, padj, sig: padj < 0.05 && Math.abs(log2fc) > LOGFC_MIN });
    }
  }
  deCache.set(key, out);
  return out;
}

/** The wrong-but-common design: pool every COVID cell against every healthy cell. */
export function pooledLog2fc(gene: string): number {
  const samples = getSamples();
  const gi = geneIndex(gene);
  const mono = cd14Cells();
  const pick = (covid: boolean) =>
    mono.filter((c) => (samples[c.sample].group !== "healthy") === covid).map((c) => expr(c, gi));
  return avgLog2(pick(true)) - avgLog2(pick(false));
}
