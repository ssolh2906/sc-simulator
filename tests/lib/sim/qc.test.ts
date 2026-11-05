import { describe, expect, it } from "vitest";
import { getDataset } from "@/lib/sim/cells";
import { LOOSE_QC, PAPER_QC, passesQc, qcFeedback, summarizeQc } from "@/lib/sim/qc";

const { qcCells } = getDataset();

describe("qc feedback", () => {
  it("calls the paper's cutoffs a good balance and points at nothing", () => {
    expect(qcFeedback(qcCells, PAPER_QC)).toMatchObject({ verdict: "Good balance", control: null });
  });

  it("calls wide-open cutoffs too loose", () => {
    expect(qcFeedback(qcCells, LOOSE_QC).verdict).toBe("Too loose");
  });

  it("points a loose result at the cut for its biggest kind of bad cell", () => {
    const broken = qcFeedback(qcCells, { ...PAPER_QC, maxMt: 60 });
    expect(broken).toMatchObject({ verdict: "Too loose", control: "maxMt" });
    expect(broken.hint).toContain("broken cells");
    expect(broken.hint).toContain("lowering");
    const multiplets = qcFeedback(qcCells, { ...PAPER_QC, complexity: false, maxCount: 40000 });
    expect(multiplets).toMatchObject({ verdict: "Too loose", control: "complexity" });
    expect(multiplets.hint).toContain("turning on");
  });

  it("points a strict result at the cut that loses the most real cells", () => {
    const f = qcFeedback(qcCells, { ...PAPER_QC, maxCount: 6000 });
    expect(f).toMatchObject({ verdict: "Too strict", control: "maxCount" });
    expect(f.hint).toContain("raising");
  });

  it("reports both problems at once, with one place to start", () => {
    const f = qcFeedback(qcCells, { ...PAPER_QC, maxMt: 60, maxCount: 6000 });
    expect(f.verdict).toBe("Loose and strict");
    expect(f.control).toBe("maxCount");
  });

  it("never gives away a cutoff value", () => {
    const f = qcFeedback(qcCells, { ...PAPER_QC, maxMt: 60 });
    expect(f.hint).not.toMatch(/\b20\b/);
  });
});

describe("qc", () => {
  it("paper cutoffs are good but not perfect", () => {
    const s = summarizeQc(qcCells, PAPER_QC);
    const badKept = Object.values(s.keptBad).reduce((a, b) => a + b, 0);
    const badTotal = qcCells.filter((c) => c.kind !== "real" && c.kind !== "junk").length;
    expect(s.keptBad.broken).toBeGreaterThan(0);
    expect(s.keptBad.rrna).toBeGreaterThan(0);
    expect(s.keptBad.multiplet).toBeGreaterThan(0);
    expect(s.keptBad.empty).toBeGreaterThan(0);
    expect(badKept / badTotal).toBeLessThan(0.15);
    expect(s.realLost).toBeGreaterThan(0);
    expect(s.realLost).toBeLessThan(20);
  });

  it("the paper's cutoffs keep exactly the cells later steps use", () => {
    const { cells } = getDataset();
    const kept = qcCells.filter((c) => passesQc(c, PAPER_QC)).map((c) => c.id);
    expect(kept).toEqual(cells.map((c) => c.id).sort((a, b) => a - b));
  });

  it("moving a cutoff trades bad cells kept against real cells lost", () => {
    const paper = summarizeQc(qcCells, PAPER_QC);
    const strict = summarizeQc(qcCells, { ...PAPER_QC, maxMt: 10 });
    const loose = summarizeQc(qcCells, { ...PAPER_QC, maxMt: 25 });
    expect(strict.keptBad.broken).toBeLessThan(paper.keptBad.broken);
    expect(strict.realLost).toBeGreaterThan(paper.realLost);
    expect(loose.keptBad.broken).toBeGreaterThan(paper.keptBad.broken);
    expect(loose.realLost).toBeLessThan(paper.realLost);
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
