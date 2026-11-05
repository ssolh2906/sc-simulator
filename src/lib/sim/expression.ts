import { CELL_TYPES, JUNK_TYPES, TYPE_INDEX } from "@/content/cellTypes";
import { GENE_INDEX, GENES, OFF_SPEC, type ExprSpec, type GeneDef, type TrajProfile } from "@/content/genes";
import type { Cell } from "./cells";
import { hash01 } from "./rng";
import { getSamples } from "./samples";

const CD14 = TYPE_INDEX.cd14;

function typeKey(type: number): string {
  return type < CELL_TYPES.length ? CELL_TYPES[type].key : JUNK_TYPES[type - CELL_TYPES.length].key;
}

function baseSpec(g: GeneDef, type: number): ExprSpec {
  const byType = g.byType as Record<string, ExprSpec> | undefined;
  return byType?.[typeKey(type)] ?? g.base ?? OFF_SPEC;
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/** Relative level (0–1) of a trajectory gene at latent time t. */
export function trajLevel(p: TrajProfile, t: number): number {
  if (p.kind === "loss") return 1 - sigmoid((t - p.at) / 0.05);
  return sigmoid((t - p.on) / 0.045) * Math.exp(-Math.max(0, t - p.peak) / p.decay);
}

/** Condition effects (Fig 2): applied per sample, mostly inside CD14 Mono. */
function conditionSpec(g: GeneDef, gi: number, cell: Cell, [m, p]: ExprSpec): ExprSpec {
  const s = getSamples()[cell.sample];
  const covid = s.group !== "healthy";
  switch (g.module) {
    case "hla2":
      return cell.type === CD14 ? [m * s.hlaFactor, p * (0.85 + 0.15 * s.hlaFactor)] : [m, p];
    case "hla1": {
      // Small random shifts per sample and gene: no consistent direction.
      const jitter = 1 + (hash01(gi * 31 + s.index, 7) - 0.5) * 0.14;
      return cell.type === CD14 ? [m * jitter, p] : [m, p];
    }
    case "hlaEF":
      return cell.type === CD14 && covid ? [m * 0.9, p] : [m, p];
    case "isg":
      return [m * s.isgFactor, Math.min(0.95, p * Math.pow(s.isgFactor, 1.2))];
    case "ifi27":
      return cell.type === CD14 && s.ifi27Up ? [2.2, 0.7] : [m, p];
    default:
      return [m, p];
  }
}

/** Expression spec for one cell and gene, after trajectory and condition effects. */
export function cellSpec(cell: Cell, gi: number): ExprSpec {
  const g = GENES[gi];
  let spec = baseSpec(g, cell.type);
  if (g.traj && !Number.isNaN(cell.t)) {
    const lvl = trajLevel(g.traj, cell.t);
    spec = [g.traj.max * lvl, 0.04 + 0.9 * lvl];
  }
  return g.module ? conditionSpec(g, gi, cell, spec) : spec;
}

/**
 * Normalized log-expression of one gene in one cell. A hash of (cell, gene)
 * decides on/off and magnitude, so values are stable without a stored matrix.
 */
export function expr(cell: Cell, gi: number): number {
  const [m, p] = cellSpec(cell, gi);
  if (hash01(cell.id, gi * 2 + 1) >= p) return 0;
  return m * (0.55 + 0.9 * hash01(cell.id, gi * 2 + 2));
}

export const geneIndex = (name: string): number => {
  const i = GENE_INDEX[name];
  if (i === undefined) throw new Error(`Unknown gene: ${name}`);
  return i;
};

export type DotStat = { avg: number; pct: number };

/** Dot-plot statistics: average expression and % expressing per group of cells. */
export function dotStats(cells: Cell[], gene: string): DotStat {
  const gi = geneIndex(gene);
  let sum = 0;
  let on = 0;
  for (const c of cells) {
    const v = expr(c, gi);
    sum += v;
    if (v > 0) on++;
  }
  const n = Math.max(cells.length, 1);
  return { avg: sum / n, pct: on / n };
}
