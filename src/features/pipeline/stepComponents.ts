import type { ComponentType } from "react";
import type { StepSlug } from "./registry";
import { ClusteringStep } from "./steps/ClusteringStep";
import { NormalizeStep } from "./steps/NormalizeStep";
import { PcaStep } from "./steps/PcaStep";
import { QcStep } from "./steps/QcStep";
import { QuestionStep } from "./steps/QuestionStep";
import { UmapStep } from "./steps/UmapStep";
import { VariableGenesStep } from "./steps/VariableGenesStep";

const Soon = () => null;

/** Step bodies. The server page renders only the one it needs, so each route loads its own chunk. */
export const STEP_COMPONENTS: Record<StepSlug, ComponentType> = {
  question: QuestionStep,
  qc: QcStep,
  normalize: NormalizeStep,
  "variable-genes": VariableGenesStep,
  pca: PcaStep,
  umap: UmapStep,
  clustering: ClusteringStep,
  "junk-clusters": Soon,
  annotation: Soon,
  composition: Soon,
  monocytes: Soon,
  trajectory: Soon,
  conclusion: Soon,
};
