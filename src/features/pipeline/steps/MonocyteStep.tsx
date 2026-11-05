"use client";

import { useState } from "react";
import { BoxDotPlot } from "@/components/charts/BoxDotPlot";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { Heatmap } from "@/components/charts/Heatmap";
import { Controls, Grid2 } from "@/components/ui/Layout";
import { PaperNote } from "@/components/ui/PaperNote";
import { Segmented } from "@/components/ui/Segmented";
import { Term } from "@/components/ui/Term";
import { GROUPS } from "@/content/cellTypes";
import { genesIn } from "@/content/genes";
import { perSampleDe } from "@/lib/sim/de";
import { moduleBySample } from "@/lib/sim/moduleScore";
import { covidSamples } from "@/lib/sim/samples";
import { usePipelineDispatch, useStepDone } from "../PipelineProvider";
import { CytokinePanel } from "./monocytes/CytokinePanel";
import { StepStory } from "./StepStory";

type Tab = "hla" | "isg" | "cyt";
const TABS: { value: Tab; label: string }[] = [
  { value: "hla", label: "HLA class II" },
  { value: "isg", label: "ISG" },
  { value: "cyt", label: "Cytokines" },
];

const ROWS: Record<Tab, string[]> = {
  hla: [...genesIn("hla2"), ...genesIn("hla1"), ...genesIn("hlaEF")],
  isg: ["IFI27", ...genesIn("isg")],
  cyt: genesIn("cytokine"),
};

const SEE: Record<Tab, string> = {
  hla: "Class II (top 8 rows) is down in nearly every patient. Class I (A, B, C) has no consistent direction.",
  isg: "ISGs are up in 5 samples but flat in 3 (marked *). IFI27 is up in most donors anyway.",
  cyt: "TNF, IL6, IL1B, CCL3, CCL4, CXCL2 stay near zero. No signal is the finding.",
};

export function MonocyteStep() {
  const done = useStepDone("monocytes");
  const dispatch = usePipelineDispatch();
  const [tab, setTab] = useState<Tab>("hla");
  const [seen, setSeen] = useState<Tab[]>(["hla"]);
  const pick = (t: Tab) => {
    setTab(t);
    const next = seen.includes(t) ? seen : [...seen, t];
    setSeen(next);
    if (!done && next.length === TABS.length) dispatch({ type: "complete", step: "monocytes" });
  };

  const de = new Map(perSampleDe(ROWS[tab]).map((d) => [`${d.gene}|${d.sample}`, d]));
  const cols = covidSamples().map((s) => ({
    key: s.id,
    label: s.id,
    group: GROUPS.find((g) => g.key === s.group)!.name,
    mark: tab === "isg" && s.isgLow,
  }));

  return (
    <>
      <Controls>
        <Segmented label="Gene set" options={TABS} value={tab} onChange={pick} />
      </Controls>
      <Grid2>
        <ChartFrame title={<>CD14 Mono · <Term k="log2FC" /> vs healthy · genes × COVID samples</>} aside="dot = Bonferroni padj < 0.05">
          <Heatmap
            ariaLabel={`Heatmap of ${TABS.find((t) => t.value === tab)!.label} log2 fold changes per COVID sample`}
            rows={ROWS[tab]}
            cols={cols}
            value={(g, s) => de.get(`${g}|${s}`)!.log2fc}
            sig={(g, s) => de.get(`${g}|${s}`)!.sig}
          />
        </ChartFrame>
        {tab === "cyt" ? <CytokinePanel /> : <ModulePanel tab={tab} />}
      </Grid2>
      <p className="text-sm text-ink-2">{SEE[tab]}</p>
      <StepStory step="monocytes" />
      <PaperNote
        tutorial="Pool all COVID cells vs all healthy cells in one FindMarkers call."
        paper="Each COVID sample vs all healthy controls (Wilcoxon, Bonferroni)."
        facts={["monoDesign", "hla2", "hla1", "isg", "cytokines"]}
      />
    </>
  );
}

function ModulePanel({ tab }: { tab: "hla" | "isg" }) {
  const genes = tab === "hla" ? genesIn("hla2") : genesIn("isg");
  const scores = moduleBySample(genes);
  const low = new Set(covidSamples().filter((s) => s.isgLow).map((s) => s.id));
  return (
    <ChartFrame
      title={<><Term k="module score" /> · {tab === "hla" ? "HLA class II" : "ISG"} · 1 dot = 1 sample</>}
      aside={tab === "isg" ? "ringed = ISG-low" : undefined}
    >
      <BoxDotPlot
        ariaLabel={`${tab === "hla" ? "HLA class II" : "ISG"} module score per sample`}
        groups={GROUPS.map((g) => ({ name: g.name, color: g.color, values: scores[g.key].map((v) => ({ label: v.sample, value: v.value })) }))}
        ring={tab === "isg" ? (label) => low.has(label) : undefined}
        yFormat={(v) => v.toFixed(1)}
        yLabel="median score (CD14 Mono)"
        height={260}
      />
    </ChartFrame>
  );
}
