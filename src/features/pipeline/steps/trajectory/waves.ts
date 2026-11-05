import type { Series } from "@/components/charts/LineChart";
import { geneWave } from "@/lib/sim/trajectory";

/** Gene groups drawn on the latent-time chart (mean of each group's genes). */
export const WAVE_SERIES = [
  { name: "Plasmablast (CD27, CD38, TNFRSF17)", genes: ["CD27", "CD38", "TNFRSF17"], color: "var(--ct-pb)" },
  { name: "Primary granule (DEFA3, ELANE, MPO)", genes: ["DEFA3", "ELANE", "MPO"], color: "var(--ct-cd14)" },
  { name: "Secondary (CHI3L1, LCN2, LTF)", genes: ["CHI3L1", "LCN2", "LTF"], color: "var(--ct-cd16)" },
  { name: "Tertiary (MMP8, MMP9, CAMP)", genes: ["MMP8", "MMP9", "CAMP"], color: "var(--ct-neut)" },
  { name: "CEBPE", genes: ["CEBPE"], color: "var(--ct-pdc)", dashed: true },
  { name: "CEBPD", genes: ["CEBPD"], color: "var(--ct-cdc)", dashed: true },
];

export function waveSeries(): Series[] {
  return WAVE_SERIES.map((s) => {
    const waves = s.genes.map((g) => geneWave(g));
    return {
      name: s.name,
      color: s.color,
      dashed: s.dashed,
      points: waves[0].map((p, i) => ({ x: p.t, y: waves.reduce((a, w) => a + w[i].v, 0) / waves.length })),
    };
  });
}
