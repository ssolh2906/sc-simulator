import { describe, expect, it } from "vitest";
import { genesIn } from "@/content/genes";
import { perSampleDe } from "@/lib/sim/de";
import { moduleBySample } from "@/lib/sim/moduleScore";

describe("monocyte DE", () => {
  it("HLA class II genes are down in at least 6 of 8 COVID samples", () => {
    const de = perSampleDe(genesIn("hla2"));
    for (const gene of genesIn("hla2")) {
      const down = de.filter((d) => d.gene === gene && d.sig && d.log2fc < 0).length;
      expect(down, gene).toBeGreaterThanOrEqual(6);
    }
  });

  it("ISG signal is heterogeneous: 3 of 8 samples look like healthy", () => {
    const de = perSampleDe(["ISG15", "MX1", "IFI6"]);
    const flat = new Set(de.filter((d) => Math.abs(d.log2fc) < 0.5).map((d) => d.sample));
    expect(flat.size).toBe(3);
  });

  it("cytokines stay near zero", () => {
    for (const d of perSampleDe(genesIn("cytokine"))) expect(Math.abs(d.log2fc)).toBeLessThan(0.1);
  });

  it("HLA class II module score is lower in every patient", () => {
    const m = moduleBySample(genesIn("hla2"));
    const minHealthy = Math.min(...m.healthy.map((v) => v.value));
    for (const v of [...m.nonvent, ...m.ards]) expect(v.value).toBeLessThan(minHealthy);
  });
});
