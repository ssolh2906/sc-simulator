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
