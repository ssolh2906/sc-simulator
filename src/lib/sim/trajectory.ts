import { GENES } from "@/content/genes";
import { trajectoryPoint, type Cell } from "./cells";
import { cleanCells } from "./clusters";
import { trajLevel } from "./expression";

let pathCache: Cell[] | null = null;

/** Plasmablasts and developing neutrophils: the cells with a latent time. */
export function trajectoryCells(): Cell[] {
  pathCache ??= cleanCells().filter((c) => !Number.isNaN(c.t));
  return pathCache;
}

export type Arrow = { x: number; y: number; dx: number; dy: number };

/** Direction of travel at latent time t (finite difference along the path). */
function tangent(t: number): [number, number] {
  const a = trajectoryPoint(Math.max(0, t - 0.03));
  const b = trajectoryPoint(Math.min(1, t + 0.03));
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
}

/**
 * Velocity field on a coarse grid, like scVelo's velocity_embedding_grid.
 * Each arrow averages the direction of the cells in its grid square.
 */
export function velocityGrid(cells: Cell[], step = 0.55): Arrow[] {
  const bins = new Map<string, { x: number; y: number; dx: number; dy: number; n: number }>();
  for (const c of cells) {
    const key = `${Math.floor(c.ux / step)},${Math.floor(c.uy / step)}`;
    const [tx, ty] = tangent(c.t);
    const b = bins.get(key) ?? { x: 0, y: 0, dx: 0, dy: 0, n: 0 };
    b.x += c.ux;
    b.y += c.uy;
    b.dx += tx;
    b.dy += ty;
    b.n++;
    bins.set(key, b);
  }
  return [...bins.values()]
    .filter((b) => b.n >= 2)
    .map((b) => {
      const len = Math.hypot(b.dx, b.dy) || 1;
      return { x: b.x / b.n, y: b.y / b.n, dx: b.dx / len, dy: b.dy / len };
    });
}

export const WAVE_GROUPS = [
  { key: "pb", name: "Plasmablast genes", genes: ["CD27", "CD38", "TNFRSF17"], token: "--ct-pb" },
  { key: "primary", name: "Primary granule", genes: ["DEFA3", "ELANE", "MPO"], token: "--ct-cd14" },
  { key: "secondary", name: "Secondary granule", genes: ["CHI3L1", "LCN2", "LTF"], token: "--ct-cd16" },
  { key: "tertiary", name: "Tertiary granule", genes: ["MMP8", "MMP9", "CAMP"], token: "--ct-neut" },
  { key: "tf", name: "CEBPE → CEBPD", genes: ["CEBPE", "CEBPD"], token: "--ct-pdc" },
] as const;

/** Smoothed expression (0–1) of each gene along latent time. */
export function geneWave(gene: string, steps = 60): { t: number; v: number }[] {
  const g = GENES.find((x) => x.name === gene);
  if (!g?.traj) throw new Error(`${gene} has no trajectory profile`);
  const p = g.traj;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return { t, v: trajLevel(p, t) };
  });
}
