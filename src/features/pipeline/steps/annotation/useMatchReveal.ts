"use client";

import { useEffect, useRef, useState } from "react";

const STEP_MS = 1100;

/**
 * Reveals matches one per tick. `current` is the item being matched now (-1 when idle).
 * The last item stays current for one extra tick so the user can read it.
 */
export function useMatchReveal(total: number, alreadyDone: boolean) {
  const [shown, setShown] = useState(alreadyDone ? total : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);

  const clear = () => {
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => clear, []);

  const finish = () => {
    clear();
    setRunning(false);
    setShown(total);
  };

  const start = () => {
    clear();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
    let n = 1;
    setShown(n);
    setRunning(true);
    timer.current = window.setInterval(() => {
      n += 1;
      if (n > total) finish();
      else setShown(n);
    }, STEP_MS);
  };

  return { shown, current: running ? shown - 1 : -1, running, start, skip: finish };
}
