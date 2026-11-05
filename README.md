# Single-cell Lab

An interactive, step-by-step lab for learning single-cell RNA-seq (scRNA-seq) analysis.
Each step is a button or slider with a live chart, the matching Seurat or Scanpy line,
and a "Paper used" note comparing the tutorial default with what a real study did.

The reference study is Wilk et al., *Nature Medicine* 2020 (severe COVID-19 PBMC atlas).
**Every number in the app is synthetic**, generated in the browser from a fixed seed.

## Pipeline

0. Question & Data → 1. QC → 2. SCTransform → 3. Variable genes → 4. PCA → 5. UMAP →
6. Clustering → 7. Junk clusters → 8. Annotation → 9. Composition → 10. Monocyte DE →
11. Plasmablast → Dev. Neutrophil (hypothesis) → 12. Conclusion

## Tech

- Next.js 16 (App Router, static export) + TypeScript
- Tailwind CSS v4 with light/dark design tokens
- Hand-rolled Canvas/SVG charts (no chart library)
- Vitest for the simulation code

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev        # http://localhost:3000, hot reload
```

Checks:

```bash
npm test           # simulation unit tests
npm run lint
npm run typecheck
```

Production build (what GitHub Pages serves):

```bash
npm run build      # writes the static site to out/
npm run preview    # serves out/ at http://localhost:3000
```

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy.yml` lints, tests, builds and deploys on every push to `main`.

1. Push this repository to GitHub.
2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow from the **Actions** tab).

The site is served at `https://<user>.github.io/<repo>/`. `next.config.ts` reads the repository
name from `GITHUB_REPOSITORY` in CI and sets `basePath` to match, so renaming the repo needs no
code change. Locally the site is served at `/`.

## Project layout

```
src/
  app/            routes: landing page and /step/[slug] (statically generated)
  features/       pipeline state (context + reducer) and one screen per step
  components/     layout, UI primitives and charts (data in, pixels out)
  lib/sim/        pure, seeded simulation: cells, QC, normalization, clusters, DE, trajectory
  content/        text as data: step copy, glossary, code snippets, paper facts
  hooks/          size, theme colors, reduced motion, persisted preferences
tests/lib/sim/    unit tests for the simulation
doc/              build guide and the original Korean prototype
```

## About the data

- Effects only follow the *direction* reported in the paper; magnitudes are invented.
- `src/content/paperFacts.ts` is the only place that states facts about the paper, and each fact
  names the figure or section it came from.
- Sample IDs (`H1–H6`, `N1–N4`, `A1–A4`) are generic and are not mapped to the paper's donors.

## Citation and disclaimer

Wilk AJ, Rustagi A, Zhao NQ, … Rogers AJ, Blish CA. A single-cell atlas of the peripheral immune
response in patients with severe COVID-19. *Nature Medicine* 26, 1070–1076 (2020).
https://doi.org/10.1038/s41591-020-0944-y

Educational simulation with synthetic data. Not affiliated with the authors or the publisher.
Built with AI assistance (Claude), following the SJSU AI best practices on disclosure.
