import { describe, expect, it } from "vitest";
import { linearFit, normCdf, quantile, wilcoxon, wilcoxonExact } from "@/lib/sim/stats";

describe("stats", () => {
  it("exact Wilcoxon: perfect 4 vs 6 split gives 2/210", () => {
    expect(wilcoxonExact([10, 11, 12, 13], [1, 2, 3, 4, 5, 6])).toBeCloseTo(2 / 210, 10);
  });

  it("exact Wilcoxon: identical groups are not significant", () => {
    expect(wilcoxonExact([1, 2, 3, 4], [1, 2, 3, 4, 2, 3])).toBeGreaterThan(0.5);
  });

  it("normal-approximation Wilcoxon detects a clear shift", () => {
    const a = Array.from({ length: 50 }, (_, i) => i + 30);
    const b = Array.from({ length: 50 }, (_, i) => i);
    expect(wilcoxon(a, b)).toBeLessThan(1e-6);
    expect(wilcoxon(b, b)).toBeGreaterThan(0.9);
  });

  it("helpers behave", () => {
    expect(normCdf(0)).toBeCloseTo(0.5, 6);
    expect(normCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(quantile([1, 2, 3, 4, 5], 0.5)).toBe(3);
    expect(linearFit([1, 2, 3], [2, 4, 6]).slope).toBeCloseTo(2);
  });
});
