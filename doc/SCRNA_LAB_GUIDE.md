# Single-cell Lab: Build Guide

Handoff spec for the code session. Goal: rebuild the Korean HTML prototype (`prototype-ko.html`) as an **English, paper-faithful, interactive learning app**. Use **Next.js (static export) + Tailwind**, deployed to **GitHub Pages**.

---

## 0. TL;DR for the code session

1. Scaffold Next.js (App Router, TypeScript) + Tailwind. Set `output: 'export'` and deploy to GitHub Pages with Actions (see §7).
2. Do not use a chart library. Hand-roll small SVG/Canvas chart components (see §5.3).
3. Generate all data **in the browser** from a seeded RNG. Ship no data files.
4. Build one route per pipeline step: `/step/[slug]`, statically generated.
5. Every step follows the same layout: **Header → Code line → Interactive figure(s) → DO / SEE cards → "Paper used" note**. The conclusion step is the exception: it has no story cards or "Paper used" note.
6. Keep text short and simple (high-school reading level). Keep technical terms in English. Favor buttons and charts over paragraphs.
7. Every number shown is **synthetic**. Paper facts live in one file (`content/paperFacts.ts`), and each fact records the figure or section it came from.

---

## 1. Product

| Item | Decision |
|---|---|
| Audience | Bioinformatics students new to scRNA-seq (high-school-friendly wording) |
| Language | English UI. Technical terms stay as-is. |
| Format | Step-by-step simulation. The user clicks to run each step and sees the result. |
| Tone | Short. One idea per sentence. No walls of text. |
| Reference study | Wilk et al., *Nature Medicine* 2020 (see §2) |
| Hosting | GitHub Pages (static) |

### Step template (every step)

```
[Step n / N]  Title  (short subtitle)
[Code line: R · Seurat | Python · Scanpy]  [copy]
[Controls: buttons / sliders / segmented]
[Figure(s)]
[DO]  what we did        [SEE] what we saw (locked until action)
[Paper used ▸]  how the real paper did this step (chip, expandable)
```

---

## 2. Source study (verified against the article page)

> Wilk AJ, Rustagi A, Zhao NQ, … Rogers AJ, Blish CA. **A single-cell atlas of the peripheral immune response in patients with severe COVID-19.** *Nature Medicine* 26, 1070–1076 (2020). https://doi.org/10.1038/s41591-020-0944-y

### 2.1 Facts we can teach (put in `content/paperFacts.ts`, each with `source`)

**Design**
- Seq-Well scRNA-seq on PBMCs. *(Main)*
- 7 hospitalized COVID-19 patients gave **8 samples**: patient C1 was sampled twice, before and after intubation. There were **6 healthy controls**. *(Main, Fig 1a)*
- Comparison groups: **Healthy n=6, NonVent n=4, ARDS n=4** samples. *(Fig 1d legend)*
- 44,721 cells, about 3,194 cells per sample, **30 clusters**. *(Main)*

**QC** *(Methods: Alignment and quality control)*
- Remove cells with **< 1,000 or > 15,000 UMIs**.
- Remove cells with **> 20% mitochondrial** or **> 20% rRNA** reads (RNA18S5, RNA28S5).
- Multiplet filter: remove cells with **> 75 genes per 100 UMIs**.
- Remove genes expressed in < 10 cells.

**Processing** *(Methods: computational pipelines)*
- **SCTransform()** for scaling, transformation and variable genes. Regress out complexity (genes/cell, UMIs/cell) and quality (%mt, %rRNA).
- PCA on variable genes. **First 50 PCs** feed both UMAP and the SNN graph.
- Clustering: **FindNeighbors() + FindClusters()**, Louvain modularity optimization.
- Two clusters were dominated by mitochondrial/ribosomal genes (65% and 100% of positively enriched genes) and were **removed after clustering**.
- Annotation: **FindMarkers() (Wilcoxon)** plus known markers, **confirmed with SingleR**.
  - NK clusters were enriched for **NCAM1 + FCGR3A**.
  - γδ T cells were identified by **TRGC1, TRGC2, TRDC**.

