"use client";

import { useMemo, useState } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { DotPlot } from "@/components/charts/DotPlot";
import { ScatterCanvas } from "@/components/charts/ScatterCanvas";
import { Button } from "@/components/ui/Button";
import { ToggleChip } from "@/components/ui/Chip";
import { Controls, Grid2 } from "@/components/ui/Layout";
import { PaperNote } from "@/components/ui/PaperNote";
import { StatusChip } from "@/components/ui/StatusChip";
import { useThemeColors } from "@/hooks/useThemeColors";
import { clusterDotPlot } from "@/lib/sim/annotation";
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
        <ChartFrame title="Dot plot · MT- / RP- genes vs lineage genes" aside="highlight = flagged">
          <DotPlot
            ariaLabel="Mito and ribo gene expression per cluster"
            genes={GENES}
            cols={ids.map((id) => ({ id, label: String(id), flagged: flagged.includes(id) }))}
            value={(g, id) => dots.get(`${g}|${id}`)!}
            maxAvg={3.4}
          />
        </ChartFrame>
        <ChartFrame title="UMAP · flagged clusters in orange">
          <ScatterCanvas ariaLabel="UMAP with flagged clusters highlighted" aspect={1} points={points} {...UMAP_AXES} />
        </ChartFrame>
      </Grid2>
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
      <PaperNote
        tutorial="Not a standard tutorial step: QC is often assumed to be enough."
        paper="Two mito/ribo-dominated clusters were removed after clustering."
        facts={["junk"]}
      />
    </>
  );
}
