import type { ComponentType } from "react";
import type { StepSlug } from "./registry";
import { Placeholder } from "./steps/Placeholder";

/** Step bodies. The server page renders only the one it needs, so each route loads its own chunk. */
export const STEP_COMPONENTS: Record<StepSlug, ComponentType> = {
  question: Placeholder,
  qc: Placeholder,
  normalize: Placeholder,
  "variable-genes": Placeholder,
  pca: Placeholder,
  umap: Placeholder,
  clustering: Placeholder,
  "junk-clusters": Placeholder,
  annotation: Placeholder,
  composition: Placeholder,
  monocytes: Placeholder,
  trajectory: Placeholder,
  conclusion: Placeholder,
};