**Composition** *(Fig 1d)*
- Depleted in COVID-19: **γδ T, pDC, cDC, CD16 monocytes, NK**. cDC, CD16 Mono and NK were significant **only in ARDS**.
- **Plasmablasts increased**, most in ARDS.
- **Developing neutrophils** increased, significant **only in ARDS**.
  - They express granule genes (ELANE, LTF, MMP8; also MPO, LCN2, CEACAM8).
  - They do **not** express FCGR3B or CXCR2.
  - In UMAP they sit **near plasmablasts**, not near canonical neutrophils.
- Statistics: two-sided **Wilcoxon rank-sum on per-sample proportions**.

**Monocytes** *(Fig 2)*
- About 10,339 monocytes. Strong phenotypic shift in CD14 Mono. CD16 Mono depleted.
- **No substantial expression of TNF, IL6, IL1B, CCL3, CCL4, CXCL2** in peripheral monocytes. Paper's reading: peripheral monocytes likely do not drive the putative cytokine storm. The same holds for T and NK cells.
- DE design: **each COVID-19 sample vs all healthy controls** (Wilcoxon, Bonferroni-adjusted).
- **Eight HLA class II genes** were down in ≥ 6 COVID samples. The HLA class II module score was down in all patients, possibly more in ventilated ones. Example genes: HLA-DPB1, HLA-DMA.
- Classical HLA class I (A, B, C) did not change consistently. HLA-E and HLA-F went down mildly.
- **32 ISGs** were up in ≥ 1 sample, but the signature was **heterogeneous**. Samples **C2, C3, C7** showed little or no IFN/ISG signal. IFI27 was up in most donors' CD14 Mono.

**T / NK** *(Fig 3)*
- CD56bright NK were depleted in all COVID samples. CD56dim NK were depleted mainly in ventilated patients.
- NK cells looked exhausted (LAG3, PDCD1, HAVCR2). There was no significant CD8 T exhaustion.

**Plasmablast → Developing neutrophil** *(Fig 4)*
- RNA velocity and latent time suggest a continuum from plasmablasts to developing neutrophils.
  - Cells lose CD27, CD38, TNFRSF17.
  - They gain granule genes in order: primary (DEFA3, ELANE, MPO), secondary (CHI3L1, LCN2, LTF), tertiary (MMP8, MMP9, CAMP).
  - CEBPE is followed by CEBPD.
- This is a hypothesis. The paper also offers **emergency granulopoiesis** as an alternative explanation.

**Limitations** *(Main)*
- Small n. Blood only. Variable sampling time. Some patients received azithromycin or remdesivir. Granulocytes usually do not survive cryopreservation.

### 2.2 Rules for using the paper

