"use client";

import { useEffect, useEffectEvent, useRef, type PointerEvent } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSize } from "@/hooks/useSize";
import { useThemeColors } from "@/hooks/useThemeColors";
import { paintScatter, type Hit, type ScatterSpec } from "./paintScatter";
import { TooltipBox, useTooltip } from "./Tooltip";

export type { ArrowMark, GuideLine, PlotLabel, Pt, Segment } from "./paintScatter";

type Props = ScatterSpec & {
  ariaLabel: string;
  /** Width / height. */
  aspect?: number;
  /** Changing this replays the animation (morph from `from`, grow arrows). */
  animateKey?: string | number;
  durationMs?: number;
};

const HIT_RADIUS2 = 12 * 12;

/** Canvas scatter for many points (UMAP, QC). Redraws on data, size and theme changes. */
export function ScatterCanvas({ ariaLabel, aspect = 16 / 9, animateKey, durationMs = 1400, ...spec }: Props) {
  const colors = useThemeColors();
  const reduced = useReducedMotion();
  const [wrapRef, size] = useSize<HTMLDivElement>();
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<Hit | null>(null);
  const progress = useRef(1);
  const [tipRef, tip] = useTooltip();

  const repaint = useEffectEvent(() => {
    const cv = canvas.current;
    if (!cv || !size.width) return;
    hit.current = paintScatter(cv, size.width, size.height, spec, colors, progress.current);
  });

  // Data, size or theme changed: draw the current frame.
  useEffect(() => {
    repaint();
  });

  useEffect(() => {
    if (animateKey === undefined) return;
    if (reduced) {
      progress.current = 1;
      repaint();
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      progress.current = Math.min(1, (now - t0) / durationMs);
      repaint();
      if (progress.current < 1) raf = requestAnimationFrame(tick);
    };
    progress.current = 0;
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      progress.current = 1;
    };
  }, [animateKey, reduced, durationMs]);

  const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const h = hit.current;
    if (!h) return;
    const r = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    let best = -1;
    let bestD = HIT_RADIUS2;
    for (let i = 0; i < spec.points.length; i++) {
      if (!spec.points[i].tip) continue;
      const dx = h.px[i] - mx;
      const dy = h.py[i] - my;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best >= 0) tip.show(e.clientX, e.clientY, spec.points[best].tip!);
    else tip.hide();
  };

  return (
    <div ref={wrapRef} className="relative w-full" style={{ aspectRatio: aspect }}>
      <canvas
        ref={canvas}
        role="img"
        aria-label={ariaLabel}
        onPointerMove={onMove}
        onPointerLeave={tip.hide}
        className="absolute inset-0 size-full touch-pan-y rounded-[10px] bg-surface-2"
      />
      <TooltipBox ref={tipRef} />
    </div>
  );
}
