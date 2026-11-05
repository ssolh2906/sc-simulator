import { CELL_TYPES, JUNK_MT, JUNK_RIBO, JUNK_TYPES, TYPE_INDEX } from "@/content/cellTypes";
import { clamp, createRng, SEED, type Rng } from "./rng";
import { getSamples } from "./samples";

export type QcKind = "real" | "junk" | "broken" | "rrna" | "multiplet" | "empty";

/** Every droplet in the raw data, including ones QC should remove. */
export type QcCell = {
  id: number;
  sample: number;
  kind: QcKind;
  nCount: number;
  pctMt: number;
  pctRrna: number;
  genesPerUmi: number;
};

/** A cell that passed QC. Real types use 0–10, junk clusters use 11–12. */
export type Cell = {
  id: number;
  sample: number;
  type: number;
  /** UMAP position (final layout). */
  ux: number;
  uy: number;
  /** PC1 / PC2 position. */
  px: number;
  py: number;
  /** Unit noise used to blur islands when too few PCs are used. */
  bx: number;
  by: number;
  /** Latent time on the Plasmablast → Dev. Neutrophil path, NaN otherwise. */
  t: number;
};

export type Dataset = { qcCells: QcCell[]; cells: Cell[] };

const PB = CELL_TYPES[TYPE_INDEX.pb].umap;
const NEUT = CELL_TYPES[TYPE_INDEX.neut].umap;
const BEND: [number, number] = [8.6, -0.3];

/** Quadratic Bézier from the plasmablast island to the dev. neutrophil island. */
export function trajectoryPoint(t: number): [number, number] {
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const c = t * t;
  return [a * PB[0] + b * BEND[0] + c * NEUT[0], a * PB[1] + b * BEND[1] + c * NEUT[1]];
}

/** Redraw until inside [lo, hi] so real cells do not pile up at the QC lines. */
function truncated(draw: () => number, lo: number, hi: number): number {
  for (let i = 0; i < 20; i++) {
    const v = draw();
    if (v >= lo && v <= hi) return v;
  }
  return clamp(draw(), lo, hi);
}

/** Largest-remainder rounding so type counts add up to n exactly. */
function allocate(n: number, props: number[]): number[] {
  const raw = props.map((p) => p * n);
  const counts = raw.map(Math.floor);
  const order = raw.map((v, i) => [v - counts[i], i]).sort((a, b) => b[0] - a[0]);
  let left = n - counts.reduce((a, b) => a + b, 0);
  for (let k = 0; left > 0; k++, left--) counts[order[k][1]]++;
  return counts;
}

type Metrics = Omit<QcCell, "id" | "sample" | "kind">;

function realMetrics(r: Rng): Metrics {
  const nCount = truncated(() => Math.exp(Math.log(4200) + 0.45 * r.gauss()), 1050, 14500);
  return {
    nCount,
    pctMt: truncated(() => 4.5 + 2.4 * r.gauss(), 0.3, 18),
    pctRrna: truncated(() => 3 + 2 * r.gauss(), 0.2, 17),
    // Deeper cells re-detect the same genes, so genes per UMI falls with depth.
    genesPerUmi: truncated(() => 0.56 - 0.08 * Math.log(nCount / 4200) + 0.05 * r.gauss(), 0.3, 0.74),
  };
}

