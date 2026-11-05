import type { ReactNode } from "react";

/** ✓ / ! result chip. Icon + text, so it never relies on color alone. */
export function StatusChip({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-current px-2.5 py-0.5 font-mono text-xs ${
        ok ? "text-good" : "text-warn"
      }`}
    >
      <span aria-hidden>{ok ? "✓" : "!"}</span>
      <span className="sr-only">{ok ? "OK:" : "Warning:"}</span>
      {children}
    </span>
  );
}
