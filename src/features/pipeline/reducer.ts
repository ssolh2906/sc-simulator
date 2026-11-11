import type { Resolution } from "@/lib/sim/clusters";
import type { NormMethod } from "@/lib/sim/normalize";
import { LOOSE_QC, PAPER_QC, sameQc, type QcParams } from "@/lib/sim/qc";
import type { StepSlug } from "./registry";

/** User choices only. Everything shown is derived from these by lib/sim. */
export type PipelineState = {
  done: StepSlug[];
  loaded: boolean;
  qc: QcParams;
  /** The user's own cutoffs at their last "Filter cells", kept to compare with the paper's. */
  qcTried: QcParams | null;
  qcPaperSeen: boolean;
  norm: NormMethod;
  nHvg: number;
  nPcs: number;
  umapRun: boolean;
  /** null until the user picks one; later steps fall back to the default. */
  resolution: Resolution | null;
  flagged: number[];
  junkRemoved: boolean;
  /** FindAllMarkers run and clusters matched to the PBMC reference. */
  markersFound: boolean;
  /** The cluster no reference type fit, named from SingleR's hint plus maturity markers. */
  unknownNamed: boolean;
  singleR: boolean;
  velocityRun: boolean;
};

export const initialState: PipelineState = {
  done: [],
  loaded: false,
  qc: LOOSE_QC,
  qcTried: null,
  qcPaperSeen: false,
  norm: "raw",
  nHvg: 3000,
  nPcs: 50,
  umapRun: false,
  resolution: null,
  flagged: [],
  junkRemoved: false,
  markersFound: false,
  unknownNamed: false,
  singleR: false,
  velocityRun: false,
};

export type PipelineAction =
  | { type: "complete"; step: StepSlug }
  | { type: "load" }
  | { type: "setQc"; patch: Partial<QcParams> }
  | { type: "filterQc" }
  | { type: "usePaperQc" }
  | { type: "setNorm"; method: NormMethod }
  | { type: "setHvg"; n: number }
  | { type: "setPcs"; n: number }
  | { type: "runUmap" }
  | { type: "setResolution"; res: Resolution }
  | { type: "toggleFlag"; cluster: number }
  | { type: "setFlags"; clusters: number[] }
  | { type: "removeJunk" }
  | { type: "findMarkers" }
  | { type: "nameUnknown" }
  | { type: "runSingleR" }
  | { type: "runVelocity" };

/** Where the QC guide stands: 1 set cutoffs, 2 filter, 3 see the paper's, 4 compare. */
export function qcStage(s: PipelineState): 1 | 2 | 3 | 4 {
  if (s.qcTried) return s.qcPaperSeen ? 4 : 3;
  return sameQc(s.qc, LOOSE_QC) || sameQc(s.qc, PAPER_QC) ? 1 : 2;
}

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
    case "filterQc":
      // Filtering with the paper's values must not overwrite "your cutoffs" in the comparison.
      return sameQc(s.qc, PAPER_QC) ? s : { ...s, qcTried: s.qc };
    case "usePaperQc":
      return complete({ ...s, qc: PAPER_QC, qcPaperSeen: true }, "qc");
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
    case "findMarkers":
      return { ...s, markersFound: true };
    case "nameUnknown":
      return complete({ ...s, unknownNamed: true }, "annotation");
    case "runSingleR":
      // Not the end of the step any more: the unknown cluster still needs a name.
      return { ...s, singleR: true };
    case "runVelocity":
      return complete({ ...s, velocityRun: true }, "trajectory");
  }
}