const FAILING: Record<Exclude<QcKind, "real" | "junk">, (r: Rng, i: number) => Metrics> = {
  broken: (r) => ({
    nCount: truncated(() => Math.exp(Math.log(1600) + 0.5 * r.gauss()), 300, 9000),
    pctMt: truncated(() => 21 + Math.abs(r.gauss()) * 10, 20.5, 60),
    pctRrna: truncated(() => 3 + 2 * r.gauss(), 0.2, 15),
    genesPerUmi: truncated(() => 0.6 + 0.05 * r.gauss(), 0.4, 0.74),
  }),
  rrna: (r) => ({
    nCount: truncated(() => Math.exp(Math.log(2800) + 0.4 * r.gauss()), 1050, 14000),
    pctMt: truncated(() => 5 + 2 * r.gauss(), 0.3, 15),
    pctRrna: truncated(() => 22 + Math.abs(r.gauss()) * 8, 20.5, 50),
    genesPerUmi: truncated(() => 0.52 + 0.05 * r.gauss(), 0.35, 0.74),
  }),
  // Half the multiplets are too deep, half are too complex for their depth.
  multiplet: (r, i) =>
    i % 2 === 0
      ? {
          nCount: truncated(() => Math.exp(Math.log(19000) + 0.25 * r.gauss()), 15500, 40000),
          pctMt: truncated(() => 4 + 2 * r.gauss(), 0.3, 15),
          pctRrna: truncated(() => 3 + 2 * r.gauss(), 0.2, 15),
          genesPerUmi: truncated(() => 0.42 + 0.04 * r.gauss(), 0.3, 0.6),
        }
      : {
          nCount: truncated(() => Math.exp(Math.log(5200) + 0.35 * r.gauss()), 1500, 14000),
          pctMt: truncated(() => 4 + 2 * r.gauss(), 0.3, 15),
          pctRrna: truncated(() => 3 + 2 * r.gauss(), 0.2, 15),
          genesPerUmi: truncated(() => 0.8 + 0.04 * r.gauss(), 0.76, 0.95),
        },
  empty: (r) => ({
    nCount: 250 + 700 * r.next(),
    pctMt: truncated(() => 6 + 3 * r.gauss(), 0.5, 19),
    pctRrna: truncated(() => 4 + 2 * r.gauss(), 0.2, 15),
    genesPerUmi: truncated(() => 0.82 + 0.05 * r.gauss(), 0.6, 0.98),
  }),
};

const FAILING_PER_SAMPLE = { broken: 6, rrna: 3, multiplet: 5, empty: 4 } as const;
const JUNK_PER_SAMPLE = 2;

function junkMetrics(r: Rng, type: number): Metrics {
  const mito = type === JUNK_MT;
  return {
    nCount: truncated(() => Math.exp(Math.log(mito ? 1900 : 2600) + 0.3 * r.gauss()), 1050, 6000),
    pctMt: mito ? truncated(() => 14 + 2 * r.gauss(), 10, 19.5) : truncated(() => 5 + 2 * r.gauss(), 0.5, 12),
    pctRrna: mito ? truncated(() => 3 + 2 * r.gauss(), 0.2, 12) : truncated(() => 12 + 3 * r.gauss(), 6, 19.5),
    genesPerUmi: truncated(() => 0.6 + 0.04 * r.gauss(), 0.4, 0.74),
  };
}

function placeCell(r: Rng, type: number): { ux: number; uy: number; t: number } {
  const blob = (c: readonly [number, number], sd: readonly [number, number]) => ({
    ux: c[0] + r.gauss() * sd[0],
    uy: c[1] + r.gauss() * sd[1],
  });
  if (type === TYPE_INDEX.pb || type === TYPE_INDEX.neut) {
    const isPb = type === TYPE_INDEX.pb;
    const bridge = r.next() < (isPb ? 0.28 : 0.3);
    const t = isPb
      ? bridge ? 0.22 + 0.28 * r.next() : 0.02 + 0.2 * r.next()
      : bridge ? 0.5 + 0.28 * r.next() : 0.78 + 0.22 * r.next();
    if (bridge) {
      const [x, y] = trajectoryPoint(t);
      return { ux: x + r.gauss() * 0.17, uy: y + r.gauss() * 0.17, t };
    }
    return { ...blob(CELL_TYPES[type].umap, CELL_TYPES[type].sd), t };
  }
  const def = type < CELL_TYPES.length ? CELL_TYPES[type] : JUNK_TYPES[type - CELL_TYPES.length];
  return { ...blob(def.umap, def.sd), t: NaN };
}

// Real data never splits cleanly at a cutoff, so some droplets end up on the wrong side.
// Counts are low enough that the paper's cutoffs stay a good choice, just not a perfect one.
type BadKind = keyof typeof FAILING;
const SLIPPED_PAST_PAPER: Record<BadKind, number> = { broken: 12, rrna: 5, multiplet: 10, empty: 5 };
const REAL_LOST_BY_PAPER: Record<BadKind, number> = { broken: 6, rrna: 2, multiplet: 5, empty: 3 };

