"use client";

import { Button } from "@/components/ui/Button";
import { Grid2 } from "@/components/ui/Layout";
import { PaperNote } from "@/components/ui/PaperNote";
import { StatTile, StatTiles } from "@/components/ui/StatTile";
import { Term } from "@/components/ui/Term";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { getDataset } from "@/lib/sim/cells";
import { int } from "@/lib/format";
import { usePipeline, usePipelineDispatch } from "../PipelineProvider";
import { CountMatrix } from "./question/CountMatrix";
import { SamplePictogram } from "./question/SamplePictogram";
import { StepStory } from "./StepStory";

export function QuestionStep() {
  const { loaded } = usePipeline();
  const dispatch = usePipelineDispatch();
  const total = getDataset().qcCells.length;
  return (
    <>
      <div className="border-l-[3px] border-accent py-1 pl-3.5">
        <p className="text-[clamp(17px,2.4vw,21px)] leading-snug font-semibold text-balance">
          How do blood immune cells of severe COVID-19 patients differ from healthy people?
        </p>
      </div>
      <Grid2>
        <ChartFrame title="Samples: one icon = one sample" aside="14 samples from 13 people">
          <SamplePictogram />
        </ChartFrame>
        <div className="flex flex-col justify-center gap-2.5">
          <Button onClick={() => dispatch({ type: "load" })} hint="CreateSeuratObject()" className="self-start">
            {loaded ? "Loaded ✓" : "Load count matrix"}
          </Button>
          <StatTiles>
            <StatTile value={loaded ? int(total) : "—"} label="droplets (cells)" />
            <StatTile value={loaded ? "~20k" : "—"} label="genes" />
            <StatTile value={loaded ? "~92%" : "—"} label="zeros (typical)" />
          </StatTiles>
        </div>
      </Grid2>
      {loaded && <CountMatrix />}
      <StepStory step="question" />
      <PaperNote
        tutorial="One group of patients vs one group of controls."
        paper={<><Term k="Seq-Well" /> <Term k="scRNA-seq" /> on <Term k="PBMC">PBMCs</Term>: 14 samples from 13 people, in 3 groups.</>}
        facts={["method", "donors", "groups", "scale"]}
      />
    </>
  );
}
