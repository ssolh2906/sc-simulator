"use client";

import { quantile } from "@/lib/sim/stats";
import { useSize } from "@/hooks/useSize";
import { niceTicks } from "./axes";
import { TooltipBox, useTooltip } from "./Tooltip";

export type BoxGroup = { name: string; color: string; values: { label: string; value: number }[] };

/** Walkthrough highlight: one part of the plot, optionally for one group or sample. */
export type BoxFocus = { part: "dots" | "box" | "note"; group?: string; sample?: string };
const FADED = 0.12;

type Props = {
  groups: BoxGroup[];
  yFormat?: (v: number) => string;
  yLabel?: string;
  yDomain?: [number, number];
  /** Text above each group, e.g. a p-value vs Healthy. */
  notes?: (string | null)[];
  /** Ring these points (e.g. ISG-low samples). */
  ring?: (label: string) => boolean;
  height?: number;
  focus?: BoxFocus;
  ariaLabel: string;
};

/** One dot per sample, with a box for the quartiles. Replicates = samples. */
export function BoxDotPlot({ groups, yFormat = String, yLabel, yDomain, notes, ring, height = 230, focus, ariaLabel }: Props) {
  const [ref, { width }] = useSize<HTMLDivElement>();
  const [tipRef, tip] = useTooltip();
  const all = groups.flatMap((g) => g.values.map((v) => v.value));
  const lo = yDomain?.[0] ?? Math.min(0, ...all);
  const hi = yDomain?.[1] ?? Math.max(...all, 1e-6) * 1.15;
  const l = 54;
  const t = 22;
  const b = 30;
  const Y = (v: number) => height - b - ((v - lo) / (hi - lo || 1)) * (height - b - t);
  const slot = (width - l - 8) / Math.max(groups.length, 1);
  const bw = Math.min(64, slot * 0.5);
  return (
    <div ref={ref} style={{ minHeight: height }}>
      {width > 0 && (
        <svg className="chart" width={width} height={height} role="img" aria-label={ariaLabel}>
          {niceTicks(lo, hi, 4).map((v) => (
            <g key={v}>
              <line x1={l} x2={width} y1={Y(v)} y2={Y(v)} stroke="var(--line)" />
              <text x={l - 6} y={Y(v) + 4} textAnchor="end" fill="var(--muted)">
                {yFormat(v)}
              </text>
            </g>
          ))}
          {yLabel && (
            <text transform={`translate(11,${t + (height - b - t) / 2}) rotate(-90)`} textAnchor="middle" fill="var(--muted)">
              {yLabel}
            </text>
          )}
          {groups.map((g, gi) => {
            const cx = l + slot * gi + slot / 2;
            const vals = g.values.map((v) => v.value);
            const [q1, q2, q3] = [0.25, 0.5, 0.75].map((q) => quantile(vals, q));
            const inGroup = !focus?.group || focus.group === g.name;
            const partOpacity = (part: BoxFocus["part"]) => (!focus || (focus.part === part && inGroup) ? 1 : FADED);
            return (
              <g key={g.name}>
                {vals.length > 0 && (
                  <g opacity={partOpacity("box")}>
                    <line x1={cx} x2={cx} y1={Y(Math.min(...vals))} y2={Y(Math.max(...vals))} stroke={g.color} strokeWidth={1.5} />
                    <rect x={cx - bw / 2} y={Y(q3)} width={bw} height={Math.max(Y(q1) - Y(q3), 1)} rx={4} fill={`color-mix(in oklab, ${g.color} 16%, var(--surface))`} stroke={g.color} strokeWidth={1.5} />
                    <line x1={cx - bw / 2} x2={cx + bw / 2} y1={Y(q2)} y2={Y(q2)} stroke={g.color} strokeWidth={2.5} />
                  </g>
                )}
                {g.values.map((v, i) => {
                  const jitter = (((i * 0.618) % 1) - 0.5) * bw * 0.9;
                  return (
                    <circle
                      key={v.label}
                      cx={cx + jitter}
                      cy={Y(v.value)}
                      r={5}
                      opacity={focus?.sample && focus.sample !== v.label ? FADED : partOpacity("dots")}
                      fill={g.color}
                      stroke={ring?.(v.label) ? "var(--ink)" : "var(--surface)"}
                      strokeWidth={ring?.(v.label) ? 2 : 1.5}
                      {...tip.bind(`${v.label} · ${g.name} · ${yFormat(v.value)}`)}
                    />
                  );
                })}
                <text x={cx} y={height - b + 16} textAnchor="middle" fill="var(--ink)" fontWeight={600} opacity={inGroup ? 1 : FADED}>
                  {g.name}
                  <tspan fill="var(--muted)" fontWeight={400}>{` n=${g.values.length}`}</tspan>
                </text>
                {notes?.[gi] && (
                  <text x={cx} y={12} textAnchor="middle" fill="var(--ink)" opacity={partOpacity("note")}>
                    {notes[gi]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      <TooltipBox ref={tipRef} />
    </div>
  );
}
