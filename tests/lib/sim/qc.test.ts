import { describe, expect, it } from "vitest";
import { getDataset } from "@/lib/sim/cells";
import { LOOSE_QC, PAPER_QC, summarizeQc } from "@/lib/sim/qc";

const { qcCells } = getDataset();

describe("qc", () => {
  it("paper cutoffs remove every bad cell and keep every real one", () => {
    const s = summarizeQc(qcCells, PAPER_QC);
    expect(s.keptBad).toEqual({ broken: 0, rrna: 0, multiplet: 0, empty: 0 });
    expect(s.realLost).toBe(0);
    expect(s.kept).toBe(getDataset().cells.length);
  });

  it("each cut catches a different kind of bad cell", () => {
    const noMt = summarizeQc(qcCells, { ...PAPER_QC, maxMt: 100 });
    const noRrna = summarizeQc(qcCells, { ...PAPER_QC, maxRrna: 100 });
    const noComplexity = summarizeQc(qcCells, { ...PAPER_QC, complexity: false });
    expect(noMt.keptBad.broken).toBeGreaterThan(0);
    expect(noRrna.keptBad.rrna).toBeGreaterThan(0);
    expect(noComplexity.keptBad.multiplet).toBeGreaterThan(0);
  });

  it("too strict loses real cells; too loose keeps bad ones", () => {
    expect(summarizeQc(qcCells, { ...PAPER_QC, maxMt: 5 }).realLost).toBeGreaterThan(100);
    const loose = summarizeQc(qcCells, LOOSE_QC);
    expect(loose.removed).toBe(0);
  });
});
