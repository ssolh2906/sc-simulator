import type { ReactNode } from "react";

const TAG = "mr-1.5 font-mono text-[11px] font-semibold tracking-wider";

/** DO: the goal of the step, as plain text so the next action stays the loudest thing up top. */
export function DoCard({ children }: { children: ReactNode }) {
  return <p className="text-sm text-ink-2">{children}</p>;
}

/** SEE: what the user should have noticed. Hidden until the step is done; the hint lives in the task box. */
export function SeeCard({ see, unlocked }: { see: ReactNode; unlocked: boolean }) {
  if (!unlocked) return null;
  return (
    <p aria-live="polite" className="text-sm text-ink">
      <span className={`${TAG} text-accent`}>SEE</span>
      {see}
    </p>
  );
}
