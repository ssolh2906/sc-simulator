"use client";

import { useMemo } from "react";
import { Bars } from "@/components/charts/Bars";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { ScatterCanvas } from "@/components/charts/ScatterCanvas";
import { niceTicks, toTicks } from "@/components/charts/axes";
import { spotlight } from "@/components/charts/spotlight";
import { Controls, Grid2 } from "@/components/ui/Layout";
import { PaperNote } from "@/components/ui/PaperNote";
import { Segmented } from "@/components/ui/Segmented";
import { StatusChip } from "@/components/ui/StatusChip";
import { Term } from "@/components/ui/Term";
import { HowToReadButton, useWalkthrough, WalkthroughCaption } from "@/components/ui/Walkthrough";
import { useThemeColors } from "@/hooks/useThemeColors";
import { int, kilo } from "@/lib/format";
import { depthLeakPoints, depthTrend, TOY_CELLS, toyValues, type NormMethod } from "@/lib/sim/normalize";
import { usePipeline, usePipelineDispatch } from "../PipelineProvider";
import { StepStory } from "./StepStory";

const METHODS: { value: NormMethod; label: string }[] = [
  { value: "raw", label: "Raw counts" },
  { value: "log", label: "LogNormalize" },
  { value: "sct", label: "SCTransform" },
];

const Y_LABEL: Record<NormMethod, string> = {
  raw: "mean UMI count",
  log: "mean log1p(x / total × 10⁴)",
  sct: "mean Pearson residual",
};

const CAPTION: Record<NormMethod, string> = {
  raw: "Raw counts: deeper cells look higher for every gene.",
  log: "LogNormalize: better, but deeper cells still look a bit higher.",
  sct: "SCTransform residuals: the depth trend is gone.",
};

const TOY_COLORS = ["var(--ct-b)", "var(--ct-cd4t)", "var(--ct-pdc)"];

export function NormalizeStep() {
  const { norm } = usePipeline();
  const dispatch = usePipelineDispatch();
  const c = useThemeColors();
  const { points, yDomain, xRange, fit } = useMemo(() => {
    const pts = depthLeakPoints();
    const ys = pts.map((p) => p[norm]);
    const lo = Math.min(...ys);
    const hi = Math.max(...ys);
    const pad = (hi - lo) * 0.08;
    const xs = pts.map((p) => Math.log10(p.depth));
    return {
      points: pts.map((p) => ({
        x: Math.log10(p.depth),
        y: p[norm],
        color: c["--ct-cd4t"],
        alpha: 0.55,
        r: 2.4,
        tip: `${int(p.depth)} UMIs · value ${p[norm].toFixed(2)}`,
      })),
      yDomain: [lo - pad, hi + pad] as [number, number],
      xRange: [Math.min(...xs), Math.max(...xs)] as [number, number],
      fit: depthTrend(pts, norm),
    };
  }, [norm, c]);

  const midX = (xRange[0] + xRange[1]) / 2;
  const midY = (yDomain[0] + yDomain[1]) / 2;
  const steps: { text: string; hit: (p: { x: number; y: number }, i: number) => boolean; r?: number }[] = [
    {
      text: "Each dot is one CD4 T cell. Using one cell type keeps the biology alike, so a trend here is technical.",
      hit: (_, i) => i === 0,
      r: 6,
    },
    { text: "Further right means that cell was sequenced deeper: more UMIs in total.", hit: (p) => p.x > midX },
    { text: "Higher means a larger average value across 40 low-count genes, out of ~20k.", hit: (p) => p.y > midY },
    {
      text: "The red line is the trend. Sloped: deeper cells look higher for technical reasons. Flat: that effect is gone. Try all three methods.",
      hit: () => false,
    },
  ];
  const tour = useWalkthrough(steps);
  const focus = tour.current;

  const toy = toyValues(norm);
  const toyMax = norm === "log" ? 5 : 25;

  return (
    <>
      <Controls>
        <Segmented label="Normalization" options={METHODS} value={norm} onChange={(m) => dispatch({ type: "setNorm", method: m })} />
        <StatusChip ok={Math.abs(fit.r) < 0.1}>depth trend r = {fit.r.toFixed(2)}</StatusChip>
      </Controls>
      <Grid2>
        <ChartFrame title="3 cells, same biology, different depth" aside={norm === "sct" ? "CD3E · corrected counts" : `CD3E · ${norm === "raw" ? "UMIs" : "log value"}`}>
          <Bars
            ariaLabel="CD3E value for three toy cells"
            bars={TOY_CELLS.map((cell, i) => ({
              label: `${cell.name}\n${int(cell.depth)} UMIs`,
              value: toy[i].gene,
              color: TOY_COLORS[i],
              text: norm === "log" ? toy[i].gene.toFixed(2) : String(Math.round(toy[i].gene)),
            }))}
            yMax={toyMax}
            yTicks={norm === "log" ? [0, 2, 4] : [0, 10, 20]}
            height={210}
          />
        </ChartFrame>
        <ChartFrame title={<>Depth leak: CD4 T cells, 40 low-count genes</>} aside={<HowToReadButton tour={tour} />}>
          <ScatterCanvas
            ariaLabel="Average gene value against sequencing depth"
            aspect={4 / 3}
            points={focus ? spotlight(points, (i) => focus.hit(points[i], i), { r: focus.r }) : points}
            xDomain={[xRange[0] - 0.05, xRange[1] + 0.05]}
            yDomain={yDomain}
            xTicks={toTicks([1000, 2000, 5000, 10000].map(Math.log10), (v) => kilo(10 ** v))}
            yTicks={toTicks(niceTicks(yDomain[0], yDomain[1], 4), (v) => String(+v.toFixed(2)))}
            xLabel="library size (UMIs, log scale)"
            yLabel={Y_LABEL[norm]}
            segments={[
              {
                x1: xRange[0],
                y1: fit.intercept + fit.slope * xRange[0],
                x2: xRange[1],
                y2: fit.intercept + fit.slope * xRange[1],
                color: c["--ards"],
                width: 2.5,
              },
            ]}
          />
        </ChartFrame>
      </Grid2>
      {focus && <WalkthroughCaption tour={tour}>{focus.text}</WalkthroughCaption>}
      <p className="text-sm text-ink-2">
        {CAPTION[norm]} Red line = trend. <Term k="SCTransform" /> keeps <Term k="Pearson residual">Pearson residuals</Term>{" "}
        and can also <Term k="regress out" /> quality variables.
      </p>
      <StepStory step="normalize" />
      <PaperNote
        tutorial="LogNormalize (scale to 10,000, then log1p)."
        paper="SCTransform, regressing out genes/cell, UMIs/cell, %mt and %rRNA."
        facts={["sct"]}
      />
    </>
  );
}
