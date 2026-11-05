import type { ReactNode } from "react";

const STYLES = {
  simplified: "border-line text-muted",
  hypothesis: "border-warn text-warn",
  synthetic: "border-line text-muted",
  wrong: "border-warn text-warn",
  right: "border-good text-good",
} as const;

const TITLES: Partial<Record<keyof typeof STYLES, string>> = {
  simplified: "Smaller or simpler than the real study, for teaching.",
  hypothesis: "An idea the data suggest, not a proven fact.",
  synthetic: "Generated in your browser. Not real data.",
};

/** Small uppercase tag: simplified / hypothesis / synthetic / wrong / right. */
export function Badge({ kind, children }: { kind: keyof typeof STYLES; children?: ReactNode }) {
  return (
    <span
      title={TITLES[kind]}
      className={`inline-block rounded border px-1.5 py-px align-middle font-mono text-[10.5px] font-semibold uppercase tracking-wider ${STYLES[kind]}`}
    >
      {children ?? kind}
    </span>
  );
}
