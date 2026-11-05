export const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;

export const int = (v: number) => Math.round(v).toLocaleString("en-US");

export const signed = (v: number, digits = 2) => `${v > 0 ? "+" : ""}${v.toFixed(digits)}`;

/** p-values: scientific notation once they get tiny. */
export function pValue(p: number): string {
  if (p < 1e-4) return `p = ${p.toExponential(0).replace("e-", "×10⁻").replace(/\d+$/, (d) => toSuperscript(d))}`;
  if (p < 0.001) return "p < 0.001";
  return `p = ${p.toFixed(3)}`;
}

const SUP: Record<string, string> = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
const toSuperscript = (d: string) => d.split("").map((c) => SUP[c] ?? c).join("");

export const kilo = (v: number) => (v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : String(Math.round(v)));
