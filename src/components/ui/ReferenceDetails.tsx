import type { ReactNode } from "react";
import type { StepSlug } from "@/features/pipeline/registry";
import { CodeLine } from "./CodeLine";

/** Bottom tier: the step's code and paper details, folded so they don't compete with the results. */
export function ReferenceDetails({ step, children }: { step: StepSlug; children?: ReactNode }) {
  return (
    <details className="group border-t border-line pt-3">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 font-mono text-xs text-muted [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="inline-block transition-transform group-open:rotate-90">▸</span>
        Code &amp; paper details
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        <CodeLine step={step} />
        {children}
      </div>
    </details>
  );
}
