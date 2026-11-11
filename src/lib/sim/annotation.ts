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

export type RefType = { key: CellTypeKey; high: string[]; low?: string[] };

/**
 * A typical PBMC marker reference. Dev. Neutrophils are left out on purpose:
 * granulocytes are normally removed when PBMCs are prepared, so no PBMC table lists them.
 */
export const PBMC_REFERENCE: RefType[] = [
  { key: "cd4t", high: ["CD3E", "IL7R"], low: ["CD8A"] },
  { key: "cd8t", high: ["CD3E", "CD8A"] },
  { key: "gdt", high: ["CD3E", "TRDC"] },
  { key: "nk", high: ["NCAM1", "FCGR3A"], low: ["CD3E"] },
  { key: "b", high: ["MS4A1"] },
  { key: "pb", high: ["JCHAIN"], low: ["MS4A1"] },
  { key: "cd14", high: ["CD14", "LYZ"] },
  { key: "cd16", high: ["FCGR3A", "LYZ"], low: ["CD14"] },
  { key: "pdc", high: ["LILRA4"] },
  { key: "cdc", high: ["FCER1A", "LYZ"] },
];

/** Below this, no reference type fits: the cluster stays unknown. */
export const MATCH_MIN = 0.5;
/** Best and runner-up closer than this: label it, but flag low confidence. */
export const MATCH_MARGIN = 0.25;

export type RefMatch = {
  cluster: number;
  /** null = unknown: no reference type scores above MATCH_MIN. */
  key: CellTypeKey | null;
  score: number;
  runnerUp: CellTypeKey;
  runnerUpScore: number;
  confident: boolean;
  /** % expressing each gene of the closest reference type: why it matched, or why even that fails. */
  evidence: { gene: string; pct: number; want: "high" | "low" }[];
};

let matchCache: RefMatch[] | null = null;

/** Score = mean % expressing the "high" genes minus mean % expressing the "low" genes. */
export function matchReference(): RefMatch[] {
  if (matchCache) return matchCache;
  const clustering = getClusters("default");
  const ids = clustering.info.filter((c) => !c.junk).map((c) => c.id);
  const genes = [...new Set(PBMC_REFERENCE.flatMap((r) => [...r.high, ...(r.low ?? [])]))];
  const pct = new Map(clusterDotPlot(genes, ids).map((d) => [`${d.gene}|${d.cluster}`, d.pct]));
  const mean = (gs: string[], id: number) => (gs.length ? gs.reduce((s, g) => s + pct.get(`${g}|${id}`)!, 0) / gs.length : 0);
  matchCache = ids.map((id) => {
    const ranked = PBMC_REFERENCE.map((r) => ({ key: r.key, score: mean(r.high, id) - mean(r.low ?? [], id) })).sort(
      (a, b) => b.score - a.score,
    );
    const [best, next] = ranked;
    const known = best.score >= MATCH_MIN;
    const ref = PBMC_REFERENCE.find((r) => r.key === best.key)!;
    const evidence = [
      ...ref.high.map((gene) => ({ gene, pct: pct.get(`${gene}|${id}`)!, want: "high" as const })),
      ...(ref.low ?? []).map((gene) => ({ gene, pct: pct.get(`${gene}|${id}`)!, want: "low" as const })),
    ];
    return {
      evidence,
      cluster: id,
      key: known ? best.key : null,
      score: best.score,
      runnerUp: known ? next.key : best.key,
      runnerUpScore: known ? next.score : best.score,
      confident: known && best.score - next.score >= MATCH_MARGIN,
    };
  });
  return matchCache;
}

/** Reveal order for the matching animation: known clusters by ID, then the leftovers nothing fits. */
export function matchOrder(): RefMatch[] {
  const rows = matchReference();
  return [...rows.filter((r) => r.key), ...rows.filter((r) => !r.key)];
}

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
