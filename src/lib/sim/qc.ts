import type { QcCell, QcKind } from "./cells";

export type QcParams = {
  minCount: number;
  maxCount: number;
  maxMt: number;
  maxRrna: number;
  /** Remove cells with more than 0.75 genes per UMI (likely multiplets). */
  complexity: boolean;
};

export const MAX_GENES_PER_UMI = 0.75;

/** Methods: < 1,000 or > 15,000 UMIs, > 20% mt, > 20% rRNA, > 0.75 genes/UMI. */
export const PAPER_QC: QcParams = {
  minCount: 1000,
  maxCount: 15000,
  maxMt: 20,
  maxRrna: 20,
  complexity: true,
};

/** Starting point: almost no filter, so the user sees what each cut does. */
export const LOOSE_QC: QcParams = {
  minCount: 200,
  maxCount: 40000,
  maxMt: 60,
  maxRrna: 50,
  complexity: false,
};

export const sameQc = (a: QcParams, b: QcParams) =>
  a.minCount === b.minCount &&
  a.maxCount === b.maxCount &&
  a.maxMt === b.maxMt &&
  a.maxRrna === b.maxRrna &&
  a.complexity === b.complexity;

export function passesQc(c: QcCell, p: QcParams): boolean {
  return (
    c.nCount >= p.minCount &&
    c.nCount <= p.maxCount &&
    c.pctMt < p.maxMt &&
    c.pctRrna < p.maxRrna &&
    (!p.complexity || c.genesPerUmi <= MAX_GENES_PER_UMI)
  );
}

export type QcSummary = {
  total: number;
  kept: number;
  removed: number;
  /** Bad cells that slipped through, by kind. */
  keptBad: Record<Exclude<QcKind, "real" | "junk">, number>;
  /** Good cells that were cut. */
  realLost: number;
};

/** Above these, a result counts as too loose or too strict. The paper's cutoffs sit below both. */
export const MAX_BAD_KEPT = 50;
export const MAX_REAL_LOST = 30;

export type QcControl = "minCount" | "maxCount" | "maxMt" | "maxRrna" | "complexity";
type BadKind = keyof QcSummary["keptBad"];
type Move = { control: QcControl; verb: string };

const CONTROL_NAME: Record<QcControl, string> = {
  minCount: "nCount >",
  maxCount: "nCount <",
  maxMt: "%mt",
  maxRrna: "%rRNA",
  complexity: "genes/UMI",
};

const BAD_NAME: Record<BadKind, string> = {
  broken: "broken cells",
  rrna: "rRNA-heavy droplets",
  multiplet: "multiplets",
  empty: "near-empty droplets",
};

const FIX_BAD: Record<BadKind, (p: QcParams) => Move> = {
  broken: () => ({ control: "maxMt", verb: "lowering" }),
  rrna: () => ({ control: "maxRrna", verb: "lowering" }),
  multiplet: (p) => (p.complexity ? { control: "maxCount", verb: "lowering" } : { control: "complexity", verb: "turning on" }),
  empty: () => ({ control: "minCount", verb: "raising" }),
};

const FIX_LOST: Record<QcControl, string> = {
  minCount: "lowering",
  maxCount: "raising",
  maxMt: "raising",
  maxRrna: "raising",
  complexity: "turning off",
};

const failsCut: Record<QcControl, (c: QcCell, p: QcParams) => boolean> = {
  minCount: (c, p) => c.nCount < p.minCount,
  maxCount: (c, p) => c.nCount > p.maxCount,
  maxMt: (c, p) => c.pctMt >= p.maxMt,
  maxRrna: (c, p) => c.pctRrna >= p.maxRrna,
  complexity: (c, p) => p.complexity && c.genesPerUmi > MAX_GENES_PER_UMI,
};

export type QcFeedback = {
  verdict: "Good balance" | "Too loose" | "Too strict" | "Loose and strict";
  hint: string;
  /** The control the hint is about. */
  control: QcControl | null;
};

/** One verdict and one hint, about the biggest problem only. It names a direction, never a value. */
export function qcFeedback(cells: QcCell[], p: QcParams): QcFeedback {
  const s = summarizeQc(cells, p);
  const [worstKind, worstKept] = (Object.entries(s.keptBad) as [BadKind, number][]).reduce((a, b) => (b[1] > a[1] ? b : a));
  const badMove = FIX_BAD[worstKind](p);

  const real = cells.filter((c) => c.kind === "real");
  const [worstCut, worstLost] = (Object.keys(failsCut) as QcControl[])
    .map((k): [QcControl, number] => [k, real.filter((c) => failsCut[k](c, p)).length])
    .reduce((a, b) => (b[1] > a[1] ? b : a));

  const loose = Object.values(s.keptBad).reduce((a, b) => a + b, 0) > MAX_BAD_KEPT;
  const strict = s.realLost > MAX_REAL_LOST;

  if (loose && strict) {
    const move = worstKept >= worstLost ? badMove : { control: worstCut, verb: FIX_LOST[worstCut] };
    return {
      verdict: "Loose and strict",
      hint: `Each cut has its own job. Start with ${CONTROL_NAME[move.control]}: try ${move.verb} it.`,
      control: move.control,
    };
  }
  if (loose) {
    return {
      verdict: "Too loose",
      hint: `${worstKept} ${BAD_NAME[worstKind]} got through. Try ${badMove.verb} ${CONTROL_NAME[badMove.control]}.`,
      control: badMove.control,
    };
  }
  if (strict) {
    return {
      verdict: "Too strict",
      hint: `You lost ${s.realLost} real cells, ${worstLost} of them to ${CONTROL_NAME[worstCut]}. Try ${FIX_LOST[worstCut]} it.`,
      control: worstCut,
    };
  }
  return { verdict: "Good balance", hint: "Close to what the study chose. See how yours compares.", control: null };
}

export function summarizeQc(cells: QcCell[], p: QcParams): QcSummary {
  const keptBad = { broken: 0, rrna: 0, multiplet: 0, empty: 0 };
  let kept = 0;
  let realLost = 0;
  for (const c of cells) {
    const pass = passesQc(c, p);
    if (pass) kept++;
    if (c.kind === "real" || c.kind === "junk") {
      if (!pass && c.kind === "real") realLost++;
    } else if (pass) {
      keptBad[c.kind]++;
    }
  }
  return { total: cells.length, kept, removed: cells.length - kept, keptBad, realLost };
}
