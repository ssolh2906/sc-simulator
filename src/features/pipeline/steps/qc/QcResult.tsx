"use client";

import { ChipRow } from "@/components/ui/Chip";
import { StatusChip } from "@/components/ui/StatusChip";
import { getDataset } from "@/lib/sim/cells";
import { int } from "@/lib/format";
import { summarizeQc } from "@/lib/sim/qc";
import { usePipeline, useStepDone } from "../../PipelineProvider";

/** Counts update live; the good/bad breakdown appears after "Filter cells". */
export function QcResult() {
  const { qc } = usePipeline();
  const done = useStepDone("qc");
  const s = summarizeQc(getDataset().qcCells, qc);
  // Name only what went wrong; an all-clear collapses to one chip.
  const issues = [
    s.keptBad.broken > 0 && `broken cells kept: ${s.keptBad.broken}`,
    s.keptBad.rrna > 0 && `rRNA-heavy kept: ${s.keptBad.rrna}`,
    s.keptBad.multiplet > 0 && `multiplets kept: ${s.keptBad.multiplet}`,
    s.keptBad.empty > 0 && `near-empty kept: ${s.keptBad.empty}`,
    s.realLost > 20 && `real cells lost: ${s.realLost}`,
  ].filter((issue) => issue !== false);
  return (
    <ChipRow>
      <span className="self-center font-mono text-sm tabular-nums">
        {int(s.total)} → {int(s.kept)} cells
      </span>
      {done && issues.map((issue) => <StatusChip key={issue} ok={false}>{issue}</StatusChip>)}
      {done && issues.length === 0 && <StatusChip ok>Bad cells removed, few real cells lost</StatusChip>}
    </ChipRow>
  );
}
