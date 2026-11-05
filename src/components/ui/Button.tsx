import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  /** Small mono hint, e.g. the function name the button stands for. */
  hint?: string;
};

const BASE =
  "inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-semibold cursor-pointer " +
  "transition-[filter] hover:brightness-110 disabled:cursor-default disabled:opacity-45 disabled:hover:brightness-100";

const VARIANTS = {
  primary: "bg-accent text-accent-ink",
  ghost: "border border-line bg-surface text-ink",
};

export function Button({ variant = "primary", hint, className = "", children, type = "button", ...rest }: Props) {
  return (
    <button type={type} className={`${BASE} ${VARIANTS[variant]} ${className}`} {...rest}>
      {children}
      {hint && <span className="font-mono text-xs font-medium opacity-85">{hint}</span>}
    </button>
  );
}
