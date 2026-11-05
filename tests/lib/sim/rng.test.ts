import { describe, expect, it } from "vitest";
import { createRng, hash01, mulberry32, SEED } from "@/lib/sim/rng";
import { getDataset } from "@/lib/sim/cells";

describe("rng", () => {
  it("same seed gives the same sequence", () => {
    const a = mulberry32(SEED);
    const b = mulberry32(SEED);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  it("gaussian draws have roughly zero mean and unit spread", () => {
    const r = createRng(1);
    const xs = Array.from({ length: 5000 }, () => r.gauss());
    const m = xs.reduce((s, v) => s + v, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((s, v) => s + (v - m) ** 2, 0) / xs.length);
    expect(Math.abs(m)).toBeLessThan(0.05);
    expect(Math.abs(sd - 1)).toBeLessThan(0.05);
  });

  it("hash01 is stable and stays in [0, 1)", () => {
    expect(hash01(42, 7)).toBe(hash01(42, 7));
    for (let i = 0; i < 1000; i++) {
      const v = hash01(i, i * 3);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("dataset", () => {
  it("is about 2,000 cells across 14 samples", () => {
    const { cells, qcCells } = getDataset();
    expect(cells.length).toBeGreaterThan(1800);
    expect(cells.length).toBeLessThan(2300);
    expect(qcCells.length).toBeGreaterThan(cells.length);
    expect(new Set(cells.map((c) => c.sample)).size).toBe(14);
  });
});
