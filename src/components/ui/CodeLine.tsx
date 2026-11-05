"use client";

import { useState } from "react";
import { CODE } from "@/content/code";
import { usePipeline } from "@/features/pipeline/PipelineProvider";
import type { StepSlug } from "@/features/pipeline/registry";
import { useLang } from "@/hooks/useLocalPref";
import { Badge } from "./Badge";

/** One line of real code for the step, in Seurat or Scanpy, with current values bound in. */
export function CodeLine({ step }: { step: StepSlug }) {
  const state = usePipeline();
  const [lang, setLang] = useLang();
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const make = CODE[step];
  if (!make) return null;
  const snip = make(state);
  const code = lang === "seurat" ? snip.r : snip.py;
  const note = lang === "scanpy" ? snip.pyNote : undefined;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    setTimeout(() => setStatus("idle"), 1400);
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-[10px] border border-dashed border-line bg-surface-2 px-2.5 py-1.5">
      <div role="group" aria-label="Code language" className="flex flex-none gap-0.5 font-mono text-[10.5px] uppercase">
        {(["seurat", "scanpy"] as const).map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={lang === l}
            onClick={() => setLang(l)}
            className="cursor-pointer rounded px-1.5 py-0.5 text-muted aria-pressed:bg-accent-soft aria-pressed:text-accent"
          >
            {l === "seurat" ? "R · Seurat" : "Python · Scanpy"}
          </button>
        ))}
      </div>
      <code className="order-last w-full min-w-0 overflow-x-auto whitespace-nowrap font-mono text-[12.5px] text-ink sm:order-none sm:w-auto sm:flex-1">
        {code}
      </code>
      {note && <Badge kind="simplified">{note}</Badge>}
      <button
        type="button"
        onClick={copy}
        className="ml-auto flex-none cursor-pointer rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-[11px] sm:ml-0"
      >
        {status === "copied" ? "copied" : status === "failed" ? "select & copy" : "copy"}
      </button>
    </div>
  );
}
