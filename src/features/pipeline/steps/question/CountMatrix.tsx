"use client";

import { useMemo } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { Term } from "@/components/ui/Term";
import { HowToReadButton, useWalkthrough, WalkthroughCaption } from "@/components/ui/Walkthrough";
import { CELL_TYPES, TYPE_INDEX } from "@/content/cellTypes";
import { getDataset } from "@/lib/sim/cells";
import { cleanCells } from "@/lib/sim/clusters";
import { expr, geneIndex } from "@/lib/sim/expression";
import { cssMix } from "@/lib/color";
import { int } from "@/lib/format";

const GENES = ["CD3E", "NKG7", "MS4A1", "JCHAIN", "LYZ", "LTF", "HLA-DRA", "MT-CO1"];
const PICK = ["cd4t", "cd8t", "nk", "b", "pb", "cd14", "cd14", "cd16", "neut", "cd4t", "pdc", "b"] as const;

const LYZ = GENES.indexOf("LYZ");
const CD3E = GENES.indexOf("CD3E");
// c6, c7, c8 are the monocytes in PICK.
const MONOCYTE_COLS = [5, 6, 7];
const C6 = MONOCYTE_COLS[0];

/** What a walkthrough step lights up. Leaving out rows or cols means all of them. */
type Focus = { text: string; rows?: number[]; cols?: number[]; omitted?: boolean };

function walkthroughSteps(m: number[][], totalCells: number): Focus[] {
  return [
    {
      text: `You see 12 example cells and ${GENES.length} marker genes, hand-picked from ${int(totalCells)} cells and ~20k genes.`,
      rows: [],
      cols: [],
      omitted: true,
    },
    { text: "Each row is one gene. Here, LYZ.", rows: [LYZ] },
    { text: "Each column is one cell. Here, c6.", cols: [C6] },
    { text: `${m[LYZ][C6]} LYZ RNA molecules (UMIs) were counted in cell c6.`, rows: [LYZ], cols: [C6] },
    { text: "0 means no molecule was counted. The gene may be off, or it may have been missed.", rows: [CD3E], cols: [C6] },
    {
      text: "A higher number and darker color mean more RNA. LYZ shows up only in these cells, a clue that they are monocytes.",
      rows: [LYZ],
      cols: MONOCYTE_COLS,
    },
  ];
}

/** Integer-like UMI counts from the expression model, for hand-picked cells and marker genes. */
function pickedCounts() {
  const cells = cleanCells();
  const seen = new Map<number, number>();
  const picked = PICK.map((k) => {
    const t = TYPE_INDEX[k];
    const skip = seen.get(t) ?? 0;
    seen.set(t, skip + 1);
    return cells.filter((c) => c.type === t)[skip * 7];
  });
  return GENES.map((g) => picked.map((c) => Math.round(Math.expm1(expr(c, geneIndex(g))) * 0.6)));
}

export function CountMatrix() {
  const m = useMemo(() => pickedCounts(), []);
  const totalCells = getDataset().qcCells.length;
  const steps = useMemo(() => walkthroughSteps(m, totalCells), [m, totalCells]);
  const tour = useWalkthrough(steps.length);
  const focus = tour.step === null ? null : steps[tour.step];

  const headClass = (hit: boolean | undefined) =>
    !focus ? "font-medium text-muted" : hit ? "font-semibold text-accent" : "font-medium text-muted opacity-20";
  const cellClass = (r: number, c: number) => {
    if (!focus) return "";
    const hit = (focus.rows?.includes(r) ?? true) && (focus.cols?.includes(c) ?? true);
    return hit ? "outline-2 outline-accent" : "opacity-20";
  };

  return (
    <ChartFrame
      title={<><Term k="count matrix" /> · 12 example cells × {GENES.length} marker genes</>}
      aside={
        <span className="inline-flex items-center gap-2">
          entry = UMI count
          <HowToReadButton tour={tour} />
        </span>
      }
    >
      <div className="overflow-x-auto p-0.5">
        <table className="border-separate border-spacing-0.5 font-mono text-[11.5px] tabular-nums">
          <thead>
            <tr>
              <th />
              {PICK.map((_, i) => (
                <th key={i} scope="col" className={`px-1.5 text-right ${headClass(focus?.cols?.includes(i))}`}>
                  c{i + 1}
                </th>
              ))}
              {/* The ellipses show this is a sample of a much larger table. */}
              <th scope="col" className={`px-1.5 text-left whitespace-nowrap ${headClass(focus?.omitted)}`}>
                … {int(totalCells)} cells
              </th>
            </tr>
          </thead>
          <tbody>
            {GENES.map((g, gi) => (
              <tr key={g}>
                <th scope="row" className={`px-1.5 text-right whitespace-nowrap ${headClass(focus?.rows?.includes(gi))}`}>
                  {g}
                </th>
                {m[gi].map((n, ci) => (
                  <td
                    key={ci}
                    title={`${g} in c${ci + 1} (${CELL_TYPES[TYPE_INDEX[PICK[ci]]].name}) = ${n}`}
                    className={`h-[26px] w-[34px] rounded text-center ${cellClass(gi, ci)}`}
                    style={{
                      background: n ? cssMix("--seq1", 18 + Math.min(n, 30) * 2.7, "--seq0") : "var(--surface-2)",
                      color: n > 14 ? "var(--surface)" : n ? "var(--ink)" : "var(--muted)",
                    }}
                  >
                    {n}
                  </td>
                ))}
                <td aria-hidden className={`px-1.5 ${headClass(focus?.omitted)}`}>…</td>
              </tr>
            ))}
            <tr>
              <th scope="row" className={`px-1.5 text-right whitespace-nowrap ${headClass(focus?.omitted)}`}>
                ⋮ ~20k genes
              </th>
              {PICK.map((_, i) => (
                <td key={i} aria-hidden className={`text-center ${headClass(focus?.omitted)}`}>⋮</td>
              ))}
              <td aria-hidden className={`px-1.5 ${headClass(focus?.omitted)}`}>⋱</td>
            </tr>
          </tbody>
        </table>
      </div>
      {focus && <WalkthroughCaption tour={tour}>{focus.text}</WalkthroughCaption>}
    </ChartFrame>
  );
}
