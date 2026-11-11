"use client";

import { useMemo } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { ScatterCanvas } from "@/components/charts/ScatterCanvas";
import { toTicks } from "@/components/charts/axes";
import { spotlight } from "@/components/charts/spotlight";
import { Button } from "@/components/ui/Button";
import { Legend } from "@/components/ui/Legend";
import { Controls } from "@/components/ui/Layout";
import { PaperNote } from "@/components/ui/PaperNote";
import { ReferenceDetails } from "@/components/ui/ReferenceDetails";
import { Slider } from "@/components/ui/Slider";
import { Term } from "@/components/ui/Term";
import { HowToReadButton, useWalkthrough, WalkthroughCaption } from "@/components/ui/Walkthrough";
import { useThemeColors } from "@/hooks/useThemeColors";
import { int } from "@/lib/format";
import { dotsSelected, hvgGenes, TOTAL_GENES, type HvgGene } from "@/lib/sim/hvg";
import { usePipeline, usePipelineDispatch, useStepDone } from "../PipelineProvider";
import { StepStory } from "./StepStory";

export function VariableGenesStep() {
  const { nHvg } = usePipeline();
  const dispatch = usePipelineDispatch();
  const done = useStepDone("variable-genes");
  const c = useThemeColors();
  const genes = hvgGenes();
  const nSel = dotsSelected(nHvg);

  const { points, labels } = useMemo(() => {
    const points = genes.map((g, i) => {
      const on = done && i < nSel;
      return {
        x: g.mean,
        y: g.variance,
        r: g.labeled ? 3.6 : 2.6,
        color: on ? c["--accent"] : g.housekeeping && done ? c["--ards"] : c["--muted"],
        alpha: on ? 0.9 : 0.45,
        tip: `${g.name} · residual variance ${g.variance.toFixed(1)}`,
      };
    });
    const labels = done
      ? genes.filter((g, i) => g.labeled && (i < nSel || g.housekeeping)).map((g) => ({ x: g.mean, y: g.variance + 0.55, text: g.name, size: 10 }))
      : [];
    return { points, labels };
  }, [genes, nSel, done, c]);

  const cut = genes[Math.max(0, nSel - 1)].variance - 0.05;

  const unlabeled = genes.findIndex((g) => !g.labeled);
  const steps: { text: string; hit: (g: HvgGene, i: number) => boolean; color?: string; r?: number; named?: boolean; cut?: boolean }[] = [
    {
      text: `The chart has ${genes.length} dots for ~${int(TOTAL_GENES)} genes, so most dots stand for about ${TOTAL_GENES / genes.length | 0} genes.`,
      hit: (_, i) => i === unlabeled,
      color: c["--ink"],
      r: 6,
    },
    { text: "Further right means more RNA on average. Higher means it varies between cells more than noise alone explains.", hit: () => true },
    {
      text: "Low and to the right: GAPDH, ACTB and others. Plenty of RNA, but the same in every cell, so they cannot tell cell types apart.",
      hit: (g) => g.housekeeping,
      color: c["--ards"],
      r: 4.5,
      named: true,
    },
    {
      text: "High up: LYZ, NKG7, CD3E and others. On in some cell types, off in others. These genes tell cells apart.",
      hit: (g) => g.labeled && !g.housekeeping,
      color: c["--accent"],
      r: 4.5,
      named: true,
    },
    { text: `Dots above the line are kept: your top ${int(nHvg)} genes. Move the slider to change it.`, hit: (_, i) => i < nSel, color: c["--accent"], cut: true },
  ];
  const tour = useWalkthrough(steps);
  const focus = tour.current;
  const shownPoints = focus ? spotlight(points, (i) => focus.hit(genes[i], i), { color: focus.color, r: focus.r }) : points;
  const shownLabels = focus
    ? focus.named
      ? genes.filter((g, i) => focus.hit(g, i)).map((g) => ({ x: g.mean, y: g.variance + 0.55, text: g.name, size: 10 }))
      : []
    : labels;

  return (
    <>
      <Controls>
        <Slider label="top" min={500} max={5000} step={500} value={nHvg} onChange={(n) => dispatch({ type: "setHvg", n })} format={(v) => `${int(v)} genes`} />
        <Button onClick={() => dispatch({ type: "complete", step: "variable-genes" })}>Find variable genes</Button>
      </Controls>
      <ChartFrame title={<>Mean vs residual variance · <Term k="variable genes" /></>} aside={<>{`1 dot ≈ ${TOTAL_GENES / genes.length | 0} genes`} <HowToReadButton tour={tour} /></>}>
        <ScatterCanvas
          ariaLabel="Gene mean against residual variance"
          aspect={16 / 8}
          points={shownPoints}
          labels={shownLabels}
          xDomain={[-1.8, 2.2]}
          yDomain={[0, 10.4]}
          xTicks={toTicks([-1, 0, 1, 2])}
          yTicks={toTicks([0, 2, 4, 6, 8, 10])}
          xLabel="mean expression (log10)"
          yLabel="residual variance"
          lines={done || focus?.cut ? [{ y: cut, color: c["--accent"], label: `top ${int(nHvg)}` }] : []}
        />
      </ChartFrame>
      {focus && <WalkthroughCaption tour={tour}>{focus.text}</WalkthroughCaption>}
      <Legend
        items={[
          { label: "variable gene (kept)", color: "var(--accent)" },
          { label: "housekeeping", color: "var(--ards)" },
          { label: "other genes", color: "var(--muted)" },
        ]}
      />
      <StepStory step="variable-genes" />
      <ReferenceDetails step="variable-genes">
        <PaperNote
          tutorial="FindVariableFeatures: top 2,000 genes."
          paper="SCTransform's own variable genes (3,000 by default)."
          facts={["sct"]}
        />
      </ReferenceDetails>
    </>
  );
}
