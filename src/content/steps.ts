import type { StepSlug } from "@/features/pipeline/registry";

export type StoryCopy = { do: string; see: string; next: string; locked: string };

/** DO / SEE / NEXT copy. Each line stays under ~20 words. */
export const STORY: Record<StepSlug, StoryCopy> = {
  question: {
    do: "Blood cells were read one by one. Every RNA molecule counted → a count matrix.",
    see: "Most entries are 0 (sparse). Some droplets hold broken or doubled cells. Clean first.",
    next: "Remove bad cells → QC",
    locked: "Load the count matrix to see what it looks like.",
  },
  qc: {
    do: "Count UMIs, %mito and %rRNA for every cell. Cut cells outside the lines.",
    see: "Top = broken cells (high mito). High genes-per-UMI = likely multiplets. Too strict = real cells lost.",
    next: "Remove sequencing-depth effects → SCTransform",
    locked: "Move the sliders, then press Filter cells.",
  },
  normalize: {
    do: "Some cells were sequenced deeper. Remove that technical difference before comparing genes.",
    see: "LogNormalize still leaks depth into values. SCTransform flattens it.",
    next: "Keep the informative genes → Variable genes",
    locked: "Try all three methods. Finish on SCTransform.",
  },
  "variable-genes": {
    do: "Rank genes by how much they vary between cells, beyond what noise explains.",
    see: "ACTB, GAPDH: same in every cell, no info. CD14, NKG7, LTF: change with cell type.",
    next: "Compress these genes into a few axes → PCA",
    locked: "Press Find variable genes.",
  },
  pca: {
    do: "Summarize the variable genes as principal components (PCs). Pick how many to keep.",
    see: "Bars flatten after ~10 PCs. PC1 vs PC2 alone cannot separate cell types.",
    next: "Turn the PCs into a 2D map → UMAP",
    locked: "Click a bar to choose how many PCs to keep.",
  },
  umap: {
    do: "Place similar cells close together on a 2D map, using the chosen PCs.",
    see: "Islands appear = candidate cell groups. Too few PCs smear them. Gaps between islands mean little.",
    next: "Give each island a number → Clustering",
    locked: "Press Run UMAP.",
  },
  clustering: {
    do: "Link each cell to its nearest neighbors, then find tightly linked groups (Louvain).",
    see: "Low resolution merges different cells. High splits one type. Default: about one island, one cluster.",
    next: "Check that every cluster is real → Junk clusters",
    locked: "Pick a resolution.",
  },
  "junk-clusters": {
    do: "Read each cluster's top genes. Flag clusters made mostly of MT- and RP- genes.",
    see: "Two clusters are damaged cells that slipped past QC. Remove them before naming cells.",
    next: "Name the remaining clusters → Annotation",
    locked: "Flag the suspicious clusters, then press Check.",
  },
  annotation: {
    do: "Match each cluster to a cell type using its marker genes. Then confirm with SingleR.",
    see: "CD3E → T · NKG7 → NK · MS4A1 → B · JCHAIN → Plasmablast · CD14 → Mono · LTF → Dev. Neutrophil.",
    next: "Compare cell-type amounts between groups → Composition",
    locked: "Label every cluster, then run SingleR to confirm.",
  },
  composition: {
    do: "For each sample, compute the % of each cell type. Compare groups, one point per sample.",
    see: "Dev. Neutrophils and plasmablasts rise, mostly in ARDS. NK, CD16 Mono, pDC drop.",
    next: "Look inside one cell type → Monocyte DE",
    locked: "Compare a few cell types, and try the pooled view.",
  },
  monocytes: {
    do: "Compare each COVID sample's CD14 monocytes with all healthy CD14 monocytes.",
    see: "HLA class II down in every patient. ISGs up in some, not all. Cytokines stay near zero.",
    next: "Follow plasmablasts toward neutrophils → Trajectory",
    locked: "Open all three tabs.",
  },
  trajectory: {
    do: "Estimate where each cell is heading (RNA velocity). Order cells by latent time.",
    see: "Plasmablast genes fade. Granule genes switch on in order: primary → secondary → tertiary.",
    next: "Put it all together → Conclusion",
    locked: "Press Run RNA velocity.",
  },
  conclusion: {
    do: "Recap the pipeline and the main findings.",
    see: "Cell types shifted, monocytes changed state, and a possible new path appeared.",
    next: "Revisit any step, or start over.",
    locked: "",
  },
};
