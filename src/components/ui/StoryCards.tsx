import type { ReactNode } from "react";

type Props = { do: ReactNode; see: ReactNode; next: ReactNode; unlocked: boolean; lockedHint: string };

const TAG = "mb-1 inline-block rounded-[5px] px-1.5 py-px font-mono text-[11px] font-semibold tracking-wider";

/** DO / SEE / NEXT. SEE and NEXT stay locked until the user acts. */
export function StoryCards({ do: doText, see, next, unlocked, lockedHint }: Props) {
  const card = "min-w-0 rounded-xl border border-line bg-surface-2 px-3 py-2.5";
  return (
    <div className="grid gap-2.5 sm:grid-cols-3">
      <div className={card}>
        <span className={`${TAG} bg-line text-ink-2`}>DO</span>
        <p className="text-sm">{doText}</p>
      </div>
      <div className={card} aria-live="polite">
        <span className={`${TAG} bg-accent-soft text-accent`}>SEE</span>
        <p className={`text-sm ${unlocked ? "" : "text-muted"}`}>{unlocked ? see : `▶ ${lockedHint}`}</p>
      </div>
      <div className={card}>
        <span className={`${TAG} bg-accent text-accent-ink`}>NEXT</span>
        <p className={`text-sm ${unlocked ? "" : "text-muted"}`}>{unlocked ? next : "—"}</p>
      </div>
    </div>
  );
}
