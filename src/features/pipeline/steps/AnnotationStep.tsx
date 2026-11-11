"use client";

import { useMemo, useState } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { DotPlot } from "@/components/charts/DotPlot";
import { ScatterCanvas, type Pt } from "@/components/charts/ScatterCanvas";
import { Button } from "@/components/ui/Button";
import { Controls, Grid2, Note } from "@/components/ui/Layout";
import { PaperNote } from "@/components/ui/PaperNote";
import { ReferenceDetails } from "@/components/ui/ReferenceDetails";
import { Segmented } from "@/components/ui/Segmented";
import { Term } from "@/components/ui/Term";
import { CELL_TYPES } from "@/content/cellTypes";
import { useThemeColors } from "@/hooks/useThemeColors";
import { ANNOTATION_MARKERS, clusterDotPlot, matchOrder, type RefMatch } from "@/lib/sim/annotation";
import { cellsOfCluster, cleanCells, getClusters } from "@/lib/sim/clusters";
import { centroid, umapPos } from "@/lib/sim/umap";
import { usePipeline, usePipelineDispatch } from "../PipelineProvider";
import { MatchCaption, MatchList, ReferenceTable } from "./annotation/ReferenceMatch";
import { SingleRPanel, UnknownCheck } from "./annotation/SingleRPanel";
import { useMatchReveal } from "./annotation/useMatchReveal";
import { featurePoints } from "./featurePlot";
import { StepStory } from "./StepStory";
import { UMAP_AXES } from "./umapView";

type ColorBy = "match" | "gene";
const COLOR_BY: { value: ColorBy; label: string }[] = [
  { value: "match", label: "reference match" },
  { value: "gene", label: "gene" },
];

const typeByKey = new Map(CELL_TYPES.map((t) => [t.key, t]));

