"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { usePipeline } from "@/features/pipeline/PipelineProvider";
import { STEPS, stepHref } from "@/features/pipeline/registry";
import { ThemeToggle } from "./ThemeToggle";

/** Vertical step list on desktop; horizontal chips under 860px. */
export function StepRail() {
  const { slug } = useParams<{ slug: string }>();
  const { done } = usePipeline();
  const list = useRef<HTMLOListElement>(null);

  // On phones the rail is a horizontal strip: keep the current step in view.
  useEffect(() => {
    const ol = list.current;
    const cur = ol?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!ol || !cur || ol.scrollWidth <= ol.clientWidth) return;
    ol.scrollLeft = cur.offsetLeft - ol.clientWidth / 2 + cur.offsetWidth / 2;
  }, [slug]);

  return (
    <aside className="rail:sticky rail:top-5">
      <Link href="/" className="block">
        <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted">Single-cell Lab</span>
        <b className="mt-0.5 block text-[19px] leading-tight">COVID-19 blood immune cells</b>
      </Link>
      <nav aria-label="Pipeline steps">
        <ol ref={list} className="relative mt-2.5 flex gap-1 overflow-x-auto pb-1 rail:mt-4 rail:flex-col rail:gap-0.5 rail:overflow-visible rail:pb-0 rail:before:absolute rail:before:top-2 rail:before:bottom-2 rail:before:left-[13px] rail:before:w-0.5 rail:before:bg-line">
          {STEPS.map((s, i) => {
            const current = s.slug === slug;
            const isDone = done.includes(s.slug) && !current;
            return (
              <li key={s.slug} className="flex-none">
                <Link
                  href={stepHref(s.slug)}
                  aria-current={current ? "step" : undefined}
                  className="relative flex items-center gap-2.5 rounded-full border border-line bg-surface py-1 pr-2 pl-1 rail:w-full rail:rounded-lg rail:border-0 rail:bg-transparent rail:py-[5px] rail:pr-2 rail:pl-0"
                >
                  <span
                    className={`z-[1] grid size-[22px] flex-none place-items-center rounded-full border-2 font-mono text-[10px] font-semibold rail:size-7 rail:text-[11px] ${
                      current
                        ? "border-accent bg-accent text-accent-ink"
                        : isDone
                          ? "border-accent bg-surface text-accent"
                          : "border-line bg-surface text-muted"
                    }`}
                  >
                    {isDone ? <span aria-label="done">✓</span> : i}
                  </span>
                  <span className={`whitespace-nowrap text-[12.5px] leading-tight rail:text-[13.5px] ${current ? "font-semibold text-ink" : "text-ink-2"}`}>
                    {s.rail}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="mt-2 rail:mt-5">
        <ThemeToggle />
      </div>
    </aside>
  );
}
