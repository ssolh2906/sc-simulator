"use client";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T | null;
  onChange: (v: T) => void;
  /** Show the visible label before the control. */
  showLabel?: boolean;
};

export function Segmented<T extends string>({ label, options, value, onChange, showLabel }: Props<T>) {
  return (
    <div className="flex items-center gap-2">
      {showLabel && <span className="font-mono text-[13px] text-ink-2">{label}</span>}
      <div role="group" aria-label={label} className="inline-flex flex-wrap gap-0.5 rounded-full border border-line bg-surface-2 p-[3px]">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
            className="cursor-pointer rounded-full px-3 py-1 font-mono text-[13px] text-ink-2 aria-pressed:bg-accent aria-pressed:text-accent-ink"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
