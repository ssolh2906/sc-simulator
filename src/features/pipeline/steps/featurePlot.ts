import type { Pt } from "@/components/charts/ScatterCanvas";
import type { ThemeColors } from "@/hooks/useThemeColors";
import { mix } from "@/lib/color";
import type { Cell } from "@/lib/sim/cells";
import { expr, geneIndex } from "@/lib/sim/expression";
import { umapPos } from "@/lib/sim/umap";

/** Feature plot points: gray when off, darker with expression; expressing cells drawn last. */
export function featurePoints(cells: Cell[], gene: string, c: ThemeColors, nPcs: number, max = 3.6): Pt[] {
  const gi = geneIndex(gene);
  return cells
    .map((cell) => {
      const v = expr(cell, gi);
      const [x, y] = umapPos(cell, nPcs);
      return {
        x,
        y,
        v,
        color: v ? mix(c["--seq0"], c["--seq1"], 0.25 + (0.75 * v) / max) : c["--seq0"],
        alpha: v ? 0.9 : 0.7,
        r: 2.3,
        tip: `${gene} = ${v.toFixed(2)}`,
      };
    })
    .sort((a, b) => a.v - b.v);
}
