import type { StepSlug } from "@/features/pipeline/registry";

/** The conclusion step is itself the recap, so it has no story cards. */
export type StorySlug = Exclude<StepSlug, "conclusion">;

/** `done` is an optional extra line for the task box once the step is done. */
export type StoryCopy = { do: string; see: string; locked: string; done?: string };

/** DO / SEE copy. Each line stays under ~20 words. */
export const STORY: Record<StorySlug, StoryCopy> = {
  question: {
    do: "Blood cells were read one by one. Every RNA molecule counted → a count matrix.",
    see: "Most entries are 0 (sparse). Some droplets hold broken or doubled cells. Clean first.",
    locked: "Load the count matrix to see what it looks like.",
  },
  qc: {
    do: "Count UMIs, %mito and %rRNA for every cell. Cut cells outside the lines.",
    see: "Top = broken cells. High genes-per-UMI = likely multiplets. No cutoff is perfect: even the paper's makes a few mistakes.",
    locked: "Finish the three steps at the top.",
  },
  normalize: {
    do: "Some cells were sequenced deeper. Remove that technical difference before comparing genes.",
    see: "LogNormalize still leaks depth into values. SCTransform flattens it.",
    locked: "Try all three methods. Finish on SCTransform.",
  },
  "variable-genes": {
    do: "Rank genes by how much they vary between cells, beyond what noise explains.",
    see: "ACTB, GAPDH: same in every cell, no info. CD14, NKG7, LTF: change with cell type.",
    locked: "Press Find variable genes.",
  },
  pca: {
    do: "Summarize the variable genes as principal components (PCs). Pick how many to keep.",
    see: "Bars flatten after ~10 PCs. PC1 vs PC2 alone cannot separate cell types.",
    locked: "Click a bar to choose how many PCs to keep.",
  },
  umap: {
    do: "Place similar cells close together on a 2D map, using the chosen PCs.",
    see: "Islands appear = candidate cell groups. Too few PCs smear them. Gaps between islands mean little.",
    locked: "Press Run UMAP.",
    done: "In real analyses, people try several PC counts and keep the one whose map looks stable.",
  },
  clustering: {
    do: "Link each cell to its nearest neighbors, then find tightly linked groups (Louvain).",
    see: "Low resolution merges different cells. High splits one type. Default: about one island, one cluster.",
    locked: "Pick a resolution.",
  },
  "junk-clusters": {
    do: "Read each cluster's top genes. Flag clusters made mostly of MT- and RP- genes.",
    see: "Two clusters are damaged cells that slipped past QC. Remove them before naming cells.",
    locked: "Flag the suspicious clusters, check, then press Remove flagged.",
  },
  annotation: {
    do: "Find each cluster's marker genes and compare them with known PBMC cell types. Clusters that fit nothing stay unknown.",
    see: "CD3E → T · NKG7 → NK · MS4A1 → B · JCHAIN → Plasmablast · CD14 → Mono · LTF → Dev. Neutrophil.",
    locked: "Press Find markers, then run SingleR to confirm.",
  },
  composition: {
    do: "For each sample, compute the % of each cell type. Compare groups, one point per sample.",
    see: "Dev. Neutrophils and plasmablasts rise, mostly in ARDS. NK, CD16 Mono, pDC drop.",
    locked: "Compare a few cell types, and try the pooled view.",
  },
  monocytes: {
    do: "Compare each COVID sample's CD14 monocytes with all healthy CD14 monocytes.",
    see: "HLA class II down in every patient. ISGs up in some, not all. Cytokines stay near zero.",
    locked: "Open all three tabs.",
  },
  trajectory: {
    do: "Estimate where each cell is heading (RNA velocity). Order cells by latent time.",
    see: "Plasmablast genes fade. Granule genes switch on in order: primary → secondary → tertiary.",
    locked: "Press Run RNA velocity.",
  },
};
