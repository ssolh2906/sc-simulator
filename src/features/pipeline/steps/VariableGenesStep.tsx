"use client";

import { useMemo } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { ScatterCanvas } from "@/components/charts/ScatterCanvas";
import { toTicks } from "@/components/charts/axes";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Legend } from "@/components/ui/Legend";
import { Controls } from "@/components/ui/Layout";
import { PaperNote } from "@/components/ui/PaperNote";
import { Slider } from "@/components/ui/Slider";
import { Term } from "@/components/ui/Term";
import { useThemeColors } from "@/hooks/useThemeColors";
import { int } from "@/lib/format";
import { dotsSelected, hvgGenes, TOTAL_GENES } from "@/lib/sim/hvg";
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

  return (
    <>
      <Controls>
        <Slider label="top" min={500} max={5000} step={500} value={nHvg} onChange={(n) => dispatch({ type: "setHvg", n })} format={(v) => `${int(v)} genes`} />
        <Button onClick={() => dispatch({ type: "complete", step: "variable-genes" })}>Find variable genes</Button>
      </Controls>
      <ChartFrame title={<>Mean vs residual variance · <Term k="variable genes" /></>} aside={<Badge kind="simplified">1 dot ≈ {TOTAL_GENES / genes.length | 0} genes</Badge>}>
        <ScatterCanvas
          ariaLabel="Gene mean against residual variance"
          aspect={16 / 8}
          points={points}
          labels={labels}
          xDomain={[-1.8, 2.2]}
          yDomain={[0, 10.4]}
          xTicks={toTicks([-1, 0, 1, 2])}
          yTicks={toTicks([0, 2, 4, 6, 8, 10])}
          xLabel="mean expression (log10)"
          yLabel="residual variance"
          lines={done ? [{ y: cut, color: c["--accent"], label: `top ${int(nHvg)}` }] : []}
        />
      </ChartFrame>
      <Legend
        items={[
          { label: "variable gene (kept)", color: "var(--accent)" },
          { label: "housekeeping", color: "var(--ards)" },
          { label: "other genes", color: "var(--muted)" },
        ]}
      />
      <StepStory step="variable-genes" />
      <PaperNote
        tutorial="FindVariableFeatures: top 2,000 genes."
        paper="SCTransform's own variable genes (3,000 by default)."
        facts={["sct"]}
      />
    </>
  );
}
