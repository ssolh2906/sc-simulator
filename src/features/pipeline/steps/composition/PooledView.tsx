"use client";

import { Bars } from "@/components/charts/Bars";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { Badge } from "@/components/ui/Badge";
import { Chip, ChipRow } from "@/components/ui/Chip";
import { CELL_TYPES, type GROUPS } from "@/content/cellTypes";
import { int, pct, pValue } from "@/lib/format";
import { pooled } from "@/lib/sim/composition";
import { niceTicks } from "@/components/charts/axes";

/** The wrong way: one bar per group from pooled cells, with tiny error bars and tiny p-values. */
export function PooledView({ type, groups }: { type: number; groups: (typeof GROUPS)[number][] }) {
  const { rows, p } = pooled(type);
  const shown = rows.filter((r) => groups.some((g) => g.key === r.group));
  const max = Math.max(...shown.map((r) => r.frac)) * 1.3 || 0.01;
  const name = CELL_TYPES[type].name;
  return (
    <ChartFrame title={<>{name} · all cells pooled per group</>} aside={<Badge kind="wrong">wrong way</Badge>}>
      <Bars
        ariaLabel={`${name} percentage with all cells pooled`}
        bars={shown.map((r) => {
          const g = groups.find((x) => x.key === r.group)!;
          const se = Math.sqrt((r.frac * (1 - r.frac)) / r.total);
          return {
            label: `${g.name}\n${int(r.total)} cells`,
            value: r.frac,
            err: 1.96 * se,
            color: g.color,
            text: pct(r.frac),
            tip: `${g.name} · ${r.count} of ${int(r.total)} cells`,
          };
        })}
        yMax={max}
        yTicks={niceTicks(0, max, 4)}
        yFormat={(v) => pct(v, v > 0 && v < 0.1 ? 1 : 0)}
        height={230}
      />
      <ChipRow>
        <Chip>NonVent vs Healthy: {pValue(p.nonvent)}</Chip>
        <Chip>ARDS vs Healthy: {pValue(p.ards)}</Chip>
        <span className="text-[12.5px] text-warn">Error bars and p-values look far too confident.</span>
      </ChipRow>
    </ChartFrame>
  );
}
