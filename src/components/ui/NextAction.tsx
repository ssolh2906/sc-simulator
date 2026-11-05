import type { ReactNode } from "react";

type Props = { step?: number; total?: number; children: ReactNode };

/** The one thing to do now. It changes as the user acts, and is a hint, never a lock. */
export function NextAction({ step, total, children }: Props) {
  return (
    <p aria-live="polite" className="rounded-[10px] bg-accent-soft px-3 py-2 text-sm font-medium text-ink">
      {step !== undefined && (
        <span className="mr-2 font-mono text-xs font-semibold text-accent">
          {step} / {total}
        </span>
      )}
      {children}
    </p>
  );
}
