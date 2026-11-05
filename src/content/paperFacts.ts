/**
 * The only place that makes claims about the paper. Every fact names the
 * figure or section it came from. Everything else in the app is synthetic.
 *
 * Wilk AJ et al. A single-cell atlas of the peripheral immune response in
 * patients with severe COVID-19. Nature Medicine 26, 1070–1076 (2020).
 */
export const CITATION = {
  authors: "Wilk AJ, Rustagi A, Zhao NQ, … Rogers AJ, Blish CA.",
  title: "A single-cell atlas of the peripheral immune response in patients with severe COVID-19.",
  journal: "Nature Medicine 26, 1070–1076 (2020).",
  doi: "https://doi.org/10.1038/s41591-020-0944-y",
} as const;

export type PaperFact = { text: string; source: string };

export const PAPER_FACTS = {
  method: { text: "Seq-Well scRNA-seq on PBMCs.", source: "Main text" },
  donors: { text: "7 hospitalized patients gave 8 samples (one was sampled twice, before and after intubation), plus 6 healthy controls.", source: "Main text, Fig 1a" },
  groups: { text: "Comparison groups: Healthy n = 6, NonVent n = 4, ARDS n = 4 samples.", source: "Fig 1d legend" },
  scale: { text: "44,721 cells, about 3,194 per sample, in 30 clusters.", source: "Main text" },
  qcUmi: { text: "Cells with < 1,000 or > 15,000 UMIs were removed.", source: "Methods: alignment and QC" },
  qcMt: { text: "Cells with > 20% mitochondrial or > 20% rRNA (RNA18S5, RNA28S5) reads were removed.", source: "Methods: alignment and QC" },
  qcMultiplet: { text: "Cells with > 75 genes per 100 UMIs were removed as likely multiplets.", source: "Methods: alignment and QC" },
  qcGenes: { text: "Genes expressed in < 10 cells were removed.", source: "Methods: alignment and QC" },
  sct: { text: "SCTransform for scaling, transformation and variable genes, regressing out genes/cell, UMIs/cell, %mt and %rRNA.", source: "Methods: computational pipelines" },
  pcs: { text: "PCA on variable genes; the first 50 PCs fed both UMAP and the SNN graph.", source: "Methods: computational pipelines" },
  clustering: { text: "FindNeighbors() + FindClusters() with Louvain modularity optimization.", source: "Methods: computational pipelines" },
  junk: { text: "Two clusters dominated by mito/ribo genes (65% and 100% of positively enriched genes) were removed after clustering.", source: "Methods: computational pipelines" },
  annotation: { text: "Clusters were named with FindMarkers() (Wilcoxon) and known markers, then confirmed with SingleR.", source: "Methods: computational pipelines" },
  nkMarkers: { text: "NK clusters were enriched for NCAM1 and FCGR3A.", source: "Methods" },
  gdMarkers: { text: "γδ T cells were identified by TRGC1, TRGC2 and TRDC.", source: "Methods" },
  depleted: { text: "Depleted in COVID-19: γδ T, pDC, cDC, CD16 monocytes, NK. cDC, CD16 Mono and NK were significant only in ARDS.", source: "Fig 1d" },
  plasmablasts: { text: "Plasmablasts increased, most in ARDS.", source: "Fig 1d" },
  devNeut: { text: "Developing neutrophils increased, significant only in ARDS.", source: "Fig 1d" },
  devNeutGenes: { text: "Developing neutrophils express ELANE, LTF, MMP8 (also MPO, LCN2, CEACAM8) but not FCGR3B or CXCR2.", source: "Main text, Fig 1" },
  devNeutPosition: { text: "In UMAP they sit near plasmablasts, not near canonical neutrophils.", source: "Fig 1" },
  compositionStats: { text: "Two-sided Wilcoxon rank-sum test on per-sample proportions.", source: "Fig 1d legend" },
  monoDesign: { text: "DE design: each COVID-19 sample vs all healthy controls (Wilcoxon, Bonferroni-adjusted).", source: "Fig 2" },
  hla2: { text: "Eight HLA class II genes were down in ≥ 6 COVID samples; the HLA class II module score was down in all patients.", source: "Fig 2" },
  hla1: { text: "Classical HLA class I (A, B, C) did not change consistently; HLA-E and HLA-F went down mildly.", source: "Fig 2" },
  isg: { text: "32 ISGs were up in ≥ 1 sample, but the signature was heterogeneous; 3 samples showed little or no ISG signal. IFI27 was up in most donors.", source: "Fig 2" },
  cytokines: { text: "No substantial expression of TNF, IL6, IL1B, CCL3, CCL4 or CXCL2 in peripheral monocytes; the same held for T and NK cells.", source: "Fig 2, main text" },
  nk: { text: "CD56bright NK cells were depleted in all COVID samples; NK cells looked exhausted (LAG3, PDCD1, HAVCR2).", source: "Fig 3" },
  trajectory: { text: "RNA velocity and latent time suggest a continuum from plasmablasts to developing neutrophils.", source: "Fig 4" },
  trajectoryGenes: { text: "Cells lose CD27, CD38, TNFRSF17 and gain granule genes in order: primary, secondary, tertiary. CEBPE is followed by CEBPD.", source: "Fig 4" },
  alternative: { text: "This is a hypothesis. Emergency granulopoiesis is offered as an alternative explanation.", source: "Main text" },
  limitations: { text: "Small n, blood only, variable sampling time, some patients received azithromycin or remdesivir, and granulocytes usually do not survive cryopreservation.", source: "Main text" },
} satisfies Record<string, PaperFact>;

export type PaperFactKey = keyof typeof PAPER_FACTS;
