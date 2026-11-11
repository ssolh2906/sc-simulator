"use client";

import { ChartFrame } from "@/components/charts/ChartFrame";
import { HBars } from "@/components/charts/HBars";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { Term } from "@/components/ui/Term";
import { pct } from "@/lib/format";
import { maturityCheck, singleRAgreement, type RefMatch } from "@/lib/sim/annotation";

/** SingleR vs the reference-table labels, for the clusters the table could name. */
export function SingleRPanel({ known }: { known: RefMatch[] }) {
  const ids = new Set(known.map((m) => m.cluster));
  const rows = singleRAgreement().filter((r) => ids.has(r.cluster));
  return (
    <ChartFrame
      title={<><Term k="SingleR" /> agreement with the table labels</>}
      caption="Low agreement is a clue, not an error: references can lack rare states like γδ T, so markers decide."
    >
      <HBars
        ariaLabel="Share of cells where SingleR agrees with the reference-table label"
        rows={rows.map((r) => ({
          label: r.label,
          value: r.agree,
          color: r.agree >= 0.8 ? "var(--good)" : "var(--warn)",
          text: pct(r.agree, 0),
          tip: `${r.label} · ${pct(r.agree, 0)} agree · otherwise called "${r.alt}"`,
        }))}
      />
    </ChartFrame>
  );
}

type UnknownProps = { cluster: number; named: boolean; onName: () => void };

/** SingleR points to a lineage; maturity markers then decide the state. */
export function UnknownCheck({ cluster, named, onName }: UnknownProps) {
  const genes = maturityCheck(cluster);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-warn/60 bg-surface-2 px-3 py-3">
      <p className="text-sm text-ink">
        <b>cluster {cluster}</b> · SingleR&apos;s best guess: <b>Neutrophil</b>. Your PBMC table had no neutrophils, and
        SingleR&apos;s reference only has <i>mature</i> ones. Is this cluster really mature?
      </p>
      <ChartFrame title={`Maturity markers · % of cluster ${cluster} cells expressing`}>
        <HBars
          ariaLabel={`Granule and mature-neutrophil genes in cluster ${cluster}`}
          rows={genes.map((g) => ({
            label: `${g.gene} · ${g.kind === "granule" ? "granule" : "mature"}`,
            value: g.pct,
            color: g.kind === "granule" ? "var(--ct-neut)" : "var(--muted)",
            text: pct(g.pct, 0),
            tip: g.kind === "granule" ? `${g.gene}: made while neutrophils develop` : `${g.gene}: switched on in mature neutrophils`,
          }))}
        />
      </ChartFrame>
      <p className="text-sm text-ink-2">
        Granule genes are on, mature markers are off: neutrophils that have not finished maturing. They normally stay in
        the bone marrow.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {named ? (
          <StatusChip ok>cluster {cluster} named Dev. Neutrophil</StatusChip>
        ) : (
          <Button onClick={onName}>Name cluster {cluster}: Dev. Neutrophil</Button>
        )}
      </div>
    </div>
  );
}
