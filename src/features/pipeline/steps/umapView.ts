import { CELL_TYPES, UMAP_DOMAIN } from "@/content/cellTypes";

/** Shared axes for every UMAP canvas. */
export const UMAP_AXES = {
  xDomain: UMAP_DOMAIN.x,
  yDomain: UMAP_DOMAIN.y,
  xLabel: "UMAP_1",
  yLabel: "UMAP_2",
};

/** CSS token for a cell type (junk clusters share one gray). */
export const tokenOf = (type: number) => (type < CELL_TYPES.length ? CELL_TYPES[type].token : "--ct-junk");

export const typeName = (type: number) => (type < CELL_TYPES.length ? CELL_TYPES[type].name : "Low-quality");
