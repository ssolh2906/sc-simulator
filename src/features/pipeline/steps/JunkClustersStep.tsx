"use client";

import { useMemo, useState } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { DotPlot, type DotFocus } from "@/components/charts/DotPlot";
import { ScatterCanvas } from "@/components/charts/ScatterCanvas";
import { Button } from "@/components/ui/Button";
import { ToggleChip } from "@/components/ui/Chip";
import { Controls, Grid2 } from "@/components/ui/Layout";
import { PaperNote } from "@/components/ui/PaperNote";
import { ReferenceDetails } from "@/components/ui/ReferenceDetails";
import { StatusChip } from "@/components/ui/StatusChip";
import { HowToReadButton, useWalkthrough, WalkthroughCaption } from "@/components/ui/Walkthrough";
import { useThemeColors } from "@/hooks/useThemeColors";
import { pct } from "@/lib/format";
import { clusterDotPlot, isMtOrRibo } from "@/lib/sim/annotation";
import { getDataset } from "@/lib/sim/cells";
import { getClusters, junkClusterIds } from "@/lib/sim/clusters";
import { umapPos } from "@/lib/sim/umap";
import { usePipeline, usePipelineDispatch } from "../PipelineProvider";
import { TopMarkers } from "./junk/TopMarkers";
import { StepStory } from "./StepStory";
import { tokenOf, UMAP_AXES } from "./umapView";

const GENES = ["MT-CO1", "MT-ND4", "MT-ATP6", "RPS27", "RPL13", "RPL34", "CD3E", "NKG7", "MS4A1", "LYZ"];

export function JunkClustersStep() {
  const { flagged, junkRemoved, nPcs } = usePipeline();
  const dispatch = usePipelineDispatch();
  const c = useThemeColors();
  const [checked, setChecked] = useState(false);
  const cl = getClusters("default");
  const ids = cl.info.map((i) => i.id);
  const junk = junkClusterIds();
  const dots = new Map(clusterDotPlot(GENES, ids).map((d) => [`${d.gene}|${d.cluster}`, d]));
  const found = junk.filter((id) => flagged.includes(id)).length;
  const wrong = flagged.filter((id) => !junk.includes(id)).length;
  const correct = found === junk.length && wrong === 0;

  const points = useMemo(() => {
    const { cells } = getDataset();
    const cl = getClusters("default");
    const junk = junkClusterIds();
    return cells.flatMap((cell, i) => {
      const id = cl.labels[i];
      if (junkRemoved && junk.includes(id)) return [];
      const [x, y] = umapPos(cell, nPcs);
      const hot = flagged.includes(id);
      const color = hot ? c["--warn"] : c[tokenOf(cl.info[id].main) as keyof typeof c];
      return [{ x, y, color, alpha: hot ? 0.95 : flagged.length ? 0.25 : 0.7, r: hot ? 3 : 2.3, tip: `cluster ${id}` }];
    });
  }, [flagged, junkRemoved, nPcs, c]);

  // Teaches reading the plot without naming the junk clusters, which are the quiz answer.
  const pctOf = (id: number) => dots.get(`CD3E|${id}`)!.pct;
  const real = ids.filter((id) => !junk.includes(id));
  const hi = real.reduce((a, b) => (pctOf(b) > pctOf(a) ? b : a));
  const lo = real.reduce((a, b) => (pctOf(b) < pctOf(a) ? b : a));
  const steps: (DotFocus & { text: string })[] = [
    { text: "Each row is one gene, here CD3E. Each column is one cluster.", genes: ["CD3E"] },
    {
      text: `Dot size is the share of cells expressing the gene. Color is how much, on average. Big and dark: ${pct(pctOf(hi), 0)} of cluster ${hi} express CD3E.`,
      genes: ["CD3E"],
      cols: [hi],
    },
    { text: `Tiny and pale: ${pct(pctOf(lo), 0)} of cluster ${lo} express CD3E.`, genes: ["CD3E"], cols: [lo] },
    {
      text: "MT- and RP- rows are mitochondrial and ribosomal genes. A cluster that lights up here, with little else, is a suspect.",
      genes: GENES.filter(isMtOrRibo),
    },
  ];
  const tour = useWalkthrough(steps);
  const focus = tour.current;

  const toggle = (id: number) => {
    setChecked(false);
    dispatch({ type: "toggleFlag", cluster: id });
  };

  return (
    <>
      <p className="text-sm text-ink-2">Click a cluster to flag it as junk. Look for clusters whose top genes are mostly MT- and RP- genes.</p>
      <div role="group" aria-label="Flag clusters" className="flex flex-wrap gap-1.5">
        {ids.map((id) => (
          <ToggleChip key={id} pressed={flagged.includes(id)} onClick={() => toggle(id)} color={flagged.includes(id) ? "var(--warn)" : "var(--line)"} label={`Flag cluster ${id}`}>
            cluster {id}
          </ToggleChip>
        ))}
      </div>
      <Grid2>
        <ChartFrame title="Dot plot · MT- / RP- genes vs lineage genes" aside={<>highlight = flagged <HowToReadButton tour={tour} /></>}>
          <DotPlot
            ariaLabel="Mito and ribo gene expression per cluster"
            genes={GENES}
            cols={ids.map((id) => ({ id, label: String(id), flagged: flagged.includes(id) }))}
            value={(g, id) => dots.get(`${g}|${id}`)!}
            maxAvg={3.4}
            focus={focus ?? undefined}
          />
        </ChartFrame>
        <ChartFrame title="UMAP · flagged clusters in orange">
          <ScatterCanvas ariaLabel="UMAP with flagged clusters highlighted" aspect={1} points={points} {...UMAP_AXES} />
        </ChartFrame>
      </Grid2>
      {focus && <WalkthroughCaption tour={tour}>{focus.text}</WalkthroughCaption>}
      <TopMarkers ids={ids} flagged={flagged} />
      <Controls>
        <Button onClick={() => setChecked(true)} disabled={!flagged.length || junkRemoved}>
          Check
        </Button>
        <Button variant="ghost" onClick={() => dispatch({ type: "removeJunk" })} disabled={!correct || junkRemoved} hint="subset(invert = TRUE)">
          Remove flagged
        </Button>
        {!junkRemoved && (
          <Button
            variant="ghost"
            onClick={() => {
              setChecked(true);
              dispatch({ type: "setFlags", clusters: junk });
            }}
          >
            Show answer
          </Button>
        )}
        {checked && !junkRemoved && (
          <>
            <StatusChip ok={found === junk.length}>found {found} of {junk.length}</StatusChip>
            {wrong > 0 && <StatusChip ok={false}>{wrong} real cluster{wrong > 1 ? "s" : ""} flagged</StatusChip>}
          </>
        )}
        {junkRemoved && <StatusChip ok>2 junk clusters removed</StatusChip>}
      </Controls>
      <StepStory step="junk-clusters" />
      <ReferenceDetails step="junk-clusters">
        <PaperNote
          tutorial="Not a standard tutorial step: QC is often assumed to be enough."
          paper="Two mito/ribo-dominated clusters were removed after clustering."
          facts={["junk"]}
        />
      </ReferenceDetails>
    </>
  );
}
