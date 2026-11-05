import type { CellTypeKey } from "./cellTypes";

/** [mean log-expression when on, fraction of cells expressing]. */
export type ExprSpec = [number, number];

export type Module = "hla2" | "hla1" | "hlaEF" | "isg" | "ifi27" | "cytokine" | "mt" | "rp" | "control";

/**
 * Expression along latent time t ∈ [0, 1] for cells on the plasmablast →
 * developing-neutrophil path. "loss" fades out at `at`; "wave" switches on at
 * `on`, peaks at `peak`, then decays with time constant `decay`.
 */
export type TrajProfile =
  | { kind: "loss"; at: number; max: number }
  | { kind: "wave"; on: number; peak: number; decay: number; max: number };

export type GeneDef = {
  name: string;
  byType?: Partial<Record<CellTypeKey | "junkMt" | "junkRibo", ExprSpec>>;
  /** Used for every type not listed in byType. */
  base?: ExprSpec;
  module?: Module;
  traj?: TrajProfile;
};

const OFF: ExprSpec = [0.05, 0.02];
const hla2 = (m: number): GeneDef["byType"] => ({
  cd14: [m, 0.92], cd16: [m * 0.85, 0.88], b: [m * 0.9, 0.9], pdc: [m * 0.8, 0.85], cdc: [m, 0.95], pb: [m * 0.4, 0.4],
});
const wave = (on: number, peak: number, decay: number, max: number): TrajProfile => ({ kind: "wave", on, peak, decay, max });
const loss = (at: number, max: number): TrajProfile => ({ kind: "loss", at, max });

