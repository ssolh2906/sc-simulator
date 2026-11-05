import { describe, expect, it } from "vitest";
import { depthLeakPoints, depthTrend, toyValues } from "@/lib/sim/normalize";

describe("normalize", () => {
  const pts = depthLeakPoints();

  it("LogNormalize still leaks depth; SCTransform removes it", () => {
    const raw = depthTrend(pts, "raw").r;
    const log = depthTrend(pts, "log").r;
    const sct = depthTrend(pts, "sct").r;
    expect(raw).toBeGreaterThan(log);
    expect(log).toBeGreaterThan(0.3);
    expect(Math.abs(sct)).toBeLessThan(0.1);
  });

  it("toy cells end up equal after normalization", () => {
    for (const m of ["log", "sct"] as const) {
      const v = toyValues(m).map((x) => x.gene);
      expect(Math.max(...v) - Math.min(...v)).toBeLessThan(1e-9);
    }
  });
});
