"use client";

import { useMemo, useState } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { ScatterCanvas } from "@/components/charts/ScatterCanvas";
import { ToggleChip } from "@/components/ui/Chip";
import { genesIn } from "@/content/genes";
import { useThemeColors } from "@/hooks/useThemeColors";
import { pct } from "@/lib/format";
import { cd14Cells } from "@/lib/sim/de";
import { dotStats } from "@/lib/sim/expression";
import { usePipeline } from "../../PipelineProvider";
import { featurePoints } from "../featurePlot";
import { UMAP_AXES } from "../umapView";

const GENES = [...genesIn("cytokine"), "LYZ"];

/** Feature plots of CD14 monocytes: cytokines are almost off; LYZ shows what "on" looks like. */
export function CytokinePanel() {
  const { nPcs } = usePipeline();
  const c = useThemeColors();
  const [gene, setGene] = useState("TNF");
  const points = useMemo(() => featurePoints(cd14Cells(), gene, c, nPcs), [gene, c, nPcs]);
  const share = dotStats(cd14Cells(), gene).pct;
  return (
    <ChartFrame title={<>Feature plot · CD14 Mono · {gene}</>} aside={gene === "LYZ" ? "positive control" : undefined}>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {GENES.map((g) => (
          <ToggleChip key={g} pressed={gene === g} onClick={() => setGene(g)}>
            {g}
          </ToggleChip>
        ))}
      </div>
      <ScatterCanvas
        ariaLabel={`CD14 monocytes colored by ${gene}`}
        aspect={4 / 3}
        points={points}
        {...UMAP_AXES}
        xDomain={[-2.8, 5]}
        yDomain={[-6, 0]}
      />
      <p className="mt-2 text-sm text-ink-2">
        {pct(share)} of CD14 monocytes express {gene}
      </p>
    </ChartFrame>
  );
}
