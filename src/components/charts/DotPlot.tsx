"use client";

import type { KeyboardEvent } from "react";
import { useSize } from "@/hooks/useSize";
import { TooltipBox, useTooltip } from "./Tooltip";

export type DotCol = { id: number; label: string; flagged?: boolean };
export type DotValue = { avg: number; pct: number };
/** Walkthrough highlight. Leaving out genes or cols means all of them. */
export type DotFocus = { genes?: string[]; cols?: number[] };
const FADED = 0.12;

type Props = {
  genes: string[];
  cols: DotCol[];
  value: (gene: string, col: number) => DotValue;
  maxAvg: number;
  selected?: string;
  onSelect?: (gene: string) => void;
  focus?: DotFocus;
  ariaLabel: string;
};

/** Genes × clusters. Dot size = % expressing, color = average expression. */
export function DotPlot({ genes, cols, value, maxAvg, selected, onSelect, focus, ariaLabel }: Props) {
  const [ref, { width }] = useSize<HTMLDivElement>();
  const [tipRef, tip] = useTooltip();
  const long = cols.some((c) => c.label.length > 3);
  const l = 74;
  const t = long ? 74 : 28;
  const rh = 24;
  const height = t + genes.length * rh + 6;
  const cw = (width - l - 6) / Math.max(cols.length, 1);
  const cx = (k: number) => l + cw * k + cw / 2;
  const colOpacity = (id: number) => (focus?.cols && !focus.cols.includes(id) ? FADED : 1);
  const geneOpacity = (gene: string) => (focus?.genes && !focus.genes.includes(gene) ? FADED : 1);
  const key = (gene: string) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(gene);
    }
  };
  return (
    <div ref={ref} style={{ minHeight: height }}>
      {width > 0 && (
        <svg className="chart" width={width} height={height} role="img" aria-label={ariaLabel}>
          {cols.map((c, k) =>
            c.flagged ? (
              <rect key={`f${c.id}`} x={cx(k) - cw / 2 + 1} y={4} width={cw - 2} height={height - 6} rx={6} fill="color-mix(in oklab, var(--warn) 14%, transparent)" />
            ) : null,
          )}
          {cols.map((c, k) =>
            long ? (
              <text key={c.id} transform={`translate(${cx(k) + 3},${t - 10}) rotate(-45)`} fill="var(--ink)" fontWeight={600} opacity={colOpacity(c.id)}>
                {c.label}
              </text>
            ) : (
              <text key={c.id} x={cx(k)} y={t - 12} textAnchor="middle" fill="var(--ink)" fontWeight={600} opacity={colOpacity(c.id)}>
                {c.label}
              </text>
            ),
          )}
          {genes.map((gene, gi) => {
            const y = t + gi * rh + rh / 2;
            const sel = gene === selected;
            const interactive = Boolean(onSelect);
            return (
              <g
                key={gene}
                role={interactive ? "button" : undefined}
                tabIndex={interactive ? 0 : undefined}
                aria-pressed={interactive ? sel : undefined}
                aria-label={interactive ? `Show ${gene} on the map` : undefined}
                onClick={interactive ? () => onSelect?.(gene) : undefined}
                onKeyDown={interactive ? key(gene) : undefined}
                className={interactive ? "cursor-pointer outline-none [&:focus-visible>rect]:stroke-accent" : undefined}
              >
                <rect x={0} y={y - rh / 2 + 1} width={width} height={rh - 2} rx={6} fill={sel ? "var(--accent-soft)" : "transparent"} stroke="transparent" strokeWidth={2} />
                <text x={4} y={y + 4} fill={sel ? "var(--ink)" : undefined} fontWeight={sel ? 600 : 400} opacity={geneOpacity(gene)}>
                  {gene}
                </text>
                {cols.map((c, k) => {
                  const v = value(gene, c.id);
                  const r = 1.2 + Math.min(cw, rh) * 0.42 * v.pct;
                  const shade = 12 + 88 * Math.min(1, v.avg / maxAvg);
                  return (
                    <circle
                      key={c.id}
                      cx={cx(k)}
                      cy={y}
                      r={r}
                      opacity={Math.min(colOpacity(c.id), geneOpacity(gene))}
                      fill={`color-mix(in oklab, var(--seq1) ${shade.toFixed(0)}%, var(--seq0))`}
                      {...tip.bind(`${gene} · ${c.label} · ${Math.round(v.pct * 100)}% cells · avg ${v.avg.toFixed(2)}`)}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      )}
      <TooltipBox ref={tipRef} />
    </div>
  );
}
