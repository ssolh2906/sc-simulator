"use client";

import { GROUPS } from "@/content/cellTypes";
import { getSamples } from "@/lib/sim/samples";
import { useSize } from "@/hooks/useSize";
import { TooltipBox, useTooltip } from "@/components/charts/Tooltip";

/** One person icon per sample, in three rows: Healthy, NonVent, ARDS. */
export function SamplePictogram() {
  const [ref, { width }] = useSize<HTMLDivElement>();
  const [tipRef, tip] = useTooltip();
  const samples = getSamples();
  const rowH = 48;
  const height = GROUPS.length * rowH + 6;
  const gap = Math.min(30, (width - 96) / 6);
  return (
    <div ref={ref} style={{ minHeight: height }}>
      {width > 0 && (
        <svg className="chart" width={width} height={height} role="img" aria-label="6 healthy, 4 NonVent and 4 ARDS samples">
          {GROUPS.map((g, gi) => {
            const y = gi * rowH + 28;
            const ids = samples.filter((s) => s.group === g.key);
            return (
              <g key={g.key}>
                <text x={0} y={y + 4} fill="var(--ink)" fontWeight={600}>
                  {g.name}
                </text>
                {ids.map((s, i) => {
                  const x = 88 + i * gap;
                  return (
                    <g key={s.id} {...tip.bind(`${s.id} · ${g.name}`)}>
                      <circle cx={x} cy={y - 8} r={6} fill={g.color} />
                      <path d={`M${x - 9} ${y + 12} q9 -14 18 0`} fill={g.color} />
                    </g>
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
