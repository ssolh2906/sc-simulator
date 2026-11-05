import { TYPE_INDEX } from "@/content/cellTypes";
import { getDataset } from "./cells";
import { createRng, poisson, SEED } from "./rng";
import { linearFit } from "./stats";

export type NormMethod = "raw" | "log" | "sct";

export type DepthPoint = { depth: number; raw: number; log: number; sct: number };

/** A panel of low-count genes; averaging them per cell makes the depth trend visible. */
const N_GENES = 40;
const BASE_RATE = 0.0005;
const SCT_THETA = 100;

let cache: DepthPoint[] | null = null;

/**
 * Depth-leak demo on CD4 T cells. UMI counts are Poisson(rate × depth), so the
 * biology is identical across depth. Each point is one cell's average over the panel.
 */
export function depthLeakPoints(): DepthPoint[] {
  if (cache) return cache;
  const r = createRng(SEED + 3);
  const { cells, qcCells } = getDataset();
  const depths = cells.filter((c) => c.type === TYPE_INDEX.cd4t).map((c) => qcCells[c.id].nCount);
  const rates = Array.from({ length: N_GENES }, () => BASE_RATE * Math.exp(0.5 * r.gauss()));
  const counts = depths.map((d) => rates.map((rate) => poisson(rate * d * Math.exp(0.1 * r.gauss()), r)));
  const totalDepth = depths.reduce((a, b) => a + b, 0);
  // SCTransform-style Pearson residuals under a negative binomial model, per gene.
  const rateHat = rates.map((_, g) => counts.reduce((a, row) => a + row[g], 0) / totalDepth);
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  cache = depths.map((depth, i) => ({
    depth,
    raw: avg(counts[i]),
    log: avg(counts[i].map((c) => Math.log1p((c / depth) * 1e4))),
    sct: avg(
      counts[i].map((c, g) => {
        const mu = rateHat[g] * depth;
        return (c - mu) / Math.sqrt(mu + (mu * mu) / SCT_THETA);
      }),
    ),
  }));
  return cache;
}

/** Trend of value vs log10(depth): slope and Pearson r. */
export function depthTrend(points: DepthPoint[], method: NormMethod) {
  return linearFit(
    points.map((p) => Math.log10(p.depth)),
    points.map((p) => p[method]),
  );
}

/** Three-cell toy example: same biology, different sequencing depth. */
export const TOY_CELLS = [
  { name: "Cell A", depth: 1200, cd3e: 6 },
  { name: "Cell B", depth: 4800, cd3e: 24 },
  { name: "Cell C", depth: 2400, cd3e: 12 },
];

export function toyValues(method: NormMethod) {
  const median = 2400;
  return TOY_CELLS.map((c) => {
    if (method === "raw") return { total: c.depth, gene: c.cd3e };
    if (method === "log") return { total: 1e4, gene: Math.log1p((c.cd3e / c.depth) * 1e4) };
    // SCT also returns counts corrected to the median depth.
    return { total: median, gene: (c.cd3e / c.depth) * median };
  });
}
