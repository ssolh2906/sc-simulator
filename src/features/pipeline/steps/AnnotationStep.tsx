"use client";

import { useMemo, useState } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { DotPlot } from "@/components/charts/DotPlot";
import { HBars } from "@/components/charts/HBars";
import { ScatterCanvas } from "@/components/charts/ScatterCanvas";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Grid2, Note } from "@/components/ui/Layout";
import { PaperNote } from "@/components/ui/PaperNote";
import { Term } from "@/components/ui/Term";
import { CELL_TYPES } from "@/content/cellTypes";
import { useThemeColors } from "@/hooks/useThemeColors";
import { pct } from "@/lib/format";
import { ANNOTATION_MARKERS, answerKey, clusterDotPlot, singleRAgreement } from "@/lib/sim/annotation";
import { cellsOfCluster, cleanCells, getClusters } from "@/lib/sim/clusters";
import { centroid } from "@/lib/sim/umap";
import { usePipeline, usePipelineDispatch } from "../PipelineProvider";
import { MatchQuiz } from "./annotation/MatchQuiz";
import { featurePoints } from "./featurePlot";
import { StepStory } from "./StepStory";
import { UMAP_AXES } from "./umapView";

export function AnnotationStep() {
  const { answers, singleR, nPcs } = usePipeline();
  const dispatch = usePipelineDispatch();
  const c = useThemeColors();
  const [gene, setGene] = useState("CD3E");
  const cl = getClusters("default");
  const clusters = cl.info.filter((i) => !i.junk);
  const ids = clusters.map((i) => i.id);
  const key = answerKey();
  const allRight = ids.every((id) => answers[id] === key[id]);
  const dots = new Map(clusterDotPlot(ANNOTATION_MARKERS, ids).map((d) => [`${d.gene}|${d.cluster}`, d]));
  const named = singleR || allRight;

  const points = useMemo(() => featurePoints(cleanCells(), gene, c, nPcs), [gene, c, nPcs]);
  // Cluster IDs until named, so the quiz can be matched to islands.
  const labels = clusters.map((info) => {
    const [x, y] = centroid(cellsOfCluster(cl, info.id), nPcs);
    return named ? { x, y: y + 1.5, text: CELL_TYPES[info.main].name, size: 10 } : { x, y, text: String(info.id), size: 11 };
  });

  return (
    <>
      <Grid2>
        <ChartFrame title={<><Term k="dot plot" /> · click a gene →</>} aside="11 clusters (junk removed)">
          <DotPlot
            ariaLabel="Marker gene dot plot per cluster"
            genes={ANNOTATION_MARKERS}
            cols={clusters.map((i) => ({ id: i.id, label: named ? CELL_TYPES[i.main].short : String(i.id) }))}
            value={(g, id) => dots.get(`${g}|${id}`)!}
            maxAvg={3}
            selected={gene}
            onSelect={setGene}
          />
          <Note>Dot size = % of cells expressing. Darker = higher average.</Note>
        </ChartFrame>
        <ChartFrame title={<><Term k="feature plot" /> · {gene}</>} aside="dark = expressed">
          <ScatterCanvas ariaLabel={`UMAP colored by ${gene} expression`} aspect={1} points={points} labels={labels} {...UMAP_AXES} />
        </ChartFrame>
      </Grid2>
      <MatchQuiz ids={ids} answers={answers} answerKey={key} onAnswer={(cluster, label) => dispatch({ type: "answer", cluster, label })} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <Button onClick={() => dispatch({ type: "runSingleR" })} disabled={!allRight || singleR} hint="SingleR()">
          {singleR ? "SingleR done" : "Run SingleR"}
        </Button>
        <Button variant="ghost" onClick={() => dispatch({ type: "setAnswers", answers: key })} disabled={allRight}>
          Show answers
        </Button>
        {!allRight && <span className="text-[13px] text-muted">Label every cluster correctly to unlock SingleR.</span>}
      </div>
      {singleR && <SingleRPanel />}
      <StepStory step="annotation" />
      <PaperNote
        tutorial="Known marker genes only."
        paper="FindMarkers (Wilcoxon) + known markers, confirmed with SingleR."
        facts={["annotation", "nkMarkers", "gdMarkers", "devNeutGenes"]}
      />
    </>
  );
}

function SingleRPanel() {
  const rows = singleRAgreement();
  return (
    <ChartFrame
      title={<><Term k="SingleR" /> agreement with your labels</>}
      aside={<Badge kind="synthetic" />}
      caption="Low agreement is a clue, not an error: references can lack rare states (γδ T, developing neutrophils), so markers decide."
    >
      <HBars
        ariaLabel="Share of cells where SingleR agrees with the manual label"
        rows={rows.map((r) => ({
          label: r.label,
          value: r.agree,
          color: r.agree >= 0.8 ? "var(--good)" : "var(--warn)",
          text: pct(r.agree, 0),
          tip: `${r.label} · ${pct(r.agree, 0)} agree · otherwise called "${r.alt}"`,
        }))}
      />
    </ChartFrame>
  );
}
