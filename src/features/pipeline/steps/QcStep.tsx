"use client";

import { useMemo } from "react";
import { ScatterCanvas, type GuideLine, type Pt } from "@/components/charts/ScatterCanvas";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { toTicks } from "@/components/charts/axes";
import { spotlight } from "@/components/charts/spotlight";
import { Button } from "@/components/ui/Button";
import { Controls, Grid2, Note } from "@/components/ui/Layout";
import { Legend } from "@/components/ui/Legend";
import { NextAction } from "@/components/ui/NextAction";
import { PaperNote } from "@/components/ui/PaperNote";
import { ReferenceDetails } from "@/components/ui/ReferenceDetails";
import { Term } from "@/components/ui/Term";
import { HowToReadButton, useWalkthrough, WalkthroughCaption } from "@/components/ui/Walkthrough";
import { useThemeColors } from "@/hooks/useThemeColors";
import { getDataset, type QcCell } from "@/lib/sim/cells";
import { int, kilo } from "@/lib/format";
import { MAX_GENES_PER_UMI, PAPER_QC, passesQc } from "@/lib/sim/qc";
import { usePipeline, usePipelineDispatch } from "../PipelineProvider";
import { qcStage } from "../reducer";
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

const GUIDE = {
  1: "Drag the sliders to set your own cutoffs. Tap a name to see what it does.",
  2: "Press Filter cells to see what your cutoffs did.",
  3: "Now see what the real study did: press Use paper cutoffs.",
  4: "Compare the two rows below. Which bad cells did you keep, and how many real cells did you lose?",
};

export function QcStep() {
  const state = usePipeline();
  const { qc, qcTried } = state;
  const dispatch = usePipelineDispatch();
  const stage = qcStage(state);
  // Cell kinds are the answer to the exercise, so tooltips name them only after a first try.
  const reveal = qcTried !== null || state.done.includes("qc");
  const c = useThemeColors();
  const { qcCells } = getDataset();

  const [mtPts, gpuPts] = useMemo(() => {
    const mt: Pt[] = [];
    const gpu: Pt[] = [];
    for (const cell of qcCells) {
      const keep = passesQc(cell, qc);
      const style = { color: keep ? c["--accent"] : c["--muted"], alpha: keep ? 0.7 : 0.4, r: 2.3 };
      const label = reveal ? `${KIND_LABEL[cell.kind]} · ` : "";
      const tip = `${label}${Math.round(cell.nCount)} UMIs · mt ${cell.pctMt.toFixed(1)}% · rRNA ${cell.pctRrna.toFixed(1)}% · ${cell.genesPerUmi.toFixed(2)} genes/UMI`;
      const x = Math.log10(cell.nCount);
      mt.push({ x, y: cell.pctMt, tip, ...style });
      gpu.push({ x, y: cell.genesPerUmi, tip, ...style });
    }
    return [mt, gpu];
  }, [qcCells, qc, c, reveal]);

  const umiLines: GuideLine[] = [
    { x: Math.log10(qc.minCount), color: c["--ards"], label: "min" },
    { x: Math.log10(qc.maxCount), color: c["--ards"], label: "max" },
  ];

  const firstKept = qcCells.findIndex((cell) => passesQc(cell, qc));
  // The sliders start wide open, so regions use the paper's cutoffs or nothing would light up.
  const steps: { text: string; hit: (cell: QcCell, i: number) => boolean; r?: number }[] = [
    {
      text: `Each dot is one droplet, which usually holds one cell. These charts show all ${int(qcCells.length)} droplets from the 14 samples.`,
      hit: (_, i) => i === firstKept,
      r: 6,
    },
    {
      text: `Up high (the paper cuts above ${PAPER_QC.maxMt}% mito): likely broken cells. Their RNA leaks out, but mitochondrial RNA stays inside.`,
      hit: (cell) => cell.pctMt > PAPER_QC.maxMt,
    },
    {
      text: `Far left (the paper cuts below ${int(PAPER_QC.minCount)} UMIs): near-empty droplets with almost no RNA.`,
      hit: (cell) => cell.nCount < PAPER_QC.minCount,
    },
    {
      text: `Far right (the paper cuts above ${int(PAPER_QC.maxCount)} UMIs): too much RNA for one cell, so likely 2 or more cells in one droplet (a multiplet).`,
      hit: (cell) => cell.nCount > PAPER_QC.maxCount,
    },
    {
      text: `Right chart, above ${MAX_GENES_PER_UMI}: too many different genes for the RNA counted. These are also likely multiplets.`,
      hit: (cell) => cell.genesPerUmi > MAX_GENES_PER_UMI,
    },
    {
      text: "Teal dots pass your current cuts, including %rRNA, which has a slider but no chart here. Cut too strictly, and real cells go too.",
      hit: (cell) => passesQc(cell, qc),
    },
  ];
  const tour = useWalkthrough(steps);
  const focus = tour.current;
  const lit = (pts: Pt[]) => (focus ? spotlight(pts, (i) => focus.hit(qcCells[i], i), { r: focus.r }) : pts);

  return (
    <>
      <NextAction step={stage < 4 ? stage : undefined} total={3}>
        {GUIDE[stage]}
      </NextAction>
      <div className={stage === 1 ? "rounded-md outline-2 outline-offset-4 outline-accent" : undefined}>
        <QcControls />
      </div>
      <Controls>
        <Button variant={stage === 2 ? "primary" : "ghost"} onClick={() => dispatch({ type: "filterQc" })}>
          Filter cells
        </Button>
        <Button variant={stage === 3 ? "primary" : "ghost"} onClick={() => dispatch({ type: "usePaperQc" })}>
          Use paper cutoffs
        </Button>
      </Controls>
      {/* Next to the buttons: below the charts, a click's result would land off screen. */}
      <QcResult />
      <Grid2>
        <ChartFrame title={<>nCount vs <Term k="percent.mt" /></>} aside={<>1 dot = 1 cell <HowToReadButton tour={tour} /></>}>
          <ScatterCanvas
            ariaLabel="Scatter of UMI count against percent mitochondrial reads"
            aspect={4 / 3}
            points={lit(mtPts)}
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
            points={lit(gpuPts)}
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
      {focus && <WalkthroughCaption tour={tour}>{focus.text}</WalkthroughCaption>}
      <Legend items={[{ label: "keep", color: "var(--accent)" }, { label: "remove", color: "var(--muted)" }]} />
      <Note>Later steps use the paper&apos;s cutoffs, so everyone continues with the same cells.</Note>
      <StepStory step="qc" />
      <ReferenceDetails step="qc">
        <PaperNote
          tutorial="nFeature and %mt cutoffs from the Seurat tutorial (e.g. 200–2,500 genes, mt < 5%)."
          paper="UMIs 1,000–15,000, mt < 20%, rRNA < 20%, genes/UMI ≤ 0.75."
          facts={["qcUmi", "qcMt", "qcMultiplet", "qcGenes"]}
        />
      </ReferenceDetails>
    </>
  );
}
