import type { ReactNode } from "react";
import { PAPER_FACTS, type PaperFactKey } from "@/content/paperFacts";

type Props = {
  tutorial: ReactNode;
  paper: ReactNode;
  facts: PaperFactKey[];
};

/** "Paper used" chip: tutorial default vs what Wilk et al. did, with sources. */
export function PaperNote({ tutorial, paper, facts }: Props) {
  return (
    <details className="group rounded-xl border border-line bg-surface-2">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-2 font-mono text-xs [&::-webkit-details-marker]:hidden">
        <span className="rounded-full bg-accent-soft px-2 py-0.5 font-semibold text-accent">
          Paper used <span aria-hidden className="inline-block transition-transform group-open:rotate-90">▸</span>
        </span>
        <span className="text-ink-2">{paper}</span>
      </summary>
      <div className="grid gap-3 border-t border-line px-3 py-3 sm:grid-cols-2">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Tutorial default</p>
          <p className="text-sm">{tutorial}</p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-accent">Paper used</p>
          <p className="text-sm">{paper}</p>
        </div>
        <ul className="space-y-1 text-[13px] text-ink-2 sm:col-span-2">
          {facts.map((k) => (
            <li key={k}>
              {PAPER_FACTS[k].text} <span className="font-mono text-[11px] text-muted">({PAPER_FACTS[k].source})</span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
