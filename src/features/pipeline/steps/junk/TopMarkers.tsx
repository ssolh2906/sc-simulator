"use client";

import { isMtOrRibo, topMarkers } from "@/lib/sim/annotation";

/** Each cluster's top genes, with MT-/RP- genes highlighted. */
export function TopMarkers({ ids, flagged }: { ids: number[]; flagged: number[] }) {
  return (
    <div>
      <p className="mb-1.5 font-mono text-[11.5px] text-muted">Top marker genes per cluster (FindAllMarkers, only.pos)</p>
      <ul className="grid gap-x-4 gap-y-0.5 font-mono text-[12px] sm:grid-cols-2">
        {ids.map((id) => {
          const genes = topMarkers(id);
          const share = genes.length ? genes.filter(isMtOrRibo).length / genes.length : 0;
          return (
            <li key={id} className={`flex gap-2 rounded px-1 ${flagged.includes(id) ? "bg-surface-2" : ""}`}>
              <b className="w-7 flex-none text-right text-ink">{id}</b>
              <span className="min-w-0 flex-1 truncate">
                {genes.map((g, i) => (
                  <span key={g} className={isMtOrRibo(g) ? "font-semibold text-warn" : "text-ink-2"}>
                    {i ? ", " : ""}
                    {g}
                  </span>
                ))}
              </span>
              <span className="flex-none text-muted">{Math.round(share * 100)}% MT/RP</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
