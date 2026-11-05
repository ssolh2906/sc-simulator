import type { ReactNode } from "react";

/** Row of controls that wraps on small screens. */
export function Controls({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">{children}</div>;
}

/** Two figures side by side; stacks under 640px. */
export function Grid2({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="text-[12.5px] text-muted">{children}</p>;
}
