import { describe, expect, it } from "vitest";
import { initialState, qcStage, reducer, type PipelineAction, type PipelineState } from "@/features/pipeline/reducer";
import { PAPER_QC } from "@/lib/sim/qc";

const run = (...actions: PipelineAction[]): PipelineState => actions.reduce(reducer, initialState);
const move: PipelineAction = { type: "setQc", patch: { maxMt: 30 } };
const filter: PipelineAction = { type: "filterQc" };
const paper: PipelineAction = { type: "usePaperQc" };

describe("QC guide", () => {
  it("walks through set, filter, paper, compare", () => {
    expect(qcStage(run())).toBe(1);
    expect(qcStage(run(move))).toBe(2);
    expect(qcStage(run(move, filter))).toBe(3);
    expect(qcStage(run(move, filter, paper))).toBe(4);
  });

  it("is done only once the paper's cutoffs have been seen", () => {
    expect(run(move, filter).done).not.toContain("qc");
    expect(run(move, filter, paper).done).toContain("qc");
  });

  it("keeps the user's cutoffs after switching to the paper's", () => {
    const s = run(move, filter, paper);
    expect(s.qc).toEqual(PAPER_QC);
    expect(s.qcTried?.maxMt).toBe(30);
  });

  it("does not save the paper's cutoffs as the user's", () => {
    expect(run(paper, filter).qcTried).toBeNull();
    expect(run(move, filter, paper, filter).qcTried?.maxMt).toBe(30);
  });

  it("lets the user skip ahead and come back", () => {
    expect(qcStage(run(paper))).toBe(1);
    expect(qcStage(run(paper, move))).toBe(2);
    expect(qcStage(run(paper, move, filter))).toBe(4);
  });

  it("updates the comparison when the user tries again", () => {
    const again: PipelineAction = { type: "setQc", patch: { maxMt: 10 } };
    expect(run(move, filter, paper, again, filter).qcTried?.maxMt).toBe(10);
  });
});
