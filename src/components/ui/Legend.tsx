type Item = { label: string; color: string; shape?: "dot" | "line" };

/** Always-visible legend: color plus text. */
export function Legend({ items, label }: { items: Item[]; label?: string }) {
  return (
    <ul aria-label={label ?? "Legend"} className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-ink-2">
      {items.map((it) => (
        <li key={it.label} className="inline-flex items-center gap-1.5">
          <i
            aria-hidden
            className={it.shape === "line" ? "inline-block h-0.5 w-4" : "inline-block size-2.5 rounded-full"}
            style={{ background: it.color }}
          />
          {it.label}
        </li>
      ))}
    </ul>
  );
}
