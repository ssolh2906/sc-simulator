import type { ReactNode } from "react";

export function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-line px-3 py-2.5">
      <b className="block font-mono text-lg leading-tight tabular-nums sm:text-[22px]">{value}</b>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}

export function StatTiles({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-3 gap-2.5">{children}</div>;
}
