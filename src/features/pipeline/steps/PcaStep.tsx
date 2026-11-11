"use client";

import { useMemo } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { ElbowChart } from "@/components/charts/ElbowChart";
import { ScatterCanvas } from "@/components/charts/ScatterCanvas";
import { ChipRow } from "@/components/ui/Chip";
import { Grid2 } from "@/components/ui/Layout";
import { PaperNote } from "@/components/ui/PaperNote";
import { ReferenceDetails } from "@/components/ui/ReferenceDetails";
import { StatusChip } from "@/components/ui/StatusChip";
import { Term } from "@/components/ui/Term";
import { HowToReadButton, useWalkthrough, WalkthroughCaption } from "@/components/ui/Walkthrough";
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

  const steps: { text: string; bars: (i: number) => boolean }[] = [
    { text: "Each bar is one principal component (PC): a new axis that sums up many genes changing together.", bars: () => true },
    { text: `Bar height is the share of all variation that PC captures. PC1 captures ${PC_VARIANCE[0]}%.`, bars: (i) => i === 0 },
    { text: "After the elbow near PC10, bars stay flat. Later PCs add little each, and more of it is noise.", bars: (i) => i >= 9 },
    { text: `Teal bars are kept: ${nPcs} PCs, ${kept.toFixed(0)}% of the variation. Click a bar to change it.`, bars: (i) => i < nPcs },
  ];
  const tour = useWalkthrough(steps);
  const focus = tour.current;

  return (
    <>
      <Grid2>
        <ChartFrame title={<><Term k="elbow" /> plot · click a bar to keep PCs 1…n</>} aside={<HowToReadButton tour={tour} />}>
          <ElbowChart variance={PC_VARIANCE} selected={nPcs} onSelect={(n) => dispatch({ type: "setPcs", n })} focus={focus?.bars} />
        </ChartFrame>
        <ChartFrame title="PC1 vs PC2" aside="cell types not known yet">
          <ScatterCanvas ariaLabel="Cells on PC1 and PC2" aspect={4 / 3} points={points} xDomain={[-7, 7]} yDomain={[-6.5, 6.5]} xLabel="PC_1" yLabel="PC_2" />
        </ChartFrame>
      </Grid2>
      {focus && <WalkthroughCaption tour={tour}>{focus.text}</WalkthroughCaption>}
      <ChipRow>
        <StatusChip ok={nPcs > 6}>
          {nPcs} PCs keep {kept.toFixed(0)}% of variance{nPcs <= 6 && ": cell types will blur together"}
        </StatusChip>
      </ChipRow>
      <StepStory step="pca" />
      <ReferenceDetails step="pca">
        <PaperNote
          tutorial="About 10 PCs, picked at the elbow."
          paper="The first 50 PCs. With SCTransform, using more PCs is usually safe."
          facts={["pcs"]}
        />
      </ReferenceDetails>
    </>
  );
}
