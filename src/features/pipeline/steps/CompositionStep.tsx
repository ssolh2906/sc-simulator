"use client";

import { useState } from "react";
import { BoxDotPlot, type BoxFocus } from "@/components/charts/BoxDotPlot";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { ToggleChip } from "@/components/ui/Chip";
import { Controls } from "@/components/ui/Layout";
import { PaperNote } from "@/components/ui/PaperNote";
import { ReferenceDetails } from "@/components/ui/ReferenceDetails";
import { Segmented } from "@/components/ui/Segmented";
import { Term } from "@/components/ui/Term";
import { HowToReadButton, useWalkthrough, WalkthroughCaption } from "@/components/ui/Walkthrough";
import { CELL_TYPES, GROUPS, TYPE_INDEX } from "@/content/cellTypes";
import { pct, pValue } from "@/lib/format";
import { perSample, perSampleTests } from "@/lib/sim/composition";
import { usePipelineDispatch, useStepDone } from "../PipelineProvider";
import { PooledView } from "./composition/PooledView";
import { SplitUmaps } from "./composition/SplitUmaps";
import { StepStory } from "./StepStory";

type View = "sample" | "pooled";
const VIEWS: { value: View; label: string }[] = [
  { value: "sample", label: "Per sample (right)" },
  { value: "pooled", label: "Pool all cells (wrong)" },
];

const pNote = (p: number) => (p < 0.05 ? pValue(p) : `ns (${pValue(p)})`);

export function CompositionStep() {
  const done = useStepDone("composition");
  const dispatch = usePipelineDispatch();
  const [type, setType] = useState<number>(TYPE_INDEX.neut);
  const [view, setView] = useState<View>("sample");
  const [seen, setSeen] = useState({ types: [TYPE_INDEX.neut as number], pooled: false });

  const markSeen = (next: typeof seen) => {
    setSeen(next);
    if (!done && next.types.length >= 2 && next.pooled) dispatch({ type: "complete", step: "composition" });
  };
  const pickType = (t: number) => {
    setType(t);
    if (!seen.types.includes(t)) markSeen({ ...seen, types: [...seen.types, t] });
  };
  const pickView = (v: View) => {
    setView(v);
    if (v === "pooled" && !seen.pooled) markSeen({ ...seen, pooled: true });
  };

  const values = perSample(type);
  const tests = perSampleTests(type);
  const groups = [...GROUPS];
  const name = CELL_TYPES[type].name;
  const ards = GROUPS.find((g) => g.key === "ards")!.name;
  const top = values.ards.reduce((a, b) => (b.value > a.value ? b : a));
  const steps: (BoxFocus & { text: string })[] = [
    { text: `This dot is one sample, ${top.sample}: ${pct(top.value)} of its cells are ${name}.`, part: "dots", sample: top.sample },
    {
      text: `${ards} n=${values.ards.length} means ${values.ards.length} samples. The chart holds all 14 samples (6 + 4 + 4), from 13 people: one patient was sampled twice.`,
      part: "dots",
      group: ards,
    },
    { text: "The box spans the middle half of a group's samples. The thick line is the median.", part: "box", group: ards },
    {
      text: `The top label compares a group with Healthy. For ${ards}: ${pNote(tests.ards)}. ns means not significant: the difference could be chance.`,
      part: "note",
      group: ards,
    },
  ];
  const tour = useWalkthrough(steps);
  const focus = view === "sample" ? tour.current : null;

  return (
    <>
      <div role="group" aria-label="Cell type" className="flex flex-wrap gap-1.5">
        {CELL_TYPES.map((t, i) => (
          <ToggleChip key={t.key} pressed={type === i} onClick={() => pickType(i)} color={`var(${t.token})`}>
            {t.name}
          </ToggleChip>
        ))}
      </div>
      <Controls>
        <Segmented label="Statistics" options={VIEWS} value={view} onChange={pickView} />
      </Controls>
      {view === "sample" ? (
        <ChartFrame
          title={<>{name} · % of each sample · 1 dot = 1 sample (<Term k="replicate" />)</>}
          aside={<><Term k="Wilcoxon" /> vs Healthy <HowToReadButton tour={tour} /></>}
        >
          <BoxDotPlot
            ariaLabel={`${name} percentage per sample by group`}
            groups={groups.map((g) => ({ name: g.name, color: g.color, values: values[g.key].map((v) => ({ label: v.sample, value: v.value })) }))}
            notes={groups.map((g) => (g.key === "healthy" ? null : pNote(tests[g.key])))}
            yFormat={(v) => pct(v, v > 0 && v < 0.1 ? 1 : 0)}
            yLabel={`% ${name}`}
            focus={focus ?? undefined}
          />
          {focus && <WalkthroughCaption tour={tour}>{focus.text}</WalkthroughCaption>}
        </ChartFrame>
      ) : (
        <PooledView type={type} groups={groups} />
      )}
      <SplitUmaps type={type} groups={groups} />
      <p className="text-sm text-ink-2">
        Pooling treats each of ~2,000 cells as independent evidence. The real replicates are the <b>14 samples</b> (from 13 people), so the per-sample test is the honest one.
      </p>
      <StepStory step="composition" />
      <ReferenceDetails step="composition">
        <PaperNote
          tutorial="Cell-level % per group: prop.table(table(celltype, condition))."
          paper="Per-sample % compared with a two-sided Wilcoxon rank-sum test."
          facts={["compositionStats", "depleted", "plasmablasts", "devNeut", "devNeutPosition"]}
        />
      </ReferenceDetails>
    </>
  );
}
