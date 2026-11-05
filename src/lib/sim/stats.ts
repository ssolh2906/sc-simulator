/** Small statistics helpers. Pure functions, no dependencies. */

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function quantile(xs: number[], q: number): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

export const median = (xs: number[]) => quantile(xs, 0.5);

export function linearFit(xs: number[], ys: number[]) {
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  const slope = sxx ? sxy / sxx : 0;
  return { slope, intercept: my - slope * mx, r: sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0 };
}

/** Average ranks (1-based) with ties sharing the mean rank. */
function ranks(values: number[]): { rank: number[]; tieTerm: number } {
  const order = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const rank = new Array<number>(values.length);
  let tieTerm = 0;
  for (let i = 0; i < order.length; ) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    const r = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) rank[order[k][1]] = r;
    const t = j - i + 1;
    tieTerm += t * t * t - t;
    i = j + 1;
  }
  return { rank, tieTerm };
}

/** Standard normal CDF (Abramowitz–Stegun 7.1.26 via erf). */
export function normCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf =
    1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

/** Two-sided Wilcoxon rank-sum test, normal approximation with tie correction. */
export function wilcoxon(a: number[], b: number[]): number {
  const n1 = a.length;
  const n2 = b.length;
  if (!n1 || !n2) return 1;
  const { rank, tieTerm } = ranks([...a, ...b]);
  const r1 = rank.slice(0, n1).reduce((s, v) => s + v, 0);
  const u = r1 - (n1 * (n1 + 1)) / 2;
  const n = n1 + n2;
  const variance = ((n1 * n2) / 12) * (n + 1 - tieTerm / (n * (n - 1)));
  if (variance <= 0) return 1;
  const diff = u - (n1 * n2) / 2;
  const z = (Math.abs(diff) - 0.5) / Math.sqrt(variance);
  return Math.min(1, 2 * (1 - normCdf(Math.max(z, 0))));
}

/**
 * Exact two-sided Wilcoxon rank-sum p-value by enumerating every split.
 * Fine for small groups like 6 vs 4 samples (210 splits).
 */
export function wilcoxonExact(a: number[], b: number[]): number {
  const { rank } = ranks([...a, ...b]);
  const n = rank.length;
  const k = a.length;
  const expected = (k * (n + 1)) / 2;
  const observed = Math.abs(rank.slice(0, k).reduce((s, v) => s + v, 0) - expected);
  let extreme = 0;
  let total = 0;
  const walk = (start: number, left: number, sum: number) => {
    if (left === 0) {
      total++;
      if (Math.abs(sum - expected) >= observed - 1e-9) extreme++;
      return;
    }
    for (let i = start; i <= n - left; i++) walk(i + 1, left - 1, sum + rank[i]);
  };
  walk(0, k, 0);
  return extreme / total;
}

/** Two-proportion z-test. Used to show how overconfident pooled cells look. */
export function proportionTest(x1: number, n1: number, x2: number, n2: number): number {
  const p = (x1 + x2) / (n1 + n2);
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  if (!se) return 1;
  const z = Math.abs(x1 / n1 - x2 / n2) / se;
  // Tail via log-space approximation so tiny p-values do not round to 0.
  if (z > 8) return Math.exp(-(z * z) / 2) / (z * Math.sqrt(2 * Math.PI)) * 2;
  return 2 * (1 - normCdf(z));
}
