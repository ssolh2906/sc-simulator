"use client";

import { useMemo } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { ScatterCanvas } from "@/components/charts/ScatterCanvas";
import { ChipRow } from "@/components/ui/Chip";
import { Controls } from "@/components/ui/Layout";
import { PaperNote } from "@/components/ui/PaperNote";
import { ReferenceDetails } from "@/components/ui/ReferenceDetails";
import { Segmented } from "@/components/ui/Segmented";
import { StatusChip } from "@/components/ui/StatusChip";
import { Term } from "@/components/ui/Term";
import { useThemeColors } from "@/hooks/useThemeColors";
import { getDataset } from "@/lib/sim/cells";
import { getClusters, RESOLUTIONS, type Resolution } from "@/lib/sim/clusters";
import { centroid, umapPos } from "@/lib/sim/umap";
import { usePipeline, usePipelineDispatch } from "../PipelineProvider";
import { StepStory } from "./StepStory";
import { tokenOf, UMAP_AXES } from "./umapView";

const OPTIONS = RESOLUTIONS.map((r) => ({ value: r.key, label: `${r.value} · ${r.key}` }));

const MESSAGE: Record<Resolution, { ok: boolean; text: string }> = {
  low: { ok: false, text: "Under-clustering: T + NK, Mono, B + Plasmablast merged" },
  default: { ok: true, text: "About one island = one cluster" },
  high: { ok: false, text: "Over-clustering: one island split into several IDs" },
};

export function ClusteringStep() {
  const { resolution, nPcs } = usePipeline();
  const dispatch = usePipelineDispatch();
  const c = useThemeColors();
  const { cells } = getDataset();

  const { points, labels, n } = useMemo(() => {
    if (!resolution) {
      return { points: cells.map((cell) => ({ ...xy(umapPos(cell, nPcs)), color: c["--ink-2"], alpha: 0.45, r: 2.3 })), labels: [], n: 0 };
    }
    const cl = getClusters(resolution);
    const points = cells.map((cell, i) => {
      const info = cl.info[cl.labels[i]];
      return { ...xy(umapPos(cell, nPcs)), color: c[tokenOf(info.main) as keyof typeof c], alpha: info.sub ? 0.45 : 0.85, r: 2.4, tip: `cluster ${info.id}` };
    });
    const labels = cl.info.map((info) => {
      const [x, y] = centroid(cells.filter((_, i) => cl.labels[i] === info.id), nPcs);
      return { x, y, text: String(info.id), size: 12 };
    });
    return { points, labels, n: cl.info.length };
  }, [cells, resolution, nPcs, c]);

  return (
    <>
      <Controls>
        <Segmented label="resolution" showLabel options={OPTIONS} value={resolution} onChange={(res) => dispatch({ type: "setResolution", res })} />
      </Controls>
      <ChartFrame title={<><Term k="SNN graph" /> → <Term k="Louvain" /> · number = cluster ID</>}>
        <ScatterCanvas ariaLabel="UMAP colored by cluster" points={points} labels={labels} {...UMAP_AXES} />
      </ChartFrame>
      {resolution && (
        <ChipRow>
          <StatusChip ok={MESSAGE[resolution].ok}>{n} clusters · {MESSAGE[resolution].text}</StatusChip>
        </ChipRow>
      )}
      <p className="text-sm text-ink-2">
        <Term k="resolution" /> sets how finely the graph is cut. Colors follow lineage so you can compare islands; the
        algorithm itself only sees the graph.
      </p>
      <StepStory step="clustering" />
      <ReferenceDetails step="clustering">
        <PaperNote
          tutorial="Leiden clustering at resolution 0.5–0.8."
          paper="FindNeighbors(dims = 1:50) + FindClusters() with Louvain: 30 clusters (13 here)."
          facts={["clustering", "scale"]}
        />
      </ReferenceDetails>
    </>
  );
}

const xy = ([x, y]: [number, number]) => ({ x, y });
