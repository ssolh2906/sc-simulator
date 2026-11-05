import type { Resolution } from "@/lib/sim/clusters";
import type { NormMethod } from "@/lib/sim/normalize";
import { LOOSE_QC, type QcParams } from "@/lib/sim/qc";
import type { StepSlug } from "./registry";

/** User choices only. Everything shown is derived from these by lib/sim. */
export type PipelineState = {
  done: StepSlug[];
  loaded: boolean;
  qc: QcParams;
  norm: NormMethod;
  nHvg: number;
  nPcs: number;
  umapRun: boolean;
  /** null until the user picks one; later steps fall back to the default. */
  resolution: Resolution | null;
  flagged: number[];
  junkRemoved: boolean;
  answers: Record<number, string>;
  singleR: boolean;
  velocityRun: boolean;
};

export const initialState: PipelineState = {
  done: [],
  loaded: false,
  qc: LOOSE_QC,
  norm: "raw",
  nHvg: 3000,
  nPcs: 50,
  umapRun: false,
  resolution: null,
  flagged: [],
  junkRemoved: false,
  answers: {},
  singleR: false,
  velocityRun: false,
};

export type PipelineAction =
  | { type: "complete"; step: StepSlug }
  | { type: "load" }
  | { type: "setQc"; patch: Partial<QcParams> }
  | { type: "setNorm"; method: NormMethod }
  | { type: "setHvg"; n: number }
  | { type: "setPcs"; n: number }
  | { type: "runUmap" }
  | { type: "setResolution"; res: Resolution }
  | { type: "toggleFlag"; cluster: number }
  | { type: "setFlags"; clusters: number[] }
  | { type: "removeJunk" }
  | { type: "answer"; cluster: number; label: string }
  | { type: "setAnswers"; answers: Record<number, string> }
  | { type: "runSingleR" }
  | { type: "runVelocity" };

const complete = (s: PipelineState, step: StepSlug): PipelineState =>
  s.done.includes(step) ? s : { ...s, done: [...s.done, step] };

export function reducer(s: PipelineState, a: PipelineAction): PipelineState {
  switch (a.type) {
    case "complete":
      return complete(s, a.step);
    case "load":
      return complete({ ...s, loaded: true }, "question");
    case "setQc":
      return { ...s, qc: { ...s.qc, ...a.patch } };
    case "setNorm":
      return a.method === "sct" ? complete({ ...s, norm: a.method }, "normalize") : { ...s, norm: a.method };
    case "setHvg":
      return { ...s, nHvg: a.n };
    case "setPcs":
      return complete({ ...s, nPcs: a.n }, "pca");
    case "runUmap":
      return complete({ ...s, umapRun: true }, "umap");
    case "setResolution":
      return complete({ ...s, resolution: a.res }, "clustering");
    case "toggleFlag":
      return {
        ...s,
        flagged: s.flagged.includes(a.cluster) ? s.flagged.filter((c) => c !== a.cluster) : [...s.flagged, a.cluster],
      };
    case "setFlags":
      return { ...s, flagged: a.clusters };
    case "removeJunk":
      return complete({ ...s, junkRemoved: true }, "junk-clusters");
    case "answer":
      return { ...s, answers: { ...s.answers, [a.cluster]: a.label } };
    case "setAnswers":
      return { ...s, answers: a.answers };
    case "runSingleR":
      return complete({ ...s, singleR: true }, "annotation");
    case "runVelocity":
      return complete({ ...s, velocityRun: true }, "trajectory");
  }
}
