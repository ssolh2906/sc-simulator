import type { Pt } from "./paintScatter";

type Options = { color?: string; r?: number };

/**
 * Fade every point, then redraw the hits on top. Hits are appended rather than
 * reordered, so `from` positions and tooltips still line up with the originals.
 */
export function spotlight(points: Pt[], hit: (i: number) => boolean, { color, r }: Options = {}): Pt[] {
  const faded = points.map((p) => ({ ...p, alpha: 0.07 }));
  const lit = points.flatMap((p, i) =>
    hit(i) ? [{ ...p, alpha: 1, r: r ?? (p.r ?? 2.4) + 0.8, color: color ?? p.color }] : [],
  );
  return [...faded, ...lit];
}
