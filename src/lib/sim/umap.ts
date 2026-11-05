import type { Cell } from "./cells";
import { blurFor } from "./pca";

/** UMAP position, smeared when too few PCs were used. */
export function umapPos(c: Cell, nPcs: number): [number, number] {
  const b = blurFor(nPcs);
  return [c.ux + c.bx * b, c.uy + c.by * b];
}

export function centroid(cells: Cell[], nPcs: number): [number, number] {
  let x = 0;
  let y = 0;
  for (const c of cells) {
    const [px, py] = umapPos(c, nPcs);
    x += px;
    y += py;
  }
  const n = Math.max(cells.length, 1);
  return [x / n, y / n];
}
