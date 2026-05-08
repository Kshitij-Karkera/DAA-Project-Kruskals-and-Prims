# MST Visualization — CS Project 4

Interactive visualization and benchmarking tool for **Kruskal's** and **Prim's** Minimum Spanning Tree algorithms.

## Features

- Generate random connected weighted graphs (sparse / medium / dense)
- Run Kruskal or Prim (or both) and compare results + runtime
- Step-by-step animation with transport controls (play, pause, prev, next, speed)
- **Runtime vs input size** benchmark — plots experimental growth curves across multiple vertex counts and densities
- Full data table with per-size Kruskal vs Prim averages

## Algorithms implemented from scratch

| File | Description |
|---|---|
| `src/algorithms/unionFind.js` | Union-Find with path compression + union-by-rank |
| `src/algorithms/minHeap.js` | Binary min-heap (priority queue) |
| `src/algorithms/kruskal.js` | Kruskal's MST — O(E log E) |
| `src/algorithms/prim.js` | Prim's MST — O(E log V) |
| `src/utils/graphGenerator.js` | Random connected graph generator + adjacency list builder |
| `src/utils/benchmark.js` | Timing utilities + async scaling benchmark |
| `src/utils/kruskalTrace.js` | Step-by-step Kruskal trace for animation |
| `src/utils/primTrace.js` | Step-by-step Prim trace for animation |

No external packages are used for any of the core algorithms.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

## Build for production

```bash
npm run build
npm run preview
```

## Usage guide

1. **Set vertices + density** in the Experiment Controls panel.
2. Click **Generate graph** — the graph appears in the visualization panel.
3. Click **Run algorithm(s)** to compute the MST and see runtime results.
4. Use the **transport bar** to animate Kruskal or Prim step by step.
5. Scroll to **Runtime vs input size** — select sizes, trials, density, then click **Run benchmark** to generate the experimental growth chart for your report.
