import { CELL_TYPES, type CellTypeKey } from "@/content/cellTypes";
import { GENES } from "@/content/genes";
import { getDataset, type Cell } from "./cells";
import { cellsOfCluster, getClusters } from "./clusters";
import { dotStats, expr } from "./expression";
import { hash01 } from "./rng";

/** Genes on the annotation dot plot, in lineage order. */
export const ANNOTATION_MARKERS = [
  "CD3E", "IL7R", "CD8A", "TRDC", "NCAM1", "FCGR3A", "MS4A1", "JCHAIN",
  "CD14", "LYZ", "FCER1A", "LILRA4", "ELANE", "LTF", "FCGR3B",
];

export type DotCell = { gene: string; cluster: number; avg: number; pct: number };

const dotCache = new Map<string, DotCell[]>();

/** Dot-plot stats for default-resolution clusters (pass the IDs to show). */
export function clusterDotPlot(genes: string[], clusterIds: number[]): DotCell[] {
  const key = `${genes.join(",")}|${clusterIds.join(",")}`;
  const hit = dotCache.get(key);
  if (hit) return hit;
  const clustering = getClusters("default");
  const groups = clusterIds.map((id) => cellsOfCluster(clustering, id));
  const out = genes.flatMap((gene) =>
    clusterIds.map((cluster, k) => ({ gene, cluster, ...dotStats(groups[k], gene) })),
  );
  dotCache.set(key, out);
  return out;
}

const CANDIDATES = GENES.map((g, i) => ({ g, i })).filter(({ g }) => g.module !== "control");

/** Like FindMarkers' logfc.threshold: ignore tiny differences. */
const MIN_DIFF = 0.25;

/** Top genes by mean difference, cluster vs all other cells (a quick FindMarkers). */
export function topMarkers(clusterId: number, n = 5): string[] {
  const { labels } = getClusters("default");
  const { cells } = getDataset();
  const inside = cells.filter((_, i) => labels[i] === clusterId);
  const outside = cells.filter((_, i) => labels[i] !== clusterId);
  const avg = (group: Cell[], gi: number) =>
    group.reduce((s, c) => s + expr(c, gi), 0) / Math.max(group.length, 1);
  return CANDIDATES.map(({ g, i }) => ({ name: g.name, d: avg(inside, i) - avg(outside, i) }))
    .filter((x) => x.d > MIN_DIFF)
    .sort((a, b) => b.d - a.d)
    .slice(0, n)
    .map((x) => x.name);
}

export const isMtOrRibo = (gene: string) => /^(MT-|RPS|RPL)/.test(gene);

/** SingleR-style agreement per type, and the label it confuses each type with. */
const SINGLE_R: Record<CellTypeKey, [number, string]> = {
  cd4t: [0.95, "CD8 T"], cd8t: [0.88, "CD4 T"], gdt: [0.58, "CD8 T"], nk: [0.93, "CD8 T"],
  b: [0.97, "Plasmablast"], pb: [0.9, "B"], cd14: [0.96, "CD16 Mono"], cd16: [0.91, "CD14 Mono"],
  pdc: [0.95, "cDC"], cdc: [0.84, "CD14 Mono"], neut: [0.7, "Neutrophil (mature)"],
};

export type SingleRRow = { cluster: number; label: string; agree: number; alt: string };

let singleRCache: SingleRRow[] | null = null;

/** Per-cluster share of cells where the reference label matches the manual label. */
export function singleRAgreement(): SingleRRow[] {
  if (singleRCache) return singleRCache;
  const clustering = getClusters("default");
  singleRCache = clustering.info
    .filter((c) => !c.junk)
    .map((c) => {
      const t = CELL_TYPES[c.main];
      const [p, alt] = SINGLE_R[t.key];
      const cells = cellsOfCluster(clustering, c.id);
      const agree = cells.filter((cell) => hash01(cell.id, 99991) < p).length / cells.length;
      return { cluster: c.id, label: t.name, agree, alt };
    });
  return singleRCache;
}

/** The correct manual label for each non-junk default cluster. */
export function answerKey(): Record<number, string> {
  return Object.fromEntries(
    getClusters("default")
      .info.filter((c) => !c.junk)
      .map((c) => [c.id, CELL_TYPES[c.main].name]),
  );
}

export const TYPE_NAMES = CELL_TYPES.map((t) => t.name);