/** Just inside the paper's line for this kind of bad droplet. */
const SLIPPED_METRICS: Record<BadKind, (r: Rng, i: number) => Partial<Metrics>> = {
  broken: (r) => ({ pctMt: 13 + 6.9 * r.next() }),
  rrna: (r) => ({ pctRrna: 13 + 6.9 * r.next() }),
  multiplet: (r, i) => (i % 2 === 0 ? { nCount: 10000 + 4900 * r.next() } : { genesPerUmi: 0.68 + 0.069 * r.next() }),
  empty: (r) => ({ nCount: 1000 + 250 * r.next(), genesPerUmi: 0.66 + 0.08 * r.next() }),
};

/** A real cell just past the line that catches this kind of bad droplet. */
const LOST_METRICS: Record<BadKind, (r: Rng, i: number) => Partial<Metrics>> = {
  broken: (r) => ({ pctMt: 20 + 6 * r.next() }),
  rrna: (r) => ({ pctRrna: 20 + 5 * r.next() }),
  multiplet: (r, i) => (i % 2 === 0 ? { nCount: 15001 + 4000 * r.next() } : { genesPerUmi: 0.751 + 0.04 * r.next() }),
  empty: (r) => ({ nCount: 700 + 299 * r.next() }),
};

/**
 * Relabels droplets instead of adding them, and uses its own RNG. Every later step
 * therefore sees the same cells, and who passes the paper's cutoffs does not change.
 */
function blurCutoffs(qcCells: QcCell[], cells: Cell[]) {
  const r = createRng(SEED + 20);
  const shuffled = <T>(items: T[]) => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(r.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };

  const inCells = new Set(cells.map((c) => c.id));

  // CD4 T depth feeds the normalization demo, so those cells keep their metrics.
  const passing = shuffled(cells.filter((c) => c.type < CELL_TYPES.length && c.type !== TYPE_INDEX.cd4t));
  let next = 0;
  for (const kind of Object.keys(SLIPPED_PAST_PAPER) as BadKind[]) {
    for (let i = 0; i < SLIPPED_PAST_PAPER[kind]; i++) {
      const droplet = qcCells[passing[next++].id];
      Object.assign(droplet, { kind }, SLIPPED_METRICS[kind](r, i));
    }
  }

  for (const kind of Object.keys(REAL_LOST_BY_PAPER) as BadKind[]) {
    const failing = shuffled(qcCells.filter((c) => c.kind === kind && !inCells.has(c.id)));
    failing.slice(0, REAL_LOST_BY_PAPER[kind]).forEach((droplet, i) => {
      Object.assign(droplet, { kind: "real" }, realMetrics(r), LOST_METRICS[kind](r, i));
    });
  }
}

let cache: Dataset | null = null;

export function getDataset(): Dataset {
  if (cache) return cache;
  const r = createRng(SEED + 2);
  const qcCells: QcCell[] = [];
  const cells: Cell[] = [];

  const addCell = (sample: number, type: number, kind: QcKind, m: Metrics) => {
    const id = qcCells.length;
    qcCells.push({ id, sample, kind, ...m });
    const { ux, uy, t } = placeCell(r, type);
    cells.push({
      id,
      sample,
      type,
      ux,
      uy,
      t,
      px: ux * 0.62 + r.gauss() * 1.05,
      py: uy * 0.5 + r.gauss() * 1.05,
      bx: r.gauss(),
      by: r.gauss(),
    });
  };

  for (const s of getSamples()) {
    allocate(s.nCells, s.props).forEach((n, type) => {
      for (let j = 0; j < n; j++) addCell(s.index, type, "real", realMetrics(r));
    });
    for (const type of [JUNK_MT, JUNK_RIBO]) {
      for (let j = 0; j < JUNK_PER_SAMPLE; j++) addCell(s.index, type, "junk", junkMetrics(r, type));
    }
    for (const [kind, n] of Object.entries(FAILING_PER_SAMPLE) as [keyof typeof FAILING, number][]) {
      for (let j = 0; j < n; j++) {
        qcCells.push({ id: qcCells.length, sample: s.index, kind, ...FAILING[kind](r, j) });
      }
    }
  }
  blurCutoffs(qcCells, cells);
  cache = { qcCells, cells };
  return cache;
}