export const GENES: GeneDef[] = [
  // Lineage markers
  { name: "CD3E", byType: { cd4t: [2.4, 0.9], cd8t: [2.4, 0.9], gdt: [2.2, 0.88], nk: [0.3, 0.1] } },
  { name: "IL7R", byType: { cd4t: [1.9, 0.72], cd8t: [0.8, 0.28], gdt: [1.0, 0.35] } },
  { name: "CD8A", byType: { cd8t: [2.2, 0.85], gdt: [0.6, 0.2], nk: [0.5, 0.15] } },
  { name: "TRDC", byType: { gdt: [2.4, 0.88], nk: [0.8, 0.3] } },
  { name: "TRGC1", byType: { gdt: [2.0, 0.8], cd8t: [0.3, 0.06] } },
  { name: "TRGC2", byType: { gdt: [2.1, 0.82], cd8t: [0.3, 0.05] } },
  { name: "NCAM1", byType: { nk: [1.7, 0.62], gdt: [0.4, 0.1] } },
  { name: "FCGR3A", byType: { nk: [2.0, 0.8], cd16: [2.8, 0.92], cd14: [0.3, 0.1] } },
  { name: "NKG7", byType: { nk: [3.0, 0.95], cd8t: [1.5, 0.55], gdt: [1.6, 0.6] } },
  { name: "GNLY", byType: { nk: [3.0, 0.92], gdt: [1.4, 0.5], cd8t: [1.0, 0.35] } },
  { name: "MS4A1", byType: { b: [2.5, 0.88], pb: [0.4, 0.15] } },
  { name: "CD79A", byType: { b: [2.6, 0.9], pb: [1.6, 0.7] } },
  { name: "JCHAIN", byType: { b: [0.3, 0.08] }, traj: loss(0.45, 3.0) },
  { name: "MZB1", byType: { b: [0.4, 0.1] }, traj: loss(0.45, 2.8) },
  { name: "CD27", byType: { b: [0.8, 0.3], cd4t: [1.0, 0.4], cd8t: [0.8, 0.3] }, traj: loss(0.4, 2.2) },
  { name: "CD38", byType: { nk: [0.6, 0.25], b: [0.4, 0.12] }, traj: loss(0.42, 2.6) },
  { name: "TNFRSF17", traj: loss(0.38, 2.4) },
  { name: "CD14", byType: { cd14: [2.8, 0.9], cd16: [0.6, 0.25], neut: [0.5, 0.2] } },
  { name: "LYZ", byType: { cd14: [3.2, 0.97], cd16: [2.2, 0.8], cdc: [2.0, 0.8], neut: [1.2, 0.5], pdc: [0.4, 0.2] } },
  { name: "S100A8", byType: { cd14: [3.0, 0.95], cd16: [1.4, 0.5], neut: [2.4, 0.85] } },
  { name: "FCER1A", byType: { cdc: [2.2, 0.8], pdc: [0.3, 0.08] } },
  { name: "CD1C", byType: { cdc: [1.8, 0.7] } },
  { name: "LILRA4", byType: { pdc: [2.8, 0.9] } },
  // Granule genes and TFs along the trajectory (primary → secondary → tertiary)
  { name: "DEFA3", traj: wave(0.36, 0.52, 0.45, 2.6) },
  { name: "ELANE", traj: wave(0.38, 0.55, 0.5, 2.4) },
  { name: "MPO", traj: wave(0.36, 0.52, 0.42, 2.2) },
  { name: "CHI3L1", traj: wave(0.52, 0.7, 0.8, 2.2) },
  { name: "LCN2", traj: wave(0.55, 0.72, 0.8, 2.6) },
  { name: "LTF", traj: wave(0.55, 0.74, 0.9, 2.9) },
  { name: "MMP8", traj: wave(0.72, 0.96, 1, 2.4) },
  { name: "MMP9", traj: wave(0.75, 0.98, 1, 2.2) },
  { name: "CAMP", traj: wave(0.7, 0.95, 1, 2.6) },
  { name: "CEACAM8", traj: wave(0.66, 0.9, 1, 1.8) },
  { name: "CEBPE", traj: wave(0.38, 0.52, 0.2, 1.7) },
  { name: "CEBPD", traj: wave(0.6, 0.8, 0.5, 1.7) },
  // Canonical mature-neutrophil genes: absent in dev. neutrophils
  { name: "FCGR3B", base: [0.1, 0.03] },
  { name: "CXCR2", base: [0.1, 0.03] },
  // HLA class II (down in COVID CD14 Mono) and class I (no consistent change)
  ...["HLA-DRA", "HLA-DRB1", "HLA-DPA1", "HLA-DPB1", "HLA-DQA1", "HLA-DQB1", "HLA-DMA", "HLA-DMB"].map(
    (name, i): GeneDef => ({ name, module: "hla2", byType: hla2(2.9 - i * 0.16) }),
  ),
  ...["HLA-A", "HLA-B", "HLA-C"].map((name): GeneDef => ({ name, module: "hla1", base: [3.0, 0.97] })),
  ...["HLA-E", "HLA-F"].map((name): GeneDef => ({ name, module: "hlaEF", base: [2.2, 0.9] })),
  // Interferon-stimulated genes
  { name: "IFI27", module: "ifi27", base: [0.1, 0.03], byType: { cd14: [0.15, 0.05] } },
  ...["ISG15", "MX1", "IFITM3", "IFI6", "IFI44L", "RSAD2", "OAS1", "IFIT1", "IFIT3"].map(
    (name): GeneDef => ({ name, module: "isg", base: [0.7, 0.35], byType: { cd14: [0.9, 0.45] } }),
  ),
  // Inflammatory cytokines: near zero everywhere (absence is the finding)
  ...["TNF", "IL6", "IL1B", "CCL3", "CCL4", "CXCL2"].map(
    (name): GeneDef => ({ name, module: "cytokine", base: [0.15, 0.02] }),
  ),
  // Mito / ribo genes: high in the two low-quality clusters
  ...["MT-CO1", "MT-ND4", "MT-ATP6"].map(
    (name): GeneDef => ({ name, module: "mt", base: [1.2, 0.7], byType: { junkMt: [3.4, 0.98], junkRibo: [1.4, 0.75] } }),
  ),
  ...["RPS27", "RPL13", "RPL34"].map(
    (name): GeneDef => ({ name, module: "rp", base: [1.8, 0.85], byType: { junkRibo: [3.6, 0.99], junkMt: [2.1, 0.9] } }),
  ),
  // Background genes for module-score controls (never shown)
  ...[1, 2, 3, 4, 5].map((i): GeneDef => ({ name: `CTRL_${i}`, module: "control", base: [1.0, 0.55] })),
];

export const GENE_INDEX: Record<string, number> = Object.fromEntries(GENES.map((g, i) => [g.name, i]));

export const genesIn = (module: Module) => GENES.filter((g) => g.module === module).map((g) => g.name);

export { OFF as OFF_SPEC };
