"use client";

import { useSize } from "@/hooks/useSize";
import { linear, type Tick } from "./axes";

export type Series = { name: string; color: string; points: { x: number; y: number }[]; dashed?: boolean };

type Props = {
  series: Series[];
  xDomain: [number, number];
  yDomain: [number, number];
  xTicks: Tick[];
  yTicks: Tick[];
  xLabel?: string;
  yLabel?: string;
  /** Vertical marker (e.g. the latent-time slider). */
  marker?: number;
  height?: number;
  ariaLabel: string;
};

export function LineChart({ series, xDomain, yDomain, xTicks, yTicks, xLabel, yLabel, marker, height = 220, ariaLabel }: Props) {
  const [ref, { width }] = useSize<HTMLDivElement>();
  const l = 46;
  const b = 36;
  const t = 10;
  const r = 10;
  const X = linear(xDomain, [l, width - r]);
  const Y = linear(yDomain, [height - b, t]);
  return (
    <div ref={ref} style={{ minHeight: height }}>
      {width > 0 && (
        <svg className="chart" width={width} height={height} role="img" aria-label={ariaLabel}>
          {yTicks.map((tk) => (
            <g key={tk.v}>
              <line x1={l} x2={width - r} y1={Y(tk.v)} y2={Y(tk.v)} stroke="var(--line)" />
              <text x={l - 6} y={Y(tk.v) + 4} textAnchor="end" fill="var(--muted)">
                {tk.label ?? tk.v}
              </text>
            </g>
          ))}
          {xTicks.map((tk) => (
            <text key={tk.v} x={X(tk.v)} y={height - b + 15} textAnchor="middle" fill="var(--muted)">
              {tk.label ?? tk.v}
            </text>
          ))}
          {xLabel && (
            <text x={l + (width - l - r) / 2} y={height - 4} textAnchor="middle" fill="var(--muted)">
              {xLabel}
            </text>
          )}
          {yLabel && (
            <text transform={`translate(11,${t + (height - b - t) / 2}) rotate(-90)`} textAnchor="middle" fill="var(--muted)">
              {yLabel}
            </text>
          )}
          {series.map((s) => (
            <path
              key={s.name}
              d={s.points.map((p, i) => `${i ? "L" : "M"}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join("")}
              fill="none"
              stroke={s.color}
              strokeWidth={2.2}
              strokeDasharray={s.dashed ? "5 4" : undefined}
            />
          ))}
          {marker !== undefined && (
            <line x1={X(marker)} x2={X(marker)} y1={t} y2={height - b} stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="3 3" />
          )}
        </svg>
      )}
    </div>
  );
}
