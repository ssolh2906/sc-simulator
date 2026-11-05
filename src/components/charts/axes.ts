/** Round tick values covering [lo, hi]. */
export function niceTicks(lo: number, hi: number, count = 5): number[] {
  const span = hi - lo;
  if (!(span > 0)) return [lo];
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-6; v += step) out.push(+v.toFixed(10));
  return out;
}

/** Linear map from a data domain to a pixel range. */
export const linear =
  ([d0, d1]: [number, number], [r0, r1]: [number, number]) =>
  (v: number) =>
    r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);

export type Tick = { v: number; label?: string };

export const toTicks = (values: number[], fmt: (v: number) => string = String): Tick[] =>
  values.map((v) => ({ v, label: fmt(v) }));
