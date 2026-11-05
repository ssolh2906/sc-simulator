import type { PipelineState } from "@/features/pipeline/reducer";
import type { StepSlug } from "@/features/pipeline/registry";
import { effectiveResolution } from "@/features/pipeline/selectors";
import { RESOLUTIONS } from "@/lib/sim/clusters";

export type CodeSnippet = { r: string; py: string; pyNote?: string };

const resValue = (s: PipelineState) => RESOLUTIONS.find((r) => r.key === effectiveResolution(s))!.value;

/** Paper-faithful code per step. Values from the user's choices are bound in. */
export const CODE: Partial<Record<StepSlug, (s: PipelineState) => CodeSnippet>> = {
  question: () => ({
    r: "obj <- CreateSeuratObject(counts, min.cells = 10)",
    py: "adata = sc.read_10x_mtx(path); sc.pp.filter_genes(adata, min_cells=10)",
  }),
  qc: ({ qc }) => {
    const cx = qc.complexity ? " & genes_per_umi <= 0.75" : "";
    const cxPy = qc.complexity ? " & (adata.obs.genes_per_umi <= 0.75)" : "";
    return {
      r: `obj <- subset(obj, nCount_RNA > ${qc.minCount} & nCount_RNA < ${qc.maxCount} & percent.mt < ${qc.maxMt} & percent.rrna < ${qc.maxRrna}${cx})`,
      py: `adata = adata[(adata.obs.total_counts > ${qc.minCount}) & (adata.obs.total_counts < ${qc.maxCount}) & (adata.obs.pct_counts_mt < ${qc.maxMt}) & (adata.obs.pct_counts_rrna < ${qc.maxRrna})${cxPy}]`,
    };
  },
  normalize: ({ norm }) =>
    norm === "sct"
      ? {
          r: 'obj <- SCTransform(obj, vars.to.regress = c("nFeature_RNA", "nCount_RNA", "percent.mt", "percent.rrna"))',
          py: "sc.experimental.pp.normalize_pearson_residuals(adata)",
          pyNote: "closest equivalent",
        }
      : norm === "log"
        ? {
            r: 'obj <- NormalizeData(obj, normalization.method = "LogNormalize", scale.factor = 1e4)',
            py: "sc.pp.normalize_total(adata, target_sum=1e4); sc.pp.log1p(adata)",
          }
        : { r: "GetAssayData(obj, layer = \"counts\")  # raw UMI counts", py: "adata.X  # raw UMI counts" },
  "variable-genes": ({ nHvg }) => ({
    r: `obj <- SCTransform(obj, variable.features.n = ${nHvg})  # SCT picks variable genes`,
    py: `sc.experimental.pp.highly_variable_genes(adata, flavor="pearson_residuals", n_top_genes=${nHvg})`,
    pyNote: "closest equivalent",
  }),
  pca: ({ nPcs }) => ({
    r: `obj <- RunPCA(obj, npcs = 50); ElbowPlot(obj, ndims = 50)  # keep 1:${nPcs}`,
    py: `sc.tl.pca(adata, n_comps=50); sc.pl.pca_variance_ratio(adata, n_pcs=50)  # keep ${nPcs}`,
  }),
  umap: ({ nPcs }) => ({
    r: `obj <- RunUMAP(obj, dims = 1:${nPcs})`,
    py: `sc.pp.neighbors(adata, n_pcs=${nPcs}); sc.tl.umap(adata)`,
  }),
  clustering: (s) => ({
    r: `obj <- FindNeighbors(obj, dims = 1:${s.nPcs}); obj <- FindClusters(obj, resolution = ${resValue(s)})  # Louvain`,
    py: `sc.tl.louvain(adata, resolution=${resValue(s)})`,
    pyNote: "Leiden is today's default",
  }),
  "junk-clusters": () => ({
    r: 'markers <- FindAllMarkers(obj, only.pos = TRUE); obj <- subset(obj, idents = junk, invert = TRUE)',
    py: "sc.tl.rank_genes_groups(adata, 'louvain'); adata = adata[~adata.obs.louvain.isin(junk)]",
  }),
  annotation: () => ({
    r: 'FindAllMarkers(obj, test.use = "wilcox"); SingleR(test, ref, labels = ref$label.main)',
    py: "sc.tl.rank_genes_groups(adata, 'louvain', method='wilcoxon')",
  }),
  composition: () => ({
    r: "props <- prop.table(table(obj$sample, obj$celltype), 1); wilcox.test(ards_props, healthy_props)",
    py: "props = pd.crosstab(adata.obs['sample'], adata.obs['celltype'], normalize='index')",
  }),
  monocytes: () => ({
    r: 'FindMarkers(mono, ident.1 = "A1", ident.2 = healthy_ids, logfc.threshold = 0.25); AddModuleScore(mono, list(hla_ii))',
    py: "sc.tl.rank_genes_groups(mono, 'sample', groups=['A1'], reference='healthy'); sc.tl.score_genes(mono, hla_ii)",
  }),
  trajectory: () => ({
    r: "# RNA velocity runs in Python (velocyto / scVelo)",
    py: "scv.tl.velocity(adata, mode='dynamical'); scv.tl.latent_time(adata)",
  }),
};
