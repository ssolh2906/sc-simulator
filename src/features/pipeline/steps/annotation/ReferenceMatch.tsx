"use client";

import { StatusChip } from "@/components/ui/StatusChip";
import { CELL_TYPES, type CellTypeKey } from "@/content/cellTypes";
import { pct } from "@/lib/format";
import { PBMC_REFERENCE, topMarkers, type RefMatch } from "@/lib/sim/annotation";

const byKey = new Map(CELL_TYPES.map((t) => [t.key, t]));
const typeOf = (k: CellTypeKey) => byKey.get(k)!;

function Swatch({ token }: { token: string }) {
  return <span aria-hidden className="mr-1.5 inline-block size-2 flex-none rounded-full" style={{ background: `var(${token})` }} />;
}

type TableProps = {
  /** Row being matched right now. */
  active?: CellTypeKey | null;
  /** The current cluster fits no row: the whole table is marked. */
  noFit?: boolean;
};

/** The known PBMC types and their markers. What Find markers compares each cluster against. */
export function ReferenceTable({ active, noFit }: TableProps) {
  return (
    <div
      className={`overflow-x-auto rounded-xl border bg-surface-2 px-3 py-2.5 transition-colors ${noFit ? "border-warn" : "border-line"}`}
    >
      <p className="mb-1.5 text-[13px] text-ink-2">
        <b className="text-ink">Known PBMC cell types.</b> Most need two genes: CD3E says &ldquo;T cell&rdquo;, the second gene says which kind.
      </p>
      <table className="w-full text-left text-[13px]">
        <thead className="font-mono text-[11px] uppercase tracking-wider text-muted">
          <tr>
            <th className="py-1 pr-3 font-medium">Cell type</th>
            <th className="py-1 pr-3 font-medium">High</th>
            <th className="py-1 font-medium">Low</th>
          </tr>
        </thead>
        <tbody>
          {PBMC_REFERENCE.map((r) => (
            <tr key={r.key} className={`border-t border-line transition-colors ${r.key === active ? "bg-accent-soft" : ""}`}>
              <td className="py-1 pr-3 whitespace-nowrap">
                <Swatch token={typeOf(r.key).token} />
                {typeOf(r.key).name}
              </td>
              <td className="py-1 pr-3 font-mono text-[12px]">{r.high.join(" + ")}</td>
              <td className="py-1 font-mono text-[12px] text-muted">{r.low?.join(", ") ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {noFit && <p className="mt-1.5 text-[13px] font-medium text-warn">No row fits this cluster.</p>}
    </div>
  );
}

const evidenceText = (m: RefMatch) =>
  m.evidence.map((e) => `${e.gene} ${pct(e.pct, 0)}${e.want === "low" ? " (should be low)" : ""}`).join(" · ");

/** One sentence for the cluster being matched now: the genes checked and the verdict. */
export function MatchCaption({ m }: { m: RefMatch | null }) {
  return (
    <p aria-live="polite" className="min-h-6 font-mono text-[12.5px] text-ink">
      {m &&
        (m.key ? (
          <>
            <b>cluster {m.cluster}</b> · {evidenceText(m)} → <b>{typeOf(m.key).name}</b>
            {!m.confident && <span className="text-warn"> (close to {typeOf(m.runnerUp).name} too)</span>}
          </>
        ) : (
          <>
            <b>cluster {m.cluster}</b> · closest is {typeOf(m.runnerUp).name}: {evidenceText(m)} →{" "}
            <b className="text-warn">too weak, unknown</b>
          </>
        ))}
    </p>
  );
}

/** One row per revealed cluster: its top genes and what the reference says it is, or that nothing fits. */
export function MatchList({ rows, current }: { rows: RefMatch[]; current?: number }) {
  return (
    <div>
      <p className="mb-1.5 font-mono text-[11.5px] text-muted">Top marker genes per cluster → best reference match</p>
      <ul className="flex flex-col gap-1">
        {rows.map((r) => (
          <li
            key={r.cluster}
            className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-1 text-[13px] ${
              r.key ? (r.cluster === current ? "bg-accent-soft" : "") : "bg-surface-2 ring-1 ring-warn"
            }`}
          >
            <b className="w-[4.5rem] flex-none whitespace-nowrap font-mono text-[12px] text-ink">cluster {r.cluster}</b>
            <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-2">{topMarkers(r.cluster).join(", ")}</span>
            {r.key ? (
              <span className="flex items-center gap-2">
                <span className="flex items-center font-medium text-ink">
                  <Swatch token={typeOf(r.key).token} />
                  {typeOf(r.key).name}
                </span>
                {!r.confident && <StatusChip ok={false}>also fits {typeOf(r.runnerUp).name}</StatusChip>}
              </span>
            ) : (
              <StatusChip ok={false}>Unknown · no known type fits</StatusChip>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
