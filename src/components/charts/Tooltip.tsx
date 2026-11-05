"use client";

import { useMemo, useRef, type PointerEvent, type Ref } from "react";

/**
 * Imperative tooltip: hover moves never re-render the chart.
 * Render <TooltipBox ref={tipRef} /> once, then call tip.show / tip.hide.
 */
export function useTooltip() {
  const ref = useRef<HTMLDivElement>(null);
  const api = useMemo(() => {
    const show = (clientX: number, clientY: number, text: string) => {
      const el = ref.current;
      if (!el) return;
      el.textContent = text;
      el.hidden = false;
      const w = el.offsetWidth;
      el.style.left = `${Math.max(8, Math.min(clientX + 14, window.innerWidth - w - 8))}px`;
      el.style.top = `${Math.max(8, clientY - 38)}px`;
    };
    const hide = () => {
      if (ref.current) ref.current.hidden = true;
    };
    /** Spread onto an SVG mark: {...tip.bind("CD14 · 92%")} */
    const bind = (text: string) => ({
      onPointerMove: (e: PointerEvent) => show(e.clientX, e.clientY, text),
      onPointerLeave: hide,
    });
    return { show, hide, bind };
  }, []);
  return [ref, api] as const;
}

export function TooltipBox({ ref }: { ref: Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      hidden
      role="tooltip"
      className="pointer-events-none fixed z-40 whitespace-nowrap rounded-[7px] bg-ink px-2 py-1 font-mono text-xs text-bg"
    />
  );
}