- **Do not copy** figures, figure layouts pixel-for-pixel, abstract or body text. Write all copy in our own words.
- **Do not use** Nature or Stanford logos, and do not imply that the authors endorse the app.
- Footer on every page: citation and DOI link, plus *"Educational simulation with synthetic data. Not affiliated with the authors or the publisher."*
- **Sample IDs:** donor-level ventilation status (which C# is ARDS) is in Fig 1a and was not verified in text. Use generic IDs (`H1–H6`, `N1–N4`, `A1–A4`) unless Fig 1a is checked. The ISG-low donors (C2, C3, C7) are verified. Show them as "3 of 8 COVID samples", or map them only after the IDs are verified.
- State simplifications in words, not badges: the "Paper used" note (e.g. "30 clusters (13 here)") and "Limits of this simulation" on the conclusion step. The `simplified` badge is reserved for notes on Scanpy lines in the code line (e.g. "closest equivalent").

---

## 3. Pipeline steps (paper-faithful version)

Every step pairs a **"Tutorial default"** with **"Paper used"**. This is what makes the app accurate *and* educational.

Slugs are kebab-case. **Bold** = new or changed vs the prototype.

| # | slug | Title | Main interaction | Figure(s) | Tutorial default ↔ Paper used |
|---|---|---|---|---|---|
| 0 | `question` | Question & Data | "Load count matrix"; "How to read" walkthrough | sample pictogram (**3 groups**), mini count matrix heatmap (hand-picked cells and genes, with … and ⋮ for what is omitted), stat tiles | — ↔ Seq-Well, 14 samples / 13 people |
| 1 | `qc` | Quality Control | sliders: **nCount min/max, %mt, %rRNA**; toggle **complexity filter**; each name opens a glossary popover | scatter **nCount vs %mt**; second scatter **nCount vs genes/UMI** with 0.75 line; live cell count; "your cutoffs vs paper" table (see §3.1) | nFeature/%mt cut ↔ **UMI 1k–15k, mt/rRNA <20%, genes/UMI ≤0.75** |
| 2 | `normalize` | **SCTransform** | segmented: Raw / LogNormalize / **SCTransform** | 3-cell bar demo **+ "depth leak" scatter**: gene value vs library size, correlated → flat | LogNormalize ↔ **SCTransform + regression** |
| 3 | `variable-genes` | Variable genes | slider top-N | mean vs residual variance scatter, labeled markers & housekeeping | 2,000 HVG ↔ **SCT variable genes (3,000 default)** |
| 4 | `pca` | PCA | click elbow bars | elbow (PC1–50, compressed), PC1 vs PC2 | ~10 by elbow ↔ **50 PCs** (note: with SCT, more PCs is usually safe) |
| 5 | `umap` | UMAP | "Run UMAP" animation; dims selector | UMAP gray → islands | dims 1:10 ↔ **dims 1:50** |
| 6 | `clustering` | Clustering | resolution segmented (low / default / high) | UMAP colored by cluster with ID labels | Leiden ↔ **SNN + Louvain, 30 clusters** (13 here) |
| 7 | **`junk-clusters`** | **Remove junk clusters** | user clicks clusters to flag; "Check" | dot plot of MT-/RP- gene % per cluster; UMAP | — ↔ **2 clusters removed (mito/ribo-dominated)** |
| 8 | `annotation` | Annotation | dot plot gene click → feature plot; matching quiz; **"Run SingleR" confirm** | dot plot, feature plot, SingleR agreement bar per cluster | markers only ↔ **FindMarkers (Wilcoxon) + SingleR** |
| 9 | `composition` | Composition | "per sample" vs "pool all cells" toggle; cell-type filter chips | **per-sample dot/box plot by group (Healthy / NonVent / ARDS)**; split UMAPs | cell-level % ↔ **per-sample % + Wilcoxon** |
| 10 | `monocytes` | **Monocyte deep-dive (DE)** | tabs: HLA class II / ISG / Cytokines | **heatmap: genes × COVID samples (log2FC vs healthy)**; module-score box plot; cytokine feature plots (near-zero) | pooled COVID vs Healthy ↔ **each sample vs all healthy** |
| 11 | **`trajectory`** | **Plasmablast → Dev. Neutrophil** | "Run RNA velocity"; latent-time slider | subset UMAP with arrows; gene-wave line chart along latent time | — ↔ **RNA velocity + latent time** (hypothesis badge) |
| 12 | `conclusion` | Conclusion | none (read only) | 3–4 finding cards with mini-viz; limitations (citation is in the footer) | — |

### 3.1 Key teaching moments (must land)

- **QC:** each cut removes a different kind of bad cell. Too strict loses real cells. Always show the live cell count. "Filter cells" saves the user's cutoffs, and "Use paper cutoffs" adds the paper's next to them, in a table of cells kept, bad cells kept by kind, and real cells lost. Each "Filter cells" also gives one verdict (Too loose, Too strict, Loose and strict, Good balance) and one hint about the biggest problem. The hint marks the control to try and names a direction, never a value. The step counts as done once the paper's cutoffs have been seen.
- **SCTransform:** after LogNormalize, deeper-sequenced cells still look "higher". After SCT, that trend disappears. Show this with a depth-vs-expression scatter whose slope goes to ~0.
- **Junk clusters:** clustering can still find "clusters" made of low-quality cells, so you check the clusters too.
- **Replicates = samples, not cells.** In the composition step, show one point per sample. Include a toggle "pool all cells (wrong)" vs "per sample (right)". The pooled view looks overconfident.
- **Heterogeneity:** the ISG heatmap must show some COVID samples with almost no ISG signal (3 of 8).
- **Absence is a result:** the cytokine panel shows TNF/IL6/IL1B almost off. "No signal" is the finding.
- **Hypothesis vs fact:** mark the trajectory step `hypothesis`, and show the alternative explanation (emergency granulopoiesis).

### 3.2 Copy (English, short). Starting point for `content/steps.ts`

Write DO / SEE in ≤ 20 words each. The next-step button in the pager says where to go. Examples:

```
qc.do    = "Count UMIs, %mito and %rRNA for every cell. Cut cells outside the lines."
qc.see   = "Top = broken cells. High genes-per-UMI = likely multiplets. No cutoff is perfect: even the paper's makes a few mistakes."

normalize.see = "LogNormalize still leaks depth into values. SCTransform flattens it."
composition.see = "Dev. Neutrophils and plasmablasts rise, mostly in ARDS. NK, CD16 Mono, pDC drop."
monocytes.see = "HLA class II down in every patient. ISGs up in some, not all. Cytokines stay near zero."
```

### 3.3 Code snippets (`content/code.ts`, values bound to state)

Show the paper-faithful version. Where Scanpy has no exact match, label it `closest equivalent`.

| Step | R · Seurat | Python · Scanpy |
|---|---|---|
| qc | `obj <- subset(obj, nCount_RNA > 1000 & nCount_RNA < 15000 & percent.mt < 20 & percent.rrna < 20 & genes_per_umi <= 0.75)` | `adata = adata[(adata.obs.total_counts > 1000) & (adata.obs.total_counts < 15000) & (adata.obs.pct_counts_mt < 20) & (adata.obs.pct_counts_rrna < 20) & (adata.obs.genes_per_umi <= 0.75)]` |
| normalize | `obj <- SCTransform(obj, vars.to.regress = c("nFeature_RNA","nCount_RNA","percent.mt","percent.rrna"))` | `sc.experimental.pp.normalize_pearson_residuals(adata)` *(closest equivalent)* |
| pca | `obj <- RunPCA(obj); ElbowPlot(obj, ndims = 50)` | `sc.tl.pca(adata, n_comps=50)` |
| umap | `obj <- RunUMAP(obj, dims = 1:50)` | `sc.pp.neighbors(adata, n_pcs=50); sc.tl.umap(adata)` |
| clustering | `obj <- FindNeighbors(obj, dims = 1:50); obj <- FindClusters(obj)  # Louvain` | `sc.tl.louvain(adata)`  *(Leiden is today's default)* |
| annotation | `FindAllMarkers(obj, test.use = "wilcox"); SingleR(test, ref, labels)` | `sc.tl.rank_genes_groups(adata, 'louvain', method='wilcoxon')` |
| composition | `props <- prop.table(table(obj$sample, obj$celltype), 1); wilcox.test(...)` | `pd.crosstab(adata.obs['sample'], adata.obs['celltype'], normalize='index')` |
| monocytes | `FindMarkers(mono, ident.1 = "A1", ident.2 = healthy_ids, logfc.threshold = 0.25); AddModuleScore(mono, list(hla_ii))` | `sc.tl.rank_genes_groups(mono, 'sample', groups=['A1'], reference=...)`; `sc.tl.score_genes(mono, hla_ii)` |
| trajectory | `# RNA velocity (velocyto / scVelo)` | `scv.tl.velocity(adata, mode='dynamical'); scv.tl.latent_time(adata)` |

---

## 4. Synthetic data model (`lib/sim/*`, pure + seeded)

- RNG: `mulberry32(seed)` plus a Box–Muller gaussian. Use one global seed so the app is deterministic and testable.
- **Samples:** 14 (`H1–H6`, `N1–N4`, `A1–A4`). About 120–160 cells each, roughly **2,000 cells total**, which is fine for Canvas.
- **Cell types (11):** CD4 T, CD8 T, γδ T, NK, B, Plasmablast, CD14 Mono, CD16 Mono, pDC, cDC, Dev. Neutrophil.
- **Proportions:** set group means plus per-sample noise so box plots have spread. Encode only the paper's *direction*, never real values:
  - ARDS: Dev. Neut ↑↑, Plasmablast ↑↑, NK ↓, CD16 Mono ↓, cDC ↓
  - NonVent: Plasmablast ↑, γδ T ↓, pDC ↓ (smaller effects)
  - Healthy: baseline, Dev. Neut ≈ 0
- **UMAP layout:** fixed centroid per type, with **Dev. Neutrophil placed next to Plasmablast** (paper). Add a "bridge" of cells between them for the trajectory step.
- **Low-quality cells (QC step only):** low-UMI/high-mito "broken" cells, high-rRNA cells, and high-complexity "multiplets" (genes/UMI > 0.75). Bad and real droplets overlap near each cutoff, so the paper's cutoffs keep a few bad cells and lose a few real ones. These are relabeled droplets, so exactly the same cells pass the paper's cutoffs and reach later steps.
- **Junk clusters:** after QC, add 2 small clusters with high MT-/RP- marker scores. The user must flag them.
- **Expression model:** `[meanLog, pctExpressing]` per gene × type, with condition modifiers:
  - CD14 Mono HLA class II genes (HLA-DRA, HLA-DPB1, HLA-DMA, HLA-DRB1…): lower in all COVID samples, slightly lower still in ARDS.
  - ISGs (IFI27, ISG15, MX1, IFITM3…): high in 5 of 8 COVID samples and ~baseline in the other 3.
  - Cytokines (TNF, IL6, IL1B, CCL3, CCL4, CXCL2): near zero in every group.
  - Trajectory genes: smooth functions of latent time t ∈ [0,1]. CD27/CD38/TNFRSF17 decay; ELANE/MPO peak early, LTF/LCN2 mid, MMP8/MMP9/CAMP late.
- Per-cell expression: `hash(cellId, geneId)` decides on/off and magnitude, so no matrix is stored.
- **Precompute lazily and memoize** (for example clusters per resolution). Never block the main thread for more than ~16 ms. 2,000 points is fine.

---

## 5. Architecture

### 5.1 Principles
- **Small bundle:** no chart, animation or state libraries. Tailwind plus a few hand-rolled primitives.
- **Clean split:** `lib/` = pure TypeScript (no React). `components/` = dumb UI. `features/` = step screens that wire state to components. `content/` = text, code and facts as data.
- **One responsibility per file.** Files stay under ~150 lines. Split when they grow.
- Server components by default. Use `"use client"` only for interactive leaves (charts, controls, step bodies).

### 5.2 Folder structure

```
src/
  app/
    layout.tsx                 # fonts (next/font), <ThemeProvider>, shell
    page.tsx                   # landing → "Start" (links /step/question)
    step/[slug]/page.tsx       # generateStaticParams() from registry
    globals.css                # Tailwind + design tokens (CSS vars, light/dark)
  features/
    pipeline/
      registry.ts              # ordered step list: slug, title, component, code key
      PipelineProvider.tsx     # context + useReducer; derived selectors
      reducer.ts               # actions: setQc, setNorm, setPcs, runUmap, setRes, flagCluster, answer, ...
      selectors.ts             # memoized derived data (keptCells, clusters, proportions)
      steps/
        QuestionStep.tsx
        QcStep.tsx
        NormalizeStep.tsx
        VariableGenesStep.tsx
        PcaStep.tsx
        UmapStep.tsx
        ClusteringStep.tsx
        JunkClustersStep.tsx
        AnnotationStep.tsx
        CompositionStep.tsx
        MonocyteStep.tsx
        TrajectoryStep.tsx
        ConclusionStep.tsx
  components/
    layout/   StepRail.tsx  StepHeader.tsx  Pager.tsx  SiteFooter.tsx  ThemeToggle.tsx
    ui/       Button.tsx  Segmented.tsx  Slider.tsx  Chip.tsx  StatusChip.tsx  StatTile.tsx
              StoryCards.tsx (DO/SEE)  CodeLine.tsx (lang toggle + copy)
              Term.tsx (glossary popover)  PaperNote.tsx ("Paper used")  Badge.tsx (simplified/hypothesis)
              Walkthrough.tsx ("How to read": step through highlights)
              Legend.tsx  Quiz.tsx
    charts/   ChartFrame.tsx (caption + size via ResizeObserver)
              ScatterCanvas.tsx (points, labels, threshold lines, hover)
              Bars.tsx  GroupedBars.tsx  DivergingBars.tsx  ElbowChart.tsx
              DotPlot.tsx  BoxDotPlot.tsx  Heatmap.tsx  LineChart.tsx  Tooltip.tsx
              axes.ts (ticks/grid helpers)
  lib/
    sim/      rng.ts  samples.ts  cells.ts  expression.ts  qc.ts  normalize.ts
              hvg.ts  pca.ts  umap.ts  clusters.ts  annotation.ts  composition.ts
              de.ts  moduleScore.ts  trajectory.ts  stats.ts (wilcoxon approx, quantiles)
    scale.ts  color.ts (token read, mix, sequential)  format.ts
  content/    steps.ts  glossary.ts  code.ts  paperFacts.ts  cellTypes.ts  genes.ts
  hooks/      useThemeColors.ts  useSize.ts  useReducedMotion.ts  useLocalPref.ts
tests/        lib/sim/*.test.ts  (vitest)
```

### 5.3 Core component contracts

```ts
// ScatterCanvas: Canvas for >200 points; SVG elsewhere
type Pt = { x: number; y: number; color: string; alpha?: number; r?: number; tip?: string };
type Line = { x?: number; y?: number; color: string; label?: string };
type Label = { x: number; y: number; text: string };
<ScatterCanvas points={Pt[]} xDomain yDomain xLabel yLabel ticks?
  lines?={Line[]} labels?={Label[]} aspect="16/9" animateFrom?={Pt[]} />

<StoryCards do="..." see="..." unlocked={boolean} lockedHint="..." />
<CodeLine stepKey="qc" />                      // reads lang pref + pipeline state
<PaperNote tutorial="LogNormalize" paper="SCTransform + regression" source="Methods" />
<Term k="doublet">doublet</Term>               // glossary popover (click/tap, Esc closes)
<BoxDotPlot groups={[{name, color, values:number[]}]} yLabel pTexts?={string[]} />
<Heatmap rows={string[]} cols={string[]} values={number[][]} diverging />
```

- Charts take **already-computed data**. No simulation logic inside components.
- Canvas charts read colors through `useThemeColors()` and redraw on theme change and resize.
- Hover tooltip on every mark (bars, dots, cells). Hit targets are larger than marks.

### 5.4 State
- `PipelineProvider` (context + `useReducer`) holds user choices only: thresholds, method, nPCs, resolution, flags, answers, done-steps.
- Derived data comes from pure functions in `lib/sim`, memoized in `selectors.ts`.
- Deep links: jumping to any step works. Missing choices fall back to paper defaults.
- Persist only small preferences (code language, theme) in `localStorage`, wrapped in try/catch.

---

## 6. Design system

Carry over the prototype look: a cool lab-bench neutral background, deep teal accent, and mono data labels.

- **Fonts:** IBM Plex Sans (UI) + IBM Plex Mono (data/code) via `next/font/google`, which self-hosts the fonts at build time and works with static export.
- **Tokens** as CSS variables in `globals.css`, mapped into Tailwind theme colors (`bg`, `surface`, `ink`, `ink-2`, `muted`, `line`, `accent`, `healthy`, `nonvent`, `ards`, `up`, `down`, `seq0`, `seq1`, `c1…c8`). Provide light values plus dark values for `prefers-color-scheme` and a `data-theme` toggle.
- **Groups:** Healthy = neutral gray, NonVent = amber, ARDS = raspberry. Always show a legend. Never rely on color alone.
- **Cell types (11 > 8 hues):** color by lineage family with shades (T family = blue shades; myeloid = orange/pink; B lineage = green/aqua; DC = violet; Dev. Neut = red). Always add **direct labels** on UMAP centroids.
- Status chips (✓ / !) use good/warn colors with an icon and text.
- **Keep the focus on the figures.** Use chips only for controls and for result feedback. Do not add chips or badges for context such as method, tissue or data source: put it in a chart title or plain text, and drop it if the footer, code line or "Paper used" note already says it. A status chip that only confirms the current selection adds nothing, so show it only for a warning or a result.
- **Next-action line:** a step with several actions in a set order shows what to do now in one line above the controls. It changes as the user acts, and the next control gets the emphasis. It is a hint, never a lock. Today: QC.
- **"How to read":** a small button on a figure that is hard to read at first sight. It steps through highlights in place, with one line of text under the figure and nothing covering the data. Each step that has a hard-to-read figure gets one, on that figure only: what one mark means, what the axes or colors mean, and whether the figure shows all the data or a part of it. Never reveal a quiz answer. Clustering, annotation and conclusion have none: clustering's labels are plain, annotation reuses the dot plot taught on junk clusters, and conclusion is a recap.
- **Landing page:** title, the research question, "Start the lab", and the pipeline list. No feature cards or metadata chips.
- Responsive: rail turns into horizontal chips under 860px, figures stack under 640px. No horizontal page scroll.
- Motion: one UMAP morph and the velocity arrows only. Respect `prefers-reduced-motion`.
- Accessibility: visible focus rings, buttons rather than divs, `aria-pressed` on toggles, alt text or captions on figures.

---

## 7. Build & deploy (GitHub Pages)

**`next.config.ts`**
```ts
const repo = 'scrna-lab'; // ← GitHub repo name
const isPages = process.env.GITHUB_ACTIONS === 'true';
export default {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isPages ? `/${repo}` : '',
  assetPrefix: isPages ? `/${repo}/` : '',
};
```
- Add an empty `public/.nojekyll`.
- Prefix internal links with `basePath`. Use `next/link`, which handles it.

**`.github/workflows/deploy.yml`**
```yaml
name: Deploy to GitHub Pages
on: { push: { branches: [main] }, workflow_dispatch: {} }
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint && npm test
      - run: npm run build          # outputs ./out
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: ./out }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: ${{ steps.d.outputs.page_url }} }
    steps:
      - id: d
        uses: actions/deploy-pages@v4
```
Repo Settings → Pages → Source: **GitHub Actions**.

**Budgets:** first-load JS ≤ ~120 KB gzip per route. No runtime fetches. Lighthouse ≥ 95 for performance and accessibility.

---

## 8. Quality checklist

- [ ] Every value in `paperFacts.ts` has a `source` (figure or section). Nothing else claims to be "from the paper".
- [ ] Footer citation, DOI link, synthetic-data disclaimer and non-affiliation line are present.
- [ ] No paper figures or text copied. All copy is our own.
- [ ] Composition uses per-sample points. The pooled-cells view is labeled "wrong way".
- [ ] ISG heterogeneity is visible (some COVID samples ≈ healthy).
- [ ] Cytokine panel shows near-zero expression in all groups.
- [ ] Trajectory step carries a `hypothesis` badge and names the alternative explanation.
- [ ] Dev. Neutrophil sits next to Plasmablast in UMAP.
- [ ] Unit tests for `lib/sim`: determinism (same seed → same output), QC counts, cluster stability, proportions direction.
- [ ] Works at 375px and in dark mode. Keyboard-only flow works. Reduced motion is respected.
- [ ] `npm run build` produces `out/`. The Pages URL loads with the correct basePath.

---

## 9. Reference
- Prototype (Korean, single HTML): `prototype-ko.html`, for layout, interactions and tokens.
- Paper: https://www.nature.com/articles/s41591-020-0944-y
- Follow the SJSU AI best practices for disclosure. Consider an "Built with AI assistance" line in the footer or README.
