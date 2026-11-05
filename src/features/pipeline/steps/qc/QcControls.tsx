"use client";

import { Slider } from "@/components/ui/Slider";
import { Controls } from "@/components/ui/Layout";
import { kilo } from "@/lib/format";
import { usePipeline, usePipelineDispatch } from "../../PipelineProvider";

export function QcControls() {
  const { qc } = usePipeline();
  const dispatch = usePipelineDispatch();
  const set = (patch: Partial<typeof qc>) => dispatch({ type: "setQc", patch });
  return (
    <Controls>
      <Slider label="nCount >" min={200} max={3000} step={50} value={qc.minCount} onChange={(v) => set({ minCount: v })} format={kilo} />
      <Slider label="nCount <" min={5000} max={40000} step={500} value={qc.maxCount} onChange={(v) => set({ maxCount: v })} format={kilo} />
      <Slider label="%mt <" min={5} max={60} value={qc.maxMt} onChange={(v) => set({ maxMt: v })} format={(v) => `${v}%`} />
      <Slider label="%rRNA <" min={5} max={50} value={qc.maxRrna} onChange={(v) => set({ maxRrna: v })} format={(v) => `${v}%`} />
      <label className="flex cursor-pointer items-center gap-2 font-mono text-[13px] text-ink-2">
        <input
          type="checkbox"
          checked={qc.complexity}
          onChange={(e) => set({ complexity: e.target.checked })}
          className="size-4 accent-accent"
        />
        genes/UMI ≤ 0.75
      </label>
    </Controls>
  );
}
