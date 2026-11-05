import { describe, expect, it } from "vitest";
import { CELL_TYPES, TYPE_INDEX } from "@/content/cellTypes";
import { getClusters, junkClusterIds } from "@/lib/sim/clusters";

describe("clusters", () => {
  it("default resolution gives one cluster per type plus two junk clusters", () => {
    const c = getClusters("default");
    expect(c.info).toHaveLength(CELL_TYPES.length + 2);
    expect(c.info.every((i) => i.types.length === 1)).toBe(true);
    expect(junkClusterIds()).toHaveLength(2);
  });

  it("is stable and numbers clusters by size", () => {
    const a = getClusters("default");
    expect(getClusters("default")).toBe(a);
    const sizes = a.info.map((i) => i.size);
    expect([...sizes].sort((x, y) => y - x)).toEqual(sizes);
  });

  it("low merges and high splits", () => {
    const low = getClusters("low").info.length;
    const def = getClusters("default").info.length;
    const high = getClusters("high").info.length;
    expect(low).toBeLessThan(def);
    expect(high).toBeGreaterThan(def);
  });

  it("places Dev. Neutrophils next to plasmablasts", () => {
    const [nx, ny] = CELL_TYPES[TYPE_INDEX.neut].umap;
    const dist = (k: keyof typeof TYPE_INDEX) => {
      const [x, y] = CELL_TYPES[TYPE_INDEX[k]].umap;
      return Math.hypot(nx - x, ny - y);
    };
    const others = CELL_TYPES.filter((t) => t.key !== "neut" && t.key !== "pb").map((t) => dist(t.key));
    expect(dist("pb")).toBeLessThan(Math.min(...others));
  });
});
