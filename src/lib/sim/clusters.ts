import { CELL_TYPES, isJunkType, JUNK_MT, TYPE_INDEX } from "@/content/cellTypes";
import { getDataset, type Cell } from "./cells";

export type Resolution = "low" | "default" | "high";

export const RESOLUTIONS: { key: Resolution; value: number }[] = [
  { key: "low", value: 0.1 },
  { key: "default", value: 0.8 },
  { key: "high", value: 2.0 },
];

export type ClusterInfo = {
  id: number;
  key: string;
  /** Cell types inside this cluster (more than one when under-clustered). */
  types: number[];
  /** Most common type, used for color. */
  main: number;
  /** Index of a sub-cluster when one island is split (over-clustering). */
  sub: number;
  size: number;
  junk: boolean;
};

export type Clustering = { labels: Int16Array; info: ClusterInfo[] };

const T = TYPE_INDEX;
const MERGE_LOW: Record<number, string> = {
  [T.cd4t]: "T/NK", [T.cd8t]: "T/NK", [T.gdt]: "T/NK", [T.nk]: "T/NK",
  [T.cd14]: "Mono", [T.cd16]: "Mono", [T.b]: "B", [T.pb]: "B", [T.pdc]: "DC", [T.cdc]: "DC",
};

/** Big islands split in two at high resolution, along one axis. */
const SPLIT_HIGH: Record<number, "x" | "y"> = { [T.cd4t]: "x", [T.cd8t]: "y", [T.cd14]: "y", [T.b]: "x" };

function keyOf(c: Cell, res: Resolution): string {
  if (isJunkType(c.type)) return res === "low" ? "junk" : `t${c.type}`;
  if (res === "low") return MERGE_LOW[c.type] ?? `t${c.type}`;
  const axis = res === "high" ? SPLIT_HIGH[c.type] : undefined;
  if (axis) {
    const [cx, cy] = CELL_TYPES[c.type].umap;
    const side = axis === "x" ? c.ux > cx : c.uy > cy;
    return `t${c.type}#${side ? 1 : 0}`;
  }
  return `t${c.type}`;
}

const cache = new Map<Resolution, Clustering>();

/**
 * Stand-in for SNN graph + Louvain. Cluster IDs follow Seurat's habit:
 * 0 is the biggest cluster.
 */
export function getClusters(res: Resolution): Clustering {
  const hit = cache.get(res);
  if (hit) return hit;
  const { cells } = getDataset();
  const keys = cells.map((c) => keyOf(c, res));
  const members = new Map<string, Map<number, number>>();
  keys.forEach((k, i) => {
    const m = members.get(k) ?? new Map<number, number>();
    m.set(cells[i].type, (m.get(cells[i].type) ?? 0) + 1);
    members.set(k, m);
  });
  const size = (k: string) => [...members.get(k)!.values()].reduce((a, b) => a + b, 0);
  const order = [...members.keys()].sort((a, b) => size(b) - size(a));
  const idOf = new Map(order.map((k, i) => [k, i]));
  const info: ClusterInfo[] = order.map((k, id) => {
    const m = members.get(k)!;
    const types = [...m.keys()].sort((a, b) => m.get(b)! - m.get(a)!);
    return {
      id,
      key: k,
      types,
      main: types[0],
      sub: k.includes("#") ? Number(k.split("#")[1]) : 0,
      size: size(k),
      junk: types.every(isJunkType),
    };
  });
  const result = { labels: Int16Array.from(keys, (k) => idOf.get(k)!), info };
  cache.set(res, result);
  return result;
}

export function cellsOfCluster(clustering: Clustering, id: number): Cell[] {
  const { cells } = getDataset();
  return cells.filter((_, i) => clustering.labels[i] === id);
}

/** IDs of the two low-quality clusters at default resolution. */
export function junkClusterIds(): number[] {
  return getClusters("default").info.filter((c) => c.junk).map((c) => c.id);
}

/** Which junk cluster is mito-dominated (vs ribo-dominated). */
export const isMitoJunk = (info: ClusterInfo) => info.main === JUNK_MT;

let clean: Cell[] | null = null;

/** Cells kept for annotation and later steps: real types only. */
export function cleanCells(): Cell[] {
  clean ??= getDataset().cells.filter((c) => !isJunkType(c.type));
  return clean;
}
