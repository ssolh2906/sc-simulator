"use client";

import { Chip, ChipRow } from "@/components/ui/Chip";
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
  return (
    <ChipRow>
      <Chip>
        {int(s.total)} → {int(s.kept)} cells
      </Chip>
      {done && (
        <>
          <StatusChip ok={s.keptBad.broken === 0}>broken cells kept: {s.keptBad.broken}</StatusChip>
          <StatusChip ok={s.keptBad.rrna === 0}>rRNA-heavy kept: {s.keptBad.rrna}</StatusChip>
          <StatusChip ok={s.keptBad.multiplet === 0}>multiplets kept: {s.keptBad.multiplet}</StatusChip>
          <StatusChip ok={s.keptBad.empty === 0}>near-empty kept: {s.keptBad.empty}</StatusChip>
          <StatusChip ok={s.realLost <= 20}>real cells lost: {s.realLost}</StatusChip>
        </>
      )}
    </ChipRow>
  );
}
