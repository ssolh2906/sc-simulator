"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { GLOSSARY, type GlossaryKey } from "@/content/glossary";

const WIDTH = 260;

/** Glossary term: click or tap opens a short definition; Esc or outside click closes. */
export function Term({ k, children }: { k: GlossaryKey; children?: ReactNode }) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        btn.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!btn.current?.contains(t) && !pop.current?.contains(t)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", close, { passive: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", close);
    };
  }, [pos]);

  const toggle = () => {
    if (pos) return setPos(null);
    const r = btn.current!.getBoundingClientRect();
    setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - WIDTH - 8)), top: r.bottom + 6 });
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={toggle}
        aria-expanded={pos !== null}
        aria-controls={pos ? id : undefined}
        className="cursor-help border-b-[1.5px] border-dotted border-accent text-inherit"
      >
        {children ?? k}
      </button>
      {pos && (
        <span
          ref={pop}
          id={id}
          role="dialog"
          aria-label={k}
          className="fixed z-30 block rounded-[9px] bg-ink px-3 py-2 text-[13px] leading-snug text-bg shadow-lg"
          style={{ left: pos.left, top: pos.top, width: WIDTH }}
        >
          <b className="mb-0.5 block font-mono text-xs">{k}</b>
          {GLOSSARY[k]}
        </span>
      )}
    </>
  );
}
