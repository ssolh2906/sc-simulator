"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

const SMALL_BTN = "cursor-pointer rounded-md border px-2 py-0.5 font-mono text-[11px]";

/** The controls need only this much, whatever a chart's steps look like. */
export type Walkthrough = {
  step: number | null;
  count: number;
  triggerId: string;
  close: () => void;
  toggle: () => void;
  back: () => void;
  next: () => void;
};

/** Step-through state for a "How to read" walkthrough. `current` is null while closed. */
export function useWalkthrough<T>(steps: T[]): Walkthrough & { current: T | null } {
  const count = steps.length;
  const [step, setStep] = useState<number | null>(null);
  const triggerId = useId();

  const close = () => {
    setStep(null);
    // The focused control is about to unmount, so hand focus back.
    document.getElementById(triggerId)?.focus();
  };

  return {
    step,
    current: step === null ? null : steps[step],
    count,
    triggerId,
    close,
    toggle: () => (step === null ? setStep(0) : close()),
    back: () => setStep((s) => Math.max(0, (s ?? 0) - 1)),
    next: () => (step === count - 1 ? close() : setStep((s) => (s ?? 0) + 1)),
  };
}

export function HowToReadButton({ tour }: { tour: Walkthrough }) {
  const open = tour.step !== null;
  return (
    <button
      id={tour.triggerId}
      type="button"
      aria-expanded={open}
      onClick={tour.toggle}
      className={`${SMALL_BTN} border-accent bg-surface text-accent`}
    >
      {open ? "Close" : "How to read"}
    </button>
  );
}

/** One line of explanation with Back / Next. Sits under the figure, so nothing covers the data. */
export function WalkthroughCaption({ tour, children }: { tour: Walkthrough; children: ReactNode }) {
  const nextRef = useRef<HTMLButtonElement>(null);
  const { step, count, close } = tour;

  // Back can disable itself on step 1, so keep focus on Next for keyboard users.
  useEffect(() => {
    nextRef.current?.focus();
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  if (step === null) return null;
  return (
    <div className="mt-2 flex min-h-16 flex-wrap items-center gap-x-3 gap-y-2 rounded-[10px] border border-accent bg-surface-2 px-3 py-2">
      <span className="font-mono text-[11px] text-muted">
        {step + 1} / {count}
      </span>
      <p aria-live="polite" className="min-w-[220px] flex-1 text-sm text-ink">
        {children}
      </p>
      <div className="ml-auto flex flex-none gap-1.5">
        <button
          type="button"
          onClick={tour.back}
          disabled={step === 0}
          className={`${SMALL_BTN} border-line bg-surface text-ink disabled:cursor-default disabled:opacity-45`}
        >
          Back
        </button>
        <button ref={nextRef} type="button" onClick={tour.next} className={`${SMALL_BTN} border-accent bg-accent text-accent-ink`}>
          {step === count - 1 ? "Done" : "Next"}
        </button>
      </div>
    </div>
  );
}
