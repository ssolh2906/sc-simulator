/** One global seed keeps every chart deterministic and testable. */
export const SEED = 20200715;

/** mulberry32: tiny seeded PRNG returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = {
  next: () => number;
  gauss: () => number;
  range: (lo: number, hi: number) => number;
};

export function createRng(seed: number): Rng {
  const next = mulberry32(seed);
  // Box–Muller transform for standard normal draws.
  const gauss = () => {
    let u = 0;
    let v = 0;
    while (u === 0) u = next();
    while (v === 0) v = next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return { next, gauss, range: (lo, hi) => lo + (hi - lo) * next() };
}

function fmix(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Stateless hash to [0, 1). Per-cell × gene draws use this, so the
 * expression matrix never has to be stored.
 */
export function hash01(a: number, b = 0): number {
  return fmix(Math.imul(a, 0x9e3779b1) ^ fmix(b + 0x27d4eb2f)) / 4294967296;
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Poisson draw (Knuth for small λ, normal approximation for large λ). */
export function poisson(lambda: number, rng: Rng): number {
  if (lambda > 30) return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * rng.gauss()));
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = rng.next();
  while (p > limit) {
    k++;
    p *= rng.next();
  }
  return k;
}
