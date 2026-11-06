import type { ReactNode } from "react";

const TAG = "mb-1 inline-block rounded-[5px] px-1.5 py-px font-mono text-[11px] font-semibold tracking-wider";
const CARD = "min-w-0 rounded-xl border border-line bg-surface-2 px-3 py-2.5";

/** DO: the goal of the step. Shown up front, before the user acts. */
export function DoCard({ children }: { children: ReactNode }) {
  return (
    <div className={`${CARD} flex items-baseline gap-2.5`}>
      <span className={`${TAG} shrink-0 bg-line text-ink-2`}>DO</span>
      <p className="text-sm">{children}</p>
    </div>
  );
}

type SeeProps = { see: ReactNode; unlocked: boolean; lockedHint: string };

/** SEE: what the user should have noticed. Stays locked until the user acts, so it sits below the results. */
export function SeeCard({ see, unlocked, lockedHint }: SeeProps) {
  return (
    <div className={`${CARD} flex items-baseline gap-2.5`} aria-live="polite">
      <span className={`${TAG} shrink-0 bg-accent-soft text-accent`}>SEE</span>
      <p className={`text-sm ${unlocked ? "" : "text-muted"}`}>{unlocked ? see : `▶ ${lockedHint}`}</p>
    </div>
  );
}
