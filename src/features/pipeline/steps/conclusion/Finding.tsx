import type { ReactNode } from "react";

export function Finding({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <article className="flex min-w-0 flex-col gap-2 rounded-[14px] border border-line p-3.5 text-[13.5px] text-ink-2 [&_p]:m-0">
      <span className="font-mono text-[11px] text-accent">FINDING {n}</span>
      <h3 className="text-base leading-snug font-semibold text-balance text-ink">{title}</h3>
      {children}
    </article>
  );
}
