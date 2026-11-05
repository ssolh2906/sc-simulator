"use client";

import Link from "next/link";
import { StoryCards } from "@/components/ui/StoryCards";
import { Term } from "@/components/ui/Term";
import { GROUPS, TYPE_INDEX } from "@/content/cellTypes";
import { genesIn } from "@/content/genes";
import { CITATION, PAPER_FACTS } from "@/content/paperFacts";
import { STORY } from "@/content/steps";
import { pct } from "@/lib/format";
import { perSample } from "@/lib/sim/composition";
import { cd14Cells } from "@/lib/sim/de";
import { dotStats } from "@/lib/sim/expression";
import { moduleBySample } from "@/lib/sim/moduleScore";
import { covidSamples } from "@/lib/sim/samples";
import { median } from "@/lib/sim/stats";
import { STEPS, stepHref } from "../registry";
import { Finding } from "./conclusion/Finding";
import { MiniBars } from "./conclusion/MiniBars";

const groupMedians = (vals: Record<string, { value: number }[]>) =>
  GROUPS.map((g) => ({ label: g.name, value: median(vals[g.key].map((v) => v.value)), color: g.color }));

export function ConclusionStep() {
  const neut = groupMedians(perSample(TYPE_INDEX.neut));
  const hla = groupMedians(moduleBySample(genesIn("hla2")));
  const isg = moduleBySample(genesIn("isg"));
  const isgCovid = [...isg.nonvent, ...isg.ards];
  const low = new Set(covidSamples().filter((s) => s.isgLow).map((s) => s.id));
  const cyto = ["TNF", "IL6", "IL1B", "LYZ"].map((g) => ({
    label: g,
    value: dotStats(cd14Cells(), g).pct,
    color: g === "LYZ" ? "var(--muted)" : "var(--ct-cd14)",
  }));
  const s = STORY.conclusion;

  return (
    <>
      <div className="border-l-[3px] border-accent py-1 pl-3.5">
        <p className="text-[clamp(17px,2.4vw,21px)] leading-snug font-semibold text-balance">
          Severe COVID-19 changed both which immune cells are in the blood and what state they are in.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Finding n="1 · Composition" title="New cells appear in the blood">
          <MiniBars rows={neut} format={(v) => pct(v)} label="Dev. Neutrophil, median % per sample" />
          <p>
            <Term k="Dev. Neutrophil">Dev. neutrophils</Term> and plasmablasts rise, mostly in <Term k="ARDS" />. NK, CD16 Mono,
            pDC and γδ T drop.
          </p>
        </Finding>
        <Finding n="2 · Monocytes" title="HLA class II goes down">
          <MiniBars rows={hla} format={(v) => v.toFixed(2)} label="HLA class II module score, median" />
          <p>
            Monocytes show less <Term k="HLA class II" /> in every patient, so they may present antigen less well.
          </p>
        </Finding>
        <Finding n="3 · Heterogeneity" title="Interferon response: some, not all">
          <MiniBars
            rows={isgCovid.map((v) => ({ label: v.sample, value: Math.max(v.value, 0), color: low.has(v.sample) ? "var(--healthy)" : "var(--up)" }))}
            format={(v) => v.toFixed(1)}
            label="ISG module score per COVID sample"
          />
          <p>
            <Term k="ISG" /> signal is strong in 5 samples and near healthy in 3. Patients differ.
          </p>
        </Finding>
        <Finding n="4 · Absence" title="No cytokine storm in blood monocytes">
          <MiniBars rows={cyto} format={(v) => pct(v, 0)} label="% of CD14 Mono expressing (LYZ = on)" />
          <p>
            TNF, IL6, IL1B stay near zero. The <Term k="cytokine storm" /> signals likely come from elsewhere.
          </p>
        </Finding>
      </div>
      <div>
        <p className="mb-1.5 font-mono text-[11.5px] text-muted">The pipeline you ran · click to revisit</p>
        <nav aria-label="Recap" className="flex flex-wrap items-center gap-1 font-mono text-xs">
          {STEPS.slice(0, -1).map((st, i) => (
            <span key={st.slug} className="inline-flex items-center gap-1">
              <Link href={stepHref(st.slug)} className="rounded-md bg-accent-soft px-2 py-0.5 text-accent hover:underline">
                {st.rail}
              </Link>
              {i < STEPS.length - 2 && <span className="text-muted">→</span>}
            </span>
          ))}
        </nav>
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl border border-line p-3">
          <b>Limits of the study</b>
          <p className="mt-1 text-ink-2">
            {PAPER_FACTS.limitations.text} <span className="font-mono text-[11px] text-muted">({PAPER_FACTS.limitations.source})</span>
          </p>
        </div>
        <div className="rounded-xl border border-line p-3">
          <b>Limits of this simulation</b>
          <p className="mt-1 text-ink-2">
            ~2,000 synthetic cells instead of 44,721, 13 clusters instead of 30, and invented values that only follow the
            paper&apos;s directions. The trajectory is a hypothesis.
          </p>
        </div>
      </div>
      <p className="text-[13px] text-ink-2">
        {CITATION.authors} <i>{CITATION.title}</i> {CITATION.journal}{" "}
        <a href={CITATION.doi} target="_blank" rel="noopener noreferrer" className="text-accent underline">
          {CITATION.doi.replace("https://", "")}
        </a>
      </p>
      <StoryCards do={s.do} see={s.see} next={s.next} unlocked lockedHint="" />
    </>
  );
}
