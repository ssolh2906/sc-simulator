function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Linear mix of two hex colors, t ∈ [0, 1]. */
export function mix(a: string, b: string, t: number): string {
  if (!a.startsWith("#") || !b.startsWith("#")) return t < 0.5 ? a : b;
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const k = Math.max(0, Math.min(1, t));
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",")})`;
}

/** CSS color-mix for SVG fills, so theme changes need no JS. */
export const cssMix = (token: string, pct: number, base = "--surface-2") =>
  `color-mix(in oklab, var(${token}) ${Math.round(Math.max(0, Math.min(100, pct)))}%, var(${base}))`;
