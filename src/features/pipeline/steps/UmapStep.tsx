"use client";

import { useMemo, useState } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { ScatterCanvas } from "@/components/charts/ScatterCanvas";
import { spotlight } from "@/components/charts/spotlight";
import { Button } from "@/components/ui/Button";
import { Controls } from "@/components/ui/Layout";
import { PaperNote } from "@/components/ui/PaperNote";
import { Segmented } from "@/components/ui/Segmented";
import { StatusChip } from "@/components/ui/StatusChip";
import { Term } from "@/components/ui/Term";
import { HowToReadButton, useWalkthrough, WalkthroughCaption } from "@/components/ui/Walkthrough";
import { TYPE_INDEX } from "@/content/cellTypes";
import { int } from "@/lib/format";
import { useThemeColors } from "@/hooks/useThemeColors";
import { getDataset, type Cell } from "@/lib/sim/cells";
import { umapPos } from "@/lib/sim/umap";
import { usePipeline, usePipelineDispatch } from "../PipelineProvider";
import { StepStory } from "./StepStory";
import { UMAP_AXES } from "./umapView";

const DIMS = [5, 10, 20, 50].map((n) => ({ value: String(n), label: `1:${n}` }));

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
        <Segmented label="PCs used" showLabel options={DIMS} value={String(nPcs)} onChange={(v) => dispatch({ type: "setPcs", n: Number(v) })} />
        {nPcs <= 6 && <StatusChip ok={false}>{nPcs} PCs: islands smear</StatusChip>}
      </Controls>
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
      <PaperNote tutorial="RunUMAP(dims = 1:10)." paper="RunUMAP(dims = 1:50)." facts={["pcs"]} />
    </>
  );
}
