import type { ReactNode } from "react";

type Props = { title: ReactNode; aside?: ReactNode; children: ReactNode; caption?: ReactNode };

/** Figure wrapper: small mono caption row above, optional plain-language caption below. */
export function ChartFrame({ title, aside, children, caption }: Props) {
  return (
    <figure className="min-w-0">
      <div className="mb-1.5 flex flex-wrap justify-between gap-x-2 font-mono text-[11.5px] text-muted">
        <span>{title}</span>
        {aside && <span className="inline-flex items-center gap-2">{aside}</span>}
      </div>
      {children}
      {caption && <figcaption className="mt-1.5 text-[12.5px] text-muted">{caption}</figcaption>}
    </figure>
  );
}
