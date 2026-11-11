"use client";

import { useMemo, useState } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { ElbowChart } from "@/components/charts/ElbowChart";
import { ScatterCanvas } from "@/components/charts/ScatterCanvas";
import { spotlight } from "@/components/charts/spotlight";
import { Button } from "@/components/ui/Button";
import { Controls } from "@/components/ui/Layout";
import { PaperNote } from "@/components/ui/PaperNote";
import { ReferenceDetails } from "@/components/ui/ReferenceDetails";
import { StatusChip } from "@/components/ui/StatusChip";
import { Term } from "@/components/ui/Term";
import { HowToReadButton, useWalkthrough, WalkthroughCaption } from "@/components/ui/Walkthrough";
import { TYPE_INDEX } from "@/content/cellTypes";
import { int } from "@/lib/format";
import { useThemeColors } from "@/hooks/useThemeColors";
import { getDataset, type Cell } from "@/lib/sim/cells";
import { PC_VARIANCE } from "@/lib/sim/pca";
import { umapPos } from "@/lib/sim/umap";
import { usePipeline, usePipelineDispatch } from "../PipelineProvider";
import { StepStory } from "./StepStory";
import { UMAP_AXES } from "./umapView";

export function UmapStep() {
  const { nPcs, umapRun } = usePipeline();
  const dispatch = usePipelineDispatch();
  const c = useThemeColors();
  const { cells } = getDataset();
  // Animate only runs made on this visit, not the restored state.
  const [runs, setRuns] = useState(0);

  const from = useMemo(() => cells.map((cell) => ({ x: cell.px * 1.1, y: cell.py * 1.1 })), [cells]);
  const points = useMemo(
    () =>
      cells.map((cell, i) => {
        const [x, y] = umapRun ? umapPos(cell, nPcs) : [from[i].x, from[i].y];
        return { x, y, color: c["--ink-2"], alpha: 0.45, r: 2.3 };
      }),
    [cells, from, nPcs, umapRun, c],
  );

  const run = () => {
    dispatch({ type: "runUmap" });
    setRuns((n) => n + 1);
  };

  const steps: { text: string; hit: (cell: Cell, i: number) => boolean; r?: number }[] = [
    {
      text: `Each dot is one cell that passed QC: ${int(cells.length)} here, from all 14 samples. The real study had 44,721.`,
      hit: (_, i) => i === 0,
      r: 6,
    },
    {
      text: "Close dots have similar gene activity. A tight group is an island, and often one cell type.",
      hit: (cell) => cell.type === TYPE_INDEX.cd14,
    },
    {
      text: "Read the islands, not the gaps. Distance between islands means little, and the axes have no units.",
      hit: (cell) => cell.type === TYPE_INDEX.cd14 || cell.type === TYPE_INDEX.nk,
    },
  ];
  const tour = useWalkthrough(steps);
  const focus = tour.current;

  return (
    <>
      <Controls>
        <Button onClick={run}>
          {umapRun ? "Re-run UMAP" : "Run UMAP"}
        </Button>
        {nPcs <= 6 && <StatusChip ok={false}>{nPcs} PCs: islands smear</StatusChip>}
      </Controls>
      {/* Same bars as the PCA step and the same state, so the PCA choice shows up already selected. */}
      <div>
        <p className="font-mono text-[13px] text-ink-2">
          <Term k="PCs used" />: 1:{nPcs} <span className="text-muted">· chosen in PCA, click a bar to try another</span>
        </p>
        <ElbowChart variance={PC_VARIANCE} selected={nPcs} onSelect={(n) => dispatch({ type: "setPcs", n })} height={120} />
      </div>
      <ChartFrame title={<><Term k="UMAP" /> · 1 dot = 1 cell</>} aside={umapRun ? <HowToReadButton tour={tour} /> : "still PCA (press Run)"}>
        <ScatterCanvas
          ariaLabel={umapRun ? "UMAP of all cells" : "Cells before UMAP, on PC1 and PC2"}
          points={focus ? spotlight(points, (i) => focus.hit(cells[i], i), { color: c["--accent"], r: focus.r }) : points}
          from={runs > 0 ? from : undefined}
          animateKey={runs > 0 ? runs : undefined}
          {...UMAP_AXES}
        />
      </ChartFrame>
      {umapRun && focus && <WalkthroughCaption tour={tour}>{focus.text}</WalkthroughCaption>}
      <StepStory step="umap" />
      <ReferenceDetails step="umap">
        <PaperNote tutorial="RunUMAP(dims = 1:10)." paper="RunUMAP(dims = 1:50)." facts={["pcs"]} />
      </ReferenceDetails>
    </>
  );
}
