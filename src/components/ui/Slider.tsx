"use client";

import { useId } from "react";
import type { GlossaryKey } from "@/content/glossary";
import { Term } from "./Term";

type Props = {
  label: string;
  /** Turns the visible name into a glossary popover. */
  term?: GlossaryKey;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
};

export function Slider({ label, term, value, min, max, step = 1, onChange, format = String }: Props) {
  const id = useId();
  return (
    <div className="flex items-center gap-2 font-mono text-[13px] text-ink-2">
      {term ? (
        <span className="whitespace-nowrap">
          <Term k={term}>{label}</Term>
        </span>
      ) : (
        <label htmlFor={id} className="whitespace-nowrap">
          {label}
        </label>
      )}
      <input
        id={id}
        type="range"
        aria-label={term ? label : undefined}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 accent-accent sm:w-36"
      />
      <output htmlFor={id} className="min-w-12 font-semibold text-ink">
        {format(value)}
      </output>
    </div>
  );
}
