"use client";

import { CELL_TYPES, TYPE_INDEX } from "@/content/cellTypes";
import { cleanCells } from "@/lib/sim/clusters";
import { expr, geneIndex } from "@/lib/sim/expression";
import { cssMix } from "@/lib/color";

const GENES = ["CD3E", "NKG7", "MS4A1", "JCHAIN", "LYZ", "LTF", "HLA-DRA", "MT-CO1"];
const PICK = ["cd4t", "cd8t", "nk", "b", "pb", "cd14", "cd14", "cd16", "neut", "cd4t", "pdc", "b"] as const;

/** Integer-like UMI counts from the expression model, for a 8 × 12 corner of the matrix. */
function cornerOfMatrix() {
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
  const m = cornerOfMatrix();
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-0.5 font-mono text-[11.5px] tabular-nums">
        <thead>
          <tr>
            <th />
            {PICK.map((_, i) => (
              <th key={i} scope="col" className="px-1.5 text-right font-medium text-muted">
                c{i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GENES.map((g, gi) => (
            <tr key={g}>
              <th scope="row" className="px-1.5 text-right font-medium whitespace-nowrap text-muted">
                {g}
              </th>
              {m[gi].map((n, ci) => (
                <td
                  key={ci}
                  title={`${g} in c${ci + 1} (${CELL_TYPES[TYPE_INDEX[PICK[ci]]].name}) = ${n}`}
                  className="h-[26px] w-[34px] rounded text-center"
                  style={{
                    background: n ? cssMix("--seq1", 18 + Math.min(n, 30) * 2.7, "--seq0") : "var(--surface-2)",
                    color: n > 14 ? "var(--surface)" : n ? "var(--ink)" : "var(--muted)",
                  }}
                >
                  {n}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
