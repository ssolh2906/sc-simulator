export type Group = "healthy" | "nonvent" | "ards";

export const GROUPS: { key: Group; name: string; color: string }[] = [
  { key: "healthy", name: "Healthy", color: "var(--healthy)" },
  { key: "nonvent", name: "NonVent", color: "var(--nonvent)" },
  { key: "ards", name: "ARDS", color: "var(--ards)" },
];

export type CellTypeKey =
  | "cd4t"
  | "cd8t"
  | "gdt"
  | "nk"
  | "b"
  | "pb"
  | "cd14"
  | "cd16"
  | "pdc"
  | "cdc"
  | "neut";

export type CellType = {
  key: CellTypeKey;
  name: string;
  short: string;
  /** CSS custom property holding the type color (lineage families share hues). */
  token: string;
  umap: [number, number];
  sd: [number, number];
  /**
   * Mean % of PBMCs per group. Only the direction follows the paper (Fig 1d);
   * the magnitudes are invented for teaching.
   */
  pct: Record<Group, number>;
};

export const CELL_TYPES: CellType[] = [
  { key: "cd4t", name: "CD4 T", short: "CD4 T", token: "--ct-cd4t", umap: [-4.3, 2.0], sd: [1.15, 0.9], pct: { healthy: 30, nonvent: 30, ards: 27 } },
  { key: "cd8t", name: "CD8 T", short: "CD8 T", token: "--ct-cd8t", umap: [-1.4, 4.2], sd: [0.9, 0.7], pct: { healthy: 14, nonvent: 13, ards: 12 } },
  { key: "gdt", name: "γδ T", short: "γδ T", token: "--ct-gdt", umap: [-3.9, 5.7], sd: [0.45, 0.4], pct: { healthy: 3.5, nonvent: 1.4, ards: 1.2 } },
  { key: "nk", name: "NK", short: "NK", token: "--ct-nk", umap: [1.2, 6.3], sd: [0.75, 0.55], pct: { healthy: 10, nonvent: 7.8, ards: 4.2 } },
  { key: "b", name: "B", short: "B", token: "--ct-b", umap: [4.8, 4.6], sd: [0.8, 0.6], pct: { healthy: 9, nonvent: 9, ards: 8 } },
  { key: "pb", name: "Plasmablast", short: "PB", token: "--ct-pb", umap: [7.3, 1.6], sd: [0.42, 0.42], pct: { healthy: 0.5, nonvent: 3.5, ards: 6.5 } },
  { key: "cd14", name: "CD14 Mono", short: "CD14 Mono", token: "--ct-cd14", umap: [1.2, -3.1], sd: [1.1, 0.85], pct: { healthy: 20, nonvent: 17.5, ards: 18.5 } },
  { key: "cd16", name: "CD16 Mono", short: "CD16 Mono", token: "--ct-cd16", umap: [3.4, -5.9], sd: [0.55, 0.45], pct: { healthy: 6.5, nonvent: 5, ards: 2.5 } },
  { key: "pdc", name: "pDC", short: "pDC", token: "--ct-pdc", umap: [-4.8, -4.4], sd: [0.4, 0.4], pct: { healthy: 1.5, nonvent: 0.6, ards: 0.6 } },
  { key: "cdc", name: "cDC", short: "cDC", token: "--ct-cdc", umap: [-1.8, -5.6], sd: [0.45, 0.4], pct: { healthy: 2.5, nonvent: 2, ards: 1.0 } },
  { key: "neut", name: "Dev. Neutrophil", short: "Dev. Neut", token: "--ct-neut", umap: [7.1, -2.5], sd: [0.55, 0.5], pct: { healthy: 0.3, nonvent: 0.9, ards: 10 } },
];

export const TYPE_INDEX = Object.fromEntries(CELL_TYPES.map((t, i) => [t.key, i])) as Record<
  CellTypeKey,
  number
>;

/**
 * Two low-quality clusters that pass QC but group together later
 * (the paper removed two mito/ribo-dominated clusters after clustering).
 * They use type indices right after the 11 real types.
 */
export const JUNK_TYPES = [
  { key: "junkMt", name: "Low-quality (MT-)", umap: [-6.2, -0.9] as [number, number], sd: [0.42, 0.38] as [number, number] },
  { key: "junkRibo", name: "Low-quality (RP-)", umap: [-1.6, 0.4] as [number, number], sd: [0.45, 0.36] as [number, number] },
] as const;

export const JUNK_MT = CELL_TYPES.length;
export const JUNK_RIBO = CELL_TYPES.length + 1;
export const isJunkType = (t: number) => t >= CELL_TYPES.length;

/** Plot domain shared by every UMAP view. */
export const UMAP_DOMAIN = { x: [-8, 9.5] as [number, number], y: [-8, 8.6] as [number, number] };
