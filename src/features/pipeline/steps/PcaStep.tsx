"use client";

import { useMemo } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { ElbowChart } from "@/components/charts/ElbowChart";
import { ScatterCanvas } from "@/components/charts/ScatterCanvas";
import { ChipRow } from "@/components/ui/Chip";
import { Grid2 } from "@/components/ui/Layout";
import { PaperNote } from "@/components/ui/PaperNote";
import { StatusChip } from "@/components/ui/StatusChip";
import { Term } from "@/components/ui/Term";
import { useThemeColors } from "@/hooks/useThemeColors";
import { getDataset } from "@/lib/sim/cells";
import { PC_VARIANCE } from "@/lib/sim/pca";
import { usePipeline, usePipelineDispatch } from "../PipelineProvider";
import { StepStory } from "./StepStory";

export function PcaStep() {
  const { nPcs } = usePipeline();
  const dispatch = usePipelineDispatch();
  const c = useThemeColors();
  const { cells } = getDataset();
  const points = useMemo(() => cells.map((cell) => ({ x: cell.px, y: cell.py, color: c["--ink-2"], alpha: 0.4, r: 2.2 })), [cells, c]);
  const kept = PC_VARIANCE.slice(0, nPcs).reduce((a, b) => a + b, 0);

  return (
    <>
      <Grid2>
        <ChartFrame title={<><Term k="elbow" /> plot · click a bar to keep PCs 1…n</>}>
          <ElbowChart variance={PC_VARIANCE} selected={nPcs} onSelect={(n) => dispatch({ type: "setPcs", n })} />
        </ChartFrame>
        <ChartFrame title="PC1 vs PC2" aside="cell types not known yet">
          <ScatterCanvas ariaLabel="Cells on PC1 and PC2" aspect={4 / 3} points={points} xDomain={[-7, 7]} yDomain={[-6.5, 6.5]} xLabel="PC_1" yLabel="PC_2" />
        </ChartFrame>
      </Grid2>
      <ChipRow>
        <StatusChip ok={nPcs > 6}>
          {nPcs} PCs keep {kept.toFixed(0)}% of variance{nPcs <= 6 && ": cell types will blur together"}
        </StatusChip>
      </ChipRow>
      <StepStory step="pca" />
      <PaperNote
        tutorial="About 10 PCs, picked at the elbow."
        paper="The first 50 PCs. With SCTransform, using more PCs is usually safe."
        facts={["pcs"]}
      />
    </>
  );
}