export function AnnotationStep() {
  const { markersFound, singleR, unknownNamed, nPcs } = usePipeline();
  const dispatch = usePipelineDispatch();
  const c = useThemeColors();
  const [gene, setGene] = useState("CD3E");
  const [colorBy, setColorBy] = useState<ColorBy>("match");
  const cl = getClusters("default");
  const clusters = cl.info.filter((i) => !i.junk);
  const ids = clusters.map((i) => i.id);
  const dots = new Map(clusterDotPlot(ANNOTATION_MARKERS, ids).map((d) => [`${d.gene}|${d.cluster}`, d]));
  const order = matchOrder();
  const reveal = useMatchReveal(order.length, markersFound);
  const { shown, current: cur } = reveal;
  const revealed = order.slice(0, shown);
  const now = cur >= 0 ? order[cur] : null;
  const matchOf = new Map(revealed.map((m) => [m.cluster, m]));
  const showMatch = markersFound && (reveal.running || colorBy === "match");
  const unknown = order.find((m) => !m.key) ?? null;
  // The only cluster the table can't name is the Dev. Neutrophil one (tests pin this), so naming it means "neut".
  const keyOf = (m: RefMatch) => m.key ?? (unknownNamed ? "neut" : null);

  const genePoints = useMemo(() => featurePoints(cleanCells(), gene, c, nPcs), [gene, c, nPcs]);
  // Revealed clusters take their type color; the unknown stays gray so it reads as "not in the table".
  // While matching, the current cluster is drawn bright and everything else fades.
  const matchPoints = useMemo(() => {
    const rows = matchOrder();
    return rows.flatMap((m, i): Pt[] => {
      const isRevealed = i < shown;
      const key = m.key ?? (unknownNamed ? "neut" : null);
      const t = isRevealed && key ? typeByKey.get(key)! : null;
      const color = t ? c[t.token as keyof typeof c] : isRevealed ? c["--ct-junk"] : c["--seq0"];
      const alpha = cur < 0 ? (isRevealed ? 0.75 : 0.5) : i === cur ? 0.95 : 0.2;
      return cellsOfCluster(getClusters("default"), m.cluster).map((cell) => {
        const [x, y] = umapPos(cell, nPcs);
        return { x, y, color, alpha, r: i === cur ? 2.8 : 2.3, tip: `cluster ${m.cluster}` };
      });
    });
  }, [c, nPcs, shown, cur, unknownNamed]);

  const nameOf = (id: number) => {
    const m = matchOf.get(id);
    const k = m ? keyOf(m) : null;
    return k ? typeByKey.get(k)! : null;
  };
  const labels = clusters.map((info) => {
    const [x, y] = centroid(cellsOfCluster(cl, info.id), nPcs);
    if (!matchOf.has(info.id)) return { x, y, text: String(info.id), size: 11 };
    const t = nameOf(info.id);
    return { x, y: y + 1.5, text: t ? t.name : `? cluster ${info.id}`, size: t ? 10 : 11 };
  });

  const findMarkers = () => {
    dispatch({ type: "findMarkers" });
    setColorBy("match");
    reveal.start();
  };

  const pickGene = (g: string) => {
    setGene(g);
    setColorBy("gene");
  };

  return (
    <>
      <ReferenceTable active={now?.key} noFit={!!now && !now.key} />
      <Controls>
        <Button variant={markersFound ? "ghost" : "primary"} onClick={findMarkers} disabled={reveal.running} hint="FindAllMarkers()">
          {markersFound ? "Replay matching" : "Find markers"}
        </Button>
        {reveal.running && (
          <Button variant="ghost" onClick={reveal.skip}>
            Skip
          </Button>
        )}
        {markersFound && !reveal.running && (
          <Segmented label="Color UMAP by" showLabel options={COLOR_BY} value={colorBy} onChange={setColorBy} />
        )}
      </Controls>
      {reveal.running && <MatchCaption m={now} />}
      <Grid2>
        <ChartFrame title={<><Term k="dot plot" /> · click a gene →</>} aside="11 clusters (junk removed)">
          <DotPlot
            ariaLabel="Marker gene dot plot per cluster"
            genes={ANNOTATION_MARKERS}
            cols={clusters.map((i) => ({ id: i.id, label: matchOf.has(i.id) ? (nameOf(i.id)?.short ?? "?") : String(i.id) }))}
            value={(g, id) => dots.get(`${g}|${id}`)!}
            maxAvg={3}
            selected={gene}
            onSelect={pickGene}
          />
          <Note>Dot size = % of cells expressing. Stronger color = higher average.</Note>
        </ChartFrame>
        {showMatch ? (
          <ChartFrame title="UMAP · matched to the PBMC reference" aside="gray = no known type fits">
            <ScatterCanvas ariaLabel="UMAP colored by reference match" aspect={1} points={matchPoints} labels={labels} {...UMAP_AXES} />
          </ChartFrame>
        ) : (
          <ChartFrame title={<><Term k="feature plot" /> · {gene}</>} aside="strong color = expressed">
            <ScatterCanvas ariaLabel={`UMAP colored by ${gene} expression`} aspect={1} points={genePoints} labels={labels} {...UMAP_AXES} />
          </ChartFrame>
        )}
      </Grid2>
      {markersFound && <MatchList rows={[...revealed].sort((a, b) => a.cluster - b.cluster)} current={now?.cluster} unknownNamed={unknownNamed} />}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <Button onClick={() => dispatch({ type: "runSingleR" })} disabled={!markersFound || reveal.running || singleR} hint="SingleR()">
          {singleR ? "SingleR done" : "Run SingleR"}
        </Button>
        {!markersFound && <span className="text-[13px] text-muted">Find markers first.</span>}
      </div>
      {singleR && (
        <>
          <SingleRPanel known={order.filter((m) => m.key)} />
          {unknown && <UnknownCheck cluster={unknown.cluster} named={unknownNamed} onName={() => dispatch({ type: "nameUnknown" })} />}
        </>
      )}
      <StepStory step="annotation" />
      <ReferenceDetails step="annotation">
        <PaperNote
          tutorial="Known marker genes only."
          paper="FindMarkers (Wilcoxon) + known markers, confirmed with SingleR."
          facts={["annotation", "nkMarkers", "gdMarkers", "devNeutGenes"]}
        />
      </ReferenceDetails>
    </>
  );
}

