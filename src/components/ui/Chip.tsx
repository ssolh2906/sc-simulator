import type { ReactNode } from "react";

const BASE =
  "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-0.5 font-mono text-xs text-ink-2";

type ChipProps = { children: ReactNode; color?: string; className?: string };

type ToggleChipProps = ChipProps & { pressed: boolean; onClick: () => void; label?: string };

/** Filter chip: dims when not pressed. */
export function ToggleChip({ children, color, pressed, onClick, label, className = "" }: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      className={`${BASE} cursor-pointer aria-[pressed=false]:opacity-45 aria-pressed:border-accent aria-pressed:text-ink ${className}`}
    >
      {color && <i aria-hidden className="inline-block size-2.5 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}
