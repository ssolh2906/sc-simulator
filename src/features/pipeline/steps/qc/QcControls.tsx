"use client";

import { Slider } from "@/components/ui/Slider";
import { Controls } from "@/components/ui/Layout";
import { Term } from "@/components/ui/Term";
import { getDataset } from "@/lib/sim/cells";
import { kilo } from "@/lib/format";
import { PAPER_QC, qcFeedback, sameQc, type QcControl } from "@/lib/sim/qc";
import { usePipeline, usePipelineDispatch } from "../../PipelineProvider";

export function QcControls() {
  const { qc, qcTried } = usePipeline();
  const dispatch = usePipelineDispatch();
  const set = (patch: Partial<typeof qc>) => dispatch({ type: "setQc", patch });
  // Once on the paper's cutoffs, the exercise has moved on, so stop pointing at a control.
  const hinted = qcTried && !sameQc(qc, PAPER_QC) ? qcFeedback(getDataset().qcCells, qcTried).control : null;
  const mark = (control: QcControl) => (hinted === control ? "rounded-md outline-2 outline-offset-4 outline-accent" : undefined);
  return (
    <Controls>
      <div className={mark("minCount")}>
        <Slider label="nCount >" term="min nCount" min={200} max={3000} step={50} value={qc.minCount} onChange={(v) => set({ minCount: v })} format={kilo} />
      </div>
      <div className={mark("maxCount")}>
        <Slider label="nCount <" term="max nCount" min={5000} max={40000} step={500} value={qc.maxCount} onChange={(v) => set({ maxCount: v })} format={kilo} />
      </div>
      <div className={mark("maxMt")}>
        <Slider label="%mt <" term="max %mt" min={5} max={60} value={qc.maxMt} onChange={(v) => set({ maxMt: v })} format={(v) => `${v}%`} />
      </div>
      <div className={mark("maxRrna")}>
        <Slider label="%rRNA <" term="max %rRNA" min={5} max={50} value={qc.maxRrna} onChange={(v) => set({ maxRrna: v })} format={(v) => `${v}%`} />
      </div>
      {/* The term sits outside the label, so opening it does not toggle the filter. */}
      <div className={`flex items-center gap-2 font-mono text-[13px] text-ink-2 ${mark("complexity") ?? ""}`}>
        <input
          type="checkbox"
          aria-label="genes per UMI filter"
          checked={qc.complexity}
          onChange={(e) => set({ complexity: e.target.checked })}
          className="size-4 cursor-pointer accent-accent"
        />
        <span>
          <Term k="genes per UMI">genes/UMI</Term> ≤ 0.75
        </span>
      </div>
    </Controls>
  );
}
