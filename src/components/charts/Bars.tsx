"use client";

import { useSize } from "@/hooks/useSize";
import { TooltipBox, useTooltip } from "./Tooltip";

export type Bar = { label: string; value: number; color: string; err?: number; tip?: string; text?: string };

type Props = {
  bars: Bar[];
  yMax: number;
  yTicks: number[];
  yFormat?: (v: number) => string;
  height?: number;
  ariaLabel: string;
};

/** Vertical bars with optional error bars. Labels may use "\n" for two lines. */
export function Bars({ bars, yMax, yTicks, yFormat = String, height = 180, ariaLabel }: Props) {
  const [ref, { width }] = useSize<HTMLDivElement>();
  const [tipRef, tip] = useTooltip();
  const l = 52;
  const b = 34;
  const t = 18;
  const slot = (width - l - 8) / Math.max(bars.length, 1);
  const bw = Math.min(54, slot * 0.6);
  const Y = (v: number) => height - b - (Math.min(v, yMax) / yMax) * (height - b - t);
  return (
    <div ref={ref} style={{ minHeight: height }}>
      {width > 0 && (
        <svg className="chart" width={width} height={height} role="img" aria-label={ariaLabel}>
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={l} x2={width} y1={Y(v)} y2={Y(v)} stroke="var(--line)" />
              <text x={l - 6} y={Y(v) + 4} textAnchor="end" fill="var(--muted)">
                {yFormat(v)}
              </text>
            </g>
          ))}
          {bars.map((bar, i) => {
            const cx = l + slot * i + slot / 2;
            const y = Y(bar.value);
            return (
              <g key={bar.label} {...tip.bind(bar.tip ?? `${bar.label.replace("\n", " ")} · ${yFormat(bar.value)}`)}>
                <rect x={cx - slot / 2} y={t} width={slot} height={height - b - t} fill="transparent" />
                <rect x={cx - bw / 2} y={y} width={bw} height={Math.max(height - b - y, 1)} rx={4} fill={bar.color} />
                {bar.err !== undefined && (
                  <path
                    d={`M${cx} ${Y(bar.value + bar.err)}V${Y(Math.max(0, bar.value - bar.err))}M${cx - 6} ${Y(bar.value + bar.err)}h12M${cx - 6} ${Y(Math.max(0, bar.value - bar.err))}h12`}
                    stroke="var(--ink)"
                    strokeWidth={1.5}
                  />
                )}
                <text x={cx} y={y - 6} textAnchor="middle" fill="var(--ink)" fontWeight={600}>
                  {bar.text ?? yFormat(bar.value)}
                </text>
                {bar.label.split("\n").map((line, j) => (
                  <text key={j} x={cx} y={height - b + 15 + j * 12} textAnchor="middle">
                    {line}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      )}
      <TooltipBox ref={tipRef} />
    </div>
  );
}
