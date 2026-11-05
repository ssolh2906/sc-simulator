"use client";

import { useSize } from "@/hooks/useSize";
import { TooltipBox, useTooltip } from "./Tooltip";

export type HBar = { label: string; value: number; color: string; text: string; tip?: string };

/** Horizontal bars on a 0–1 scale (agreement, shares). */
export function HBars({ rows, ariaLabel, labelWidth = 120 }: { rows: HBar[]; ariaLabel: string; labelWidth?: number }) {
  const [ref, { width }] = useSize<HTMLDivElement>();
  const [tipRef, tip] = useTooltip();
  const rh = 22;
  const height = rows.length * rh + 4;
  const right = 48;
  const W = Math.max(width - labelWidth - right, 10);
  return (
    <div ref={ref} style={{ minHeight: height }}>
      {width > 0 && (
        <svg className="chart" width={width} height={height} role="img" aria-label={ariaLabel}>
          {rows.map((r, i) => (
            <g key={r.label} {...tip.bind(r.tip ?? `${r.label} · ${r.text}`)}>
              <text x={labelWidth - 8} y={i * rh + 15} textAnchor="end">
                {r.label}
              </text>
              <rect x={labelWidth} y={i * rh + 4} width={W} height={rh - 8} rx={3} fill="var(--surface-2)" />
              <rect x={labelWidth} y={i * rh + 4} width={Math.max(W * r.value, 2)} height={rh - 8} rx={3} fill={r.color} />
              <text x={labelWidth + W + 6} y={i * rh + 15} fill="var(--ink)" fontWeight={600}>
                {r.text}
              </text>
            </g>
          ))}
        </svg>
      )}
      <TooltipBox ref={tipRef} />
    </div>
  );
}
