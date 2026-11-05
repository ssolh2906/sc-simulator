export type StepSlug =
  | "question"
  | "qc"
  | "normalize"
  | "variable-genes"
  | "pca"
  | "umap"
  | "clustering"
  | "junk-clusters"
  | "annotation"
  | "composition"
  | "monocytes"
  | "trajectory"
  | "conclusion";

export type StepMeta = {
  slug: StepSlug;
  title: string;
  subtitle: string;
  /** Short label for the step rail. */
  rail: string;
  badge?: "hypothesis";
};

/** Ordered pipeline. Every route and the rail are generated from this list. */
export const STEPS: StepMeta[] = [
  { slug: "question", title: "Question & Data", subtitle: "What changes in severe COVID-19 blood?", rail: "Question" },
  { slug: "qc", title: "Quality Control", subtitle: "Remove broken cells and multiplets", rail: "QC" },
  { slug: "normalize", title: "SCTransform", subtitle: "Remove sequencing-depth effects", rail: "Normalize" },
  { slug: "variable-genes", title: "Variable Genes", subtitle: "Keep genes that differ between cells", rail: "Variable genes" },
  { slug: "pca", title: "PCA", subtitle: "Compress thousands of genes", rail: "PCA" },
  { slug: "umap", title: "UMAP", subtitle: "Draw a 2D map of cells", rail: "UMAP" },
  { slug: "clustering", title: "Clustering", subtitle: "Group similar cells", rail: "Clustering" },
  { slug: "junk-clusters", title: "Remove Junk Clusters", subtitle: "Check the clusters too", rail: "Junk clusters" },
  { slug: "annotation", title: "Annotation", subtitle: "Name each cluster", rail: "Annotation" },
  { slug: "composition", title: "Composition", subtitle: "Which cells rise or fall?", rail: "Composition" },
  { slug: "monocytes", title: "Monocyte DE", subtitle: "What changed inside monocytes?", rail: "Monocytes" },
  { slug: "trajectory", title: "Plasmablast → Dev. Neutrophil", subtitle: "A possible path between two cell types", rail: "Trajectory", badge: "hypothesis" },
  { slug: "conclusion", title: "Conclusion", subtitle: "What we found", rail: "Conclusion" },
];

export const LAST_STEP = STEPS.length - 1;

export const stepIndex = (slug: StepSlug) => STEPS.findIndex((s) => s.slug === slug);

export const stepBySlug = (slug: string): StepMeta | undefined => STEPS.find((s) => s.slug === slug);

export const stepHref = (slug: StepSlug) => `/step/${slug}/`;
