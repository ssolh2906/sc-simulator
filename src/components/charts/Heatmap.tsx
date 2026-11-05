"use client";

import { useSize } from "@/hooks/useSize";
import { TooltipBox, useTooltip } from "./Tooltip";

export type HeatCol = { key: string; label: string; group: string; mark?: boolean };

/** Walkthrough highlight. Leaving out rows or cols means all of them. */
export type HeatFocus = { rows?: string[]; cols?: string[]; sigOnly?: boolean };
const FADED = 0.12;

type Props = {
  rows: string[];
  cols: HeatCol[];
  value: (row: string, col: string) => number;
  sig?: (row: string, col: string) => boolean;
  /** Color saturates at ±limit. */
  limit?: number;
  focus?: HeatFocus;
  ariaLabel: string;
};

const fill = (v: number, limit: number) => {
  const pct = Math.min(1, Math.abs(v) / limit) * 100;
  return `color-mix(in oklab, var(${v >= 0 ? "--up" : "--down"}) ${pct.toFixed(0)}%, var(--surface-2))`;
};

/** Diverging heatmap (log2FC). A dot marks significant cells. */
export function Heatmap({ rows, cols, value, sig, limit = 2.5, focus, ariaLabel }: Props) {
  const [ref, { width }] = useSize<HTMLDivElement>();
  const [tipRef, tip] = useTooltip();
  const l = 72;
  const t = 40;
  const ch = 20;
  const height = t + rows.length * ch + 30;
  const cw = Math.min(56, (width - l - 4) / Math.max(cols.length, 1));
  const groups = [...new Set(cols.map((c) => c.group))];
  const rowOpacity = (r: string) => (focus?.rows && !focus.rows.includes(r) ? FADED : 1);
  const colOpacity = (key: string) => (focus?.cols && !focus.cols.includes(key) ? FADED : 1);
  return (
    <div ref={ref} style={{ minHeight: height }}>
      {width > 0 && (
        <svg className="chart" width={width} height={height} role="img" aria-label={ariaLabel}>
          {groups.map((g) => {
            const idx = cols.map((c, i) => (c.group === g ? i : -1)).filter((i) => i >= 0);
            const x0 = l + idx[0] * cw;
            const x1 = l + (idx[idx.length - 1] + 1) * cw;
            return (
              <g key={g}>
                <text x={(x0 + x1) / 2} y={12} textAnchor="middle" fill="var(--ink)" fontWeight={600}>
                  {g}
                </text>
                <line x1={x0 + 2} x2={x1 - 2} y1={17} y2={17} stroke="var(--line)" strokeWidth={2} />
              </g>
            );
          })}
          {cols.map((c, i) => (
            <text key={c.key} x={l + i * cw + cw / 2} y={t - 8} textAnchor="middle" fill={c.mark ? "var(--warn)" : "var(--ink-2)"} fontWeight={c.mark ? 600 : 400} opacity={colOpacity(c.key)}>
              {c.label}
              {c.mark ? "*" : ""}
            </text>
          ))}
          {rows.map((r, ri) => (
            <g key={r}>
              <text x={l - 6} y={t + ri * ch + 14} textAnchor="end" opacity={rowOpacity(r)}>
                {r}
              </text>
              {cols.map((c, ci) => {
                const v = value(r, c.key);
                return (
                  <g key={c.key} opacity={focus?.sigOnly && !sig?.(r, c.key) ? FADED : Math.min(rowOpacity(r), colOpacity(c.key))} {...tip.bind(`${r} · ${c.label} · log2FC ${v > 0 ? "+" : ""}${v.toFixed(2)}${sig?.(r, c.key) ? " · significant" : ""}`)}>
                    <rect x={l + ci * cw + 1} y={t + ri * ch + 1} width={cw - 2} height={ch - 2} rx={3} fill={fill(v, limit)} />
                    {sig?.(r, c.key) && <circle cx={l + ci * cw + cw / 2} cy={t + ri * ch + ch / 2} r={2.2} fill="var(--ink)" />}
                  </g>
                );
              })}
            </g>
          ))}
          <g transform={`translate(${l},${height - 18})`}>
            {[-limit, -limit / 2, 0, limit / 2, limit].map((v, i) => (
              <g key={v}>
                <rect x={i * 30} y={0} width={28} height={10} rx={2} fill={fill(v, limit)} />
                <text x={i * 30 + 14} y={22} textAnchor="middle" fontSize={10} fill="var(--muted)">
                  {v > 0 ? `+${v}` : v}
                </text>
              </g>
            ))}
            <circle cx={5 * 30 + 12} cy={5} r={2.2} fill="var(--ink)" />
            <text x={5 * 30 + 20} y={9} fontSize={10.5} fill="var(--muted)">
              = significant
            </text>
          </g>
        </svg>
      )}
      <TooltipBox ref={tipRef} />
    </div>
  );
}
