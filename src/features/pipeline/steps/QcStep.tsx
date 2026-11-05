"use client";

import { useMemo } from "react";
import { ScatterCanvas, type GuideLine, type Pt } from "@/components/charts/ScatterCanvas";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { toTicks } from "@/components/charts/axes";
import { Button } from "@/components/ui/Button";
import { Controls, Grid2, Note } from "@/components/ui/Layout";
import { Legend } from "@/components/ui/Legend";
import { PaperNote } from "@/components/ui/PaperNote";
import { Term } from "@/components/ui/Term";
import { useThemeColors } from "@/hooks/useThemeColors";
import { getDataset, type QcCell } from "@/lib/sim/cells";
import { kilo } from "@/lib/format";
import { MAX_GENES_PER_UMI, PAPER_QC, passesQc } from "@/lib/sim/qc";
import { usePipeline, usePipelineDispatch, useStepDone } from "../PipelineProvider";
import { QcControls } from "./qc/QcControls";
import { QcResult } from "./qc/QcResult";
import { StepStory } from "./StepStory";

const KIND_LABEL: Record<QcCell["kind"], string> = {
  real: "cell",
  junk: "cell",
  broken: "broken cell",
  rrna: "rRNA-heavy cell",
  multiplet: "multiplet",
  empty: "near-empty droplet",
};

const X_DOMAIN: [number, number] = [Math.log10(150), Math.log10(45000)];
const X_TICKS = toTicks([200, 500, 1000, 2000, 5000, 10000, 20000, 40000].map(Math.log10), (v) => kilo(10 ** v));

export function QcStep() {
  const { qc } = usePipeline();
  const dispatch = usePipelineDispatch();
  const done = useStepDone("qc");
  const c = useThemeColors();
  const { qcCells } = getDataset();

  const [mtPts, gpuPts] = useMemo(() => {
    const mt: Pt[] = [];
    const gpu: Pt[] = [];
    for (const cell of qcCells) {
      const keep = passesQc(cell, qc);
      const style = { color: keep ? c["--accent"] : c["--muted"], alpha: keep ? 0.7 : 0.4, r: 2.3 };
      const label = done ? `${KIND_LABEL[cell.kind]} · ` : "";
      const tip = `${label}${Math.round(cell.nCount)} UMIs · mt ${cell.pctMt.toFixed(1)}% · rRNA ${cell.pctRrna.toFixed(1)}% · ${cell.genesPerUmi.toFixed(2)} genes/UMI`;
      const x = Math.log10(cell.nCount);
      mt.push({ x, y: cell.pctMt, tip, ...style });
      gpu.push({ x, y: cell.genesPerUmi, tip, ...style });
    }
    return [mt, gpu];
  }, [qcCells, qc, c, done]);

  const umiLines: GuideLine[] = [
    { x: Math.log10(qc.minCount), color: c["--ards"], label: "min" },
    { x: Math.log10(qc.maxCount), color: c["--ards"], label: "max" },
  ];

  return (
    <>
      <QcControls />
      <Controls>
        <Button onClick={() => dispatch({ type: "complete", step: "qc" })}>Filter cells</Button>
        <Button variant="ghost" onClick={() => dispatch({ type: "setQc", patch: PAPER_QC })}>
          Use paper cutoffs
        </Button>
      </Controls>
      <Grid2>
        <ChartFrame title={<>nCount vs <Term k="percent.mt" /></>} aside="1 dot = 1 cell">
          <ScatterCanvas
            ariaLabel="Scatter of UMI count against percent mitochondrial reads"
            aspect={4 / 3}
            points={mtPts}
            xDomain={X_DOMAIN}
            yDomain={[0, 62]}
            xTicks={X_TICKS}
            yTicks={toTicks([0, 20, 40, 60])}
            xLabel="nCount_RNA (UMIs, log scale)"
            yLabel="percent.mt"
            lines={[...umiLines, { y: qc.maxMt, color: c["--ards"], label: "mt cut" }]}
          />
        </ChartFrame>
        <ChartFrame title={<>nCount vs <Term k="genes per UMI" /></>} aside={qc.complexity ? "complexity filter on" : "complexity filter off"}>
          <ScatterCanvas
            ariaLabel="Scatter of UMI count against genes per UMI"
            aspect={4 / 3}
            points={gpuPts}
            xDomain={X_DOMAIN}
            yDomain={[0.25, 1]}
            xTicks={X_TICKS}
            yTicks={toTicks([0.25, 0.5, 0.75, 1])}
            xLabel="nCount_RNA (UMIs, log scale)"
            yLabel="genes per UMI"
            lines={[...umiLines, ...(qc.complexity ? [{ y: MAX_GENES_PER_UMI, color: c["--ards"], label: "0.75" }] : [])]}
          />
        </ChartFrame>
      </Grid2>
      <Legend items={[{ label: "keep", color: "var(--accent)" }, { label: "remove", color: "var(--muted)" }]} />
      <QcResult />
      <Note>Later steps use the paper&apos;s cutoffs, so everyone continues with the same cells.</Note>
      <StepStory step="qc" />
      <PaperNote
        tutorial="nFeature and %mt cutoffs from the Seurat tutorial (e.g. 200–2,500 genes, mt < 5%)."
        paper="UMIs 1,000–15,000, mt < 20%, rRNA < 20%, genes/UMI ≤ 0.75."
        facts={["qcUmi", "qcMt", "qcMultiplet", "qcGenes"]}
      />
    </>
  );
}
