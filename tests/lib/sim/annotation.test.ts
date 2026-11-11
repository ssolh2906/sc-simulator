import { describe, expect, it } from "vitest";
import { CELL_TYPES } from "@/content/cellTypes";
import { matchOrder, matchReference, maturityCheck } from "@/lib/sim/annotation";
import { getClusters } from "@/lib/sim/clusters";

describe("matchReference", () => {
  const truth = new Map(getClusters("default").info.filter((c) => !c.junk).map((c) => [c.id, CELL_TYPES[c.main].key]));
  const rows = matchReference();

  it("labels every known type correctly", () => {
    for (const r of rows.filter((r) => r.key)) expect(r.key).toBe(truth.get(r.cluster));
  });

  it("leaves only the Dev. Neutrophil cluster unknown", () => {
    const unknown = rows.filter((r) => !r.key);
    expect(unknown.map((r) => truth.get(r.cluster))).toEqual(["neut"]);
  });

  it("reveals the unknown cluster last", () => {
    const order = matchOrder();
    expect(order).toHaveLength(rows.length);
    expect(order.at(-1)!.key).toBeNull();
  });

  it("shows the unknown cluster as granule-on, mature-off", () => {
    const unknown = rows.find((r) => !r.key)!;
    const check = maturityCheck(unknown.cluster);
    const granule = check.filter((g) => g.kind === "granule");
    const mature = check.filter((g) => g.kind === "mature");
    expect(Math.max(...granule.map((g) => g.pct))).toBeGreaterThan(0.4);
    expect(Math.max(...mature.map((g) => g.pct))).toBeLessThan(0.1);
  });

  it("flags the FCGR3A-sharing types as low confidence", () => {
    const unsure = rows.filter((r) => r.key && !r.confident).map((r) => r.key);
    expect(unsure.sort()).toEqual(["cd16", "nk"]);
  });
});
