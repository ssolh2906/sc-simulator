"use client";

import { useMemo } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { ScatterCanvas } from "@/components/charts/ScatterCanvas";
import { CELL_TYPES, type GROUPS } from "@/content/cellTypes";
import { useThemeColors } from "@/hooks/useThemeColors";
import { cleanCells } from "@/lib/sim/clusters";
import { getSamples } from "@/lib/sim/samples";
import { umapPos } from "@/lib/sim/umap";
import { usePipeline } from "../../PipelineProvider";
import { UMAP_AXES } from "../umapView";

/** One small UMAP per group, the chosen type in color. */
export function SplitUmaps({ type, groups }: { type: number; groups: (typeof GROUPS)[number][] }) {
  const { nPcs } = usePipeline();
  const c = useThemeColors();
  const t = CELL_TYPES[type];
  const byGroup = useMemo(() => {
    const samples = getSamples();
    const color = c[t.token as keyof typeof c];
    return Object.fromEntries(
      groups.map((g) => {
        const cells = cleanCells().filter((cell) => samples[cell.sample].group === g.key);
        const pts = cells
          .map((cell) => {
            const [x, y] = umapPos(cell, nPcs);
            const on = cell.type === type;
            return { x, y, on, color: on ? color : c["--line"], alpha: on ? 0.95 : 0.6, r: on ? 2.8 : 2 };
          })
          .sort((a, b) => Number(a.on) - Number(b.on));
        return [g.key, { pts, n: cells.filter((x) => x.type === type).length, total: cells.length }];
      }),
    );
  }, [groups, type, nPcs, c, t.token]);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {groups.map((g) => (
        <ChartFrame key={g.key} title={<span style={{ color: g.color, fontWeight: 600 }}>● {g.name}</span>} aside={`${byGroup[g.key].n} / ${byGroup[g.key].total} cells`}>
          <ScatterCanvas
            ariaLabel={`${g.name} UMAP with ${t.name} highlighted`}
            aspect={1}
            points={byGroup[g.key].pts}
            labels={[{ x: t.umap[0], y: t.umap[1] + 1.6, text: t.name, size: 10 }]}
            {...UMAP_AXES}
            xLabel=""
            yLabel=""
          />
        </ChartFrame>
      ))}
    </div>
  );
}
