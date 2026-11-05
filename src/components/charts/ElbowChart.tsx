"use client";

import type { KeyboardEvent } from "react";
import { useSize } from "@/hooks/useSize";
import { TooltipBox, useTooltip } from "./Tooltip";

type Props = { variance: number[]; selected: number; onSelect: (n: number) => void; height?: number };

/** Elbow plot. Click a bar (or use arrow keys) to keep PCs 1..n. */
export function ElbowChart({ variance, selected, onSelect, height = 220 }: Props) {
  const [ref, { width }] = useSize<HTMLDivElement>();
  const [tipRef, tip] = useTooltip();
  const l = 34;
  const b = 30;
  const t = 12;
  const max = Math.ceil(Math.max(...variance) / 5) * 5;
  const bw = (width - l - 6) / variance.length;
  const Y = (v: number) => height - b - (v / max) * (height - b - t);
  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 5 : 1;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") onSelect(Math.min(variance.length, selected + step));
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") onSelect(Math.max(1, selected - step));
    else return;
    e.preventDefault();
  };
  return (
    <div
      ref={ref}
      tabIndex={0}
      role="slider"
      aria-label="Number of PCs to keep"
      aria-valuemin={1}
      aria-valuemax={variance.length}
      aria-valuenow={selected}
      onKeyDown={onKey}
      className="rounded-md"
      style={{ minHeight: height }}
    >
      {width > 0 && (
        <svg className="chart" width={width} height={height} aria-hidden>
          {[0, 5, 10, 15].filter((v) => v <= max).map((v) => (
            <g key={v}>
              <line x1={l} x2={width} y1={Y(v)} y2={Y(v)} stroke="var(--line)" />
              <text x={l - 5} y={Y(v) + 4} textAnchor="end" fill="var(--muted)">
                {v}%
              </text>
            </g>
          ))}
          {variance.map((v, i) => (
            <g key={i} className="cursor-pointer" onClick={() => onSelect(i + 1)} {...tip.bind(`PC${i + 1} · ${v}% of variance`)}>
              <rect x={l + i * bw} y={t} width={bw} height={height - b - t} fill="transparent" />
              <rect
                x={l + i * bw + bw * 0.12}
                y={Y(v)}
                width={bw * 0.76}
                height={height - b - Y(v)}
                rx={Math.min(3, bw / 4)}
                fill={i < selected ? "var(--accent)" : "var(--line)"}
              />
            </g>
          ))}
          {[1, 10, 20, 30, 40, 50].filter((n) => n <= variance.length).map((n) => (
            <text key={n} x={l + (n - 0.5) * bw} y={height - b + 14} textAnchor="middle" fill="var(--muted)" fontSize={10}>
              {n}
            </text>
          ))}
          <text x={l + (width - l) / 2} y={height - 3} textAnchor="middle" fill="var(--muted)">
            PC
          </text>
          <text x={l + 10.5 * bw} y={Y(variance[9]) - 34} fill="var(--ink)" fontWeight={600}>
            ← elbow (~10)
          </text>
        </svg>
      )}
      <TooltipBox ref={tipRef} />
    </div>
  );
}
