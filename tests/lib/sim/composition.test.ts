import { describe, expect, it } from "vitest";
import { TYPE_INDEX, type Group } from "@/content/cellTypes";
import { perSample, perSampleTests, pooled } from "@/lib/sim/composition";

const avg = (type: number, g: Group) => {
  const v = perSample(type)[g];
  return v.reduce((s, x) => s + x.value, 0) / v.length;
};

describe("composition", () => {
  it("follows the paper's directions", () => {
    const T = TYPE_INDEX;
    expect(avg(T.neut, "ards")).toBeGreaterThan(avg(T.neut, "healthy") * 5);
    expect(avg(T.pb, "ards")).toBeGreaterThan(avg(T.pb, "nonvent"));
    expect(avg(T.pb, "nonvent")).toBeGreaterThan(avg(T.pb, "healthy"));
    for (const k of ["nk", "cd16", "cdc", "gdt", "pdc"] as const) {
      expect(avg(T[k], "ards")).toBeLessThan(avg(T[k], "healthy"));
    }
  });

  it("NK, CD16 Mono and cDC are significant only in ARDS", () => {
    for (const k of ["nk", "cd16", "cdc", "neut"] as const) {
      const p = perSampleTests(TYPE_INDEX[k]);
      expect(p.ards).toBeLessThan(0.05);
      expect(p.nonvent).toBeGreaterThan(0.05);
    }
  });

  it("pooling cells is far more 'significant' than per-sample tests", () => {
    const t = TYPE_INDEX.neut;
    expect(pooled(t).p.ards).toBeLessThan(perSampleTests(t).ards / 1000);
  });

  it("has one value per sample", () => {
    const g = perSample(TYPE_INDEX.cd4t);
    expect([g.healthy.length, g.nonvent.length, g.ards.length]).toEqual([6, 4, 4]);
  });
});
