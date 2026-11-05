type Row = { label: string; value: number; color: string };

/** Tiny horizontal bars for finding cards. */
export function MiniBars({ rows, format, label }: { rows: Row[]; format: (v: number) => string; label: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1e-9);
  return (
    <div role="img" aria-label={`${label}: ${rows.map((r) => `${r.label} ${format(r.value)}`).join(", ")}`}>
      <p className="mb-1 font-mono text-[10.5px] text-muted">{label}</p>
      <ul className="space-y-0.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-2 font-mono text-[11px]">
            <span className="w-16 flex-none truncate text-ink-2">{r.label}</span>
            <span className="h-2.5 flex-1 rounded-sm bg-surface-2">
              <span className="block h-full rounded-sm" style={{ width: `${Math.max((r.value / max) * 100, 2)}%`, background: r.color }} />
            </span>
            <span className="w-12 flex-none text-right text-ink">{format(r.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
