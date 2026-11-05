import type { ComponentType } from "react";
import type { StepSlug } from "./registry";
import { AnnotationStep } from "./steps/AnnotationStep";
import { ClusteringStep } from "./steps/ClusteringStep";
import { CompositionStep } from "./steps/CompositionStep";
import { ConclusionStep } from "./steps/ConclusionStep";
import { JunkClustersStep } from "./steps/JunkClustersStep";
import { MonocyteStep } from "./steps/MonocyteStep";
import { NormalizeStep } from "./steps/NormalizeStep";
import { PcaStep } from "./steps/PcaStep";
import { QcStep } from "./steps/QcStep";
import { QuestionStep } from "./steps/QuestionStep";
import { TrajectoryStep } from "./steps/TrajectoryStep";
import { UmapStep } from "./steps/UmapStep";
import { VariableGenesStep } from "./steps/VariableGenesStep";

/** Step bodies. The server page renders only the one it needs, so each route loads its own chunk. */
export const STEP_COMPONENTS: Record<StepSlug, ComponentType> = {
  question: QuestionStep,
  qc: QcStep,
  normalize: NormalizeStep,
  "variable-genes": VariableGenesStep,
  pca: PcaStep,
  umap: UmapStep,
  clustering: ClusteringStep,
  "junk-clusters": JunkClustersStep,
  annotation: AnnotationStep,
  composition: CompositionStep,
  monocytes: MonocyteStep,
  trajectory: TrajectoryStep,
  conclusion: ConclusionStep,
};
