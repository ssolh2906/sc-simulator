"use client";

import Link from "next/link";
import { useStepDone } from "@/features/pipeline/PipelineProvider";
import { LAST_STEP, STEPS, stepHref, stepIndex, type StepSlug } from "@/features/pipeline/registry";

const BTN = "inline-flex min-w-24 items-center justify-center gap-2 rounded-[10px] px-4 py-2 text-sm font-semibold";

// Muted until the step is done, but never locked: the user may skip ahead.
const NEXT_IDLE = "border border-line bg-surface-2 text-muted";
const NEXT_DONE = "bg-good text-accent-ink pulse";

/** Previous / next. Next turns green (and pulses) once the current step is done. */
export function Pager({ slug }: { slug: StepSlug }) {
  const i = stepIndex(slug);
  const done = useStepDone(slug);
  const prev = i > 0 ? STEPS[i - 1] : null;
  const next = i < LAST_STEP ? STEPS[i + 1] : null;
  return (
    <nav aria-label="Step navigation" className="mt-4 flex justify-between gap-2.5">
      {prev ? (
        <Link href={stepHref(prev.slug)} className={`${BTN} border border-line bg-surface text-ink`}>
          ← {prev.rail}
        </Link>
      ) : (
        <Link href="/" className={`${BTN} border border-line bg-surface text-ink`}>
          ← Home
        </Link>
      )}
      {next ? (
        <Link href={stepHref(next.slug)} className={`${BTN} transition-colors ${done ? NEXT_DONE : NEXT_IDLE}`}>
          {next.rail} →
        </Link>
      ) : (
        <Link href={stepHref("question")} className={`${BTN} bg-accent text-accent-ink`}>
          Start over ↺
        </Link>
      )}
    </nav>
  );
}
