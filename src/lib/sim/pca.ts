export const MAX_PCS = 50;

const HEAD = [17, 11.5, 8, 6, 4.6, 3.6, 2.8, 2.2, 1.8, 1.5];

/** % variance explained for PC1–PC50: steep head, long flat tail (elbow near 10). */
export const PC_VARIANCE: number[] = Array.from({ length: MAX_PCS }, (_, i) =>
  i < HEAD.length ? HEAD[i] : +(0.35 + 1.0 * Math.exp(-(i - HEAD.length) / 12)).toFixed(2),
);

/**
 * How much the islands smear when too few PCs carry the signal.
 * With SCTransform, extra PCs add little noise, so 50 is safe.
 */
export function blurFor(nPcs: number): number {
  if (nPcs <= 2) return 2.0;
  if (nPcs <= 4) return 1.2;
  if (nPcs <= 6) return 0.6;
  if (nPcs <= 8) return 0.25;
  return 0;
}
