"use client";

import { useMemo, useState } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { LineChart } from "@/components/charts/LineChart";
import { ScatterCanvas } from "@/components/charts/ScatterCanvas";
import { spotlight } from "@/components/charts/spotlight";
import { toTicks } from "@/components/charts/axes";
import { Button } from "@/components/ui/Button";
import { Legend } from "@/components/ui/Legend";
import { Controls, Grid2 } from "@/components/ui/Layout";
import { PaperNote } from "@/components/ui/PaperNote";
import { ReferenceDetails } from "@/components/ui/ReferenceDetails";
import { Slider } from "@/components/ui/Slider";
import { Term } from "@/components/ui/Term";
import { HowToReadButton, useWalkthrough, WalkthroughCaption } from "@/components/ui/Walkthrough";
import { TYPE_INDEX } from "@/content/cellTypes";
import { useThemeColors } from "@/hooks/useThemeColors";
import { mix } from "@/lib/color";
import { trajectoryCells, velocityGrid } from "@/lib/sim/trajectory";
import { usePipeline, usePipelineDispatch } from "../PipelineProvider";
import { StepStory } from "./StepStory";
import { WAVE_SERIES, waveSeries } from "./trajectory/waves";

const WINDOW = 0.07;

export function TrajectoryStep() {
  const { velocityRun } = usePipeline();
  const dispatch = usePipelineDispatch();
  const c = useThemeColors();
  const [t, setT] = useState(0.5);
  const [runs, setRuns] = useState(0);
  const cells = trajectoryCells();
  const arrows = useMemo(() => velocityGrid(cells).map((a) => ({ ...a, color: c["--ink-2"] })), [cells, c]);
  const series = useMemo(() => waveSeries(), []);

  const points = useMemo(
    () =>
      cells.map((cell) => {
        const near = velocityRun && Math.abs(cell.t - t) < WINDOW;
        const color = velocityRun ? mix(c["--seq0"], c["--seq1"], 0.35 + 0.65 * cell.t) : cell.type === TYPE_INDEX.pb ? c["--ct-pb"] : c["--ct-neut"];
        return {
          x: cell.ux,
          y: cell.uy,
          color,
          alpha: !velocityRun || near ? 0.95 : 0.4,
          r: near ? 4 : 3,
          tip: `${cell.type === TYPE_INDEX.pb ? "Plasmablast" : "Dev. Neutrophil"} · latent time ${cell.t.toFixed(2)}`,
        };
      }),
    [cells, velocityRun, t, c],
  );

  const steps: { text: string; dots: boolean; arrows: boolean; lines?: boolean }[] = [
    { text: `Each dot is one cell: only plasmablasts and dev. neutrophils, ${cells.length} cells, not the whole blood sample.`, dots: true, arrows: false },
    {
      text: "Arrows estimate where cells are heading, from the ratio of unspliced to spliced RNA. No cell was actually followed over time.",
      dots: false,
      arrows: true,
    },
    { text: "Color is latent time: an estimated order from early to late, not hours or days.", dots: true, arrows: false },
    {
      text: "Right chart: each line is a gene group. Plasmablast genes fade as granule genes switch on in order. The dashed line is your slider.",
      dots: false,
      arrows: false,
      lines: true,
    },
  ];
  const tour = useWalkthrough(steps);
  const focus = velocityRun ? tour.current : null;

  const run = () => {
    dispatch({ type: "runVelocity" });
    setRuns((n) => n + 1);
  };

  return (
    <>
      <div className="rounded-xl border border-warn/60 bg-surface-2 px-3 py-2.5 text-sm">
        This path is a <b>hypothesis</b> from <Term k="RNA velocity" />, not a proven lineage. Another explanation:{" "}
        <Term k="emergency granulopoiesis" />, where the marrow releases immature neutrophils that only look related.
      </div>
      <Controls>
        <Button onClick={run} hint="scv.tl.velocity()">
          {velocityRun ? "Re-run RNA velocity" : "Run RNA velocity"}
        </Button>
        {velocityRun && (
          <Slider label="latent time" min={0} max={1} step={0.01} value={t} onChange={setT} format={(v) => v.toFixed(2)} />
        )}
      </Controls>
      <Grid2>
        <ChartFrame title="Subset UMAP: plasmablasts → dev. neutrophils" aside={velocityRun ? <>color = latent time <HowToReadButton tour={tour} /></> : "color = cell type"}>
          <ScatterCanvas
            ariaLabel="Plasmablast and developing neutrophil cells with velocity arrows"
            aspect={4 / 5}
            points={focus ? spotlight(points, () => focus.dots) : points}
            arrows={velocityRun && (!focus || focus.arrows) ? arrows : undefined}
            arrowLen={0.5}
            animateKey={runs > 0 ? runs : undefined}
            xDomain={[4.2, 10.3]}
            yDomain={[-4.3, 3.3]}
            xLabel="UMAP_1"
            yLabel="UMAP_2"
            labels={[
              { x: 6.2, y: 2.7, text: "Plasmablast", size: 10 },
              { x: 6.0, y: -3.9, text: "Dev. Neutrophil", size: 10 },
            ]}
          />
          <Legend
            items={
              velocityRun
                ? [
                    { label: "early (t≈0)", color: "color-mix(in oklab, var(--seq1) 35%, var(--seq0))" },
                    { label: "late (t≈1)", color: "var(--seq1)" },
                  ]
                : [{ label: "Plasmablast", color: "var(--ct-pb)" }, { label: "Dev. Neutrophil", color: "var(--ct-neut)" }]
            }
          />
        </ChartFrame>
        <ChartFrame title={<>Gene waves along <Term k="latent time" /></>} aside="smoothed, 0–1 scale">
          {velocityRun ? (
            <>
              <LineChart
                ariaLabel="Gene group expression along latent time"
                series={series}
                xDomain={[0, 1]}
                yDomain={[0, 1.05]}
                xTicks={toTicks([0, 0.25, 0.5, 0.75, 1])}
                yTicks={toTicks([0, 0.5, 1])}
                xLabel="latent time"
                yLabel="relative expression"
                marker={t}
                faded={Boolean(focus) && !focus?.lines}
                height={300}
              />
              <Legend items={WAVE_SERIES.map((s) => ({ label: s.name, color: s.color, shape: "line" }))} />
            </>
          ) : (
            <p className="grid h-[300px] place-items-center rounded-[10px] bg-surface-2 text-sm text-muted">Run RNA velocity to order cells in time.</p>
          )}
        </ChartFrame>
      </Grid2>
      {focus && <WalkthroughCaption tour={tour}>{focus.text}</WalkthroughCaption>}
      <StepStory step="trajectory" />
      <ReferenceDetails step="trajectory">
        <PaperNote
          tutorial="Not part of a standard tutorial."
          paper="RNA velocity + latent time (scVelo), presented as a hypothesis with an alternative explanation."
          facts={["trajectory", "trajectoryGenes", "alternative", "devNeutPosition"]}
        />
      </ReferenceDetails>
    </>
  );
}
