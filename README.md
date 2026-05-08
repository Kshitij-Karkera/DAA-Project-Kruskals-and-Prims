# DAA Project: Kruskal's and Prim's Algorithm

An interactive web application for visualizing and comparing **Kruskal's Algorithm** and **Prim's Algorithm** for finding the **Minimum Spanning Tree (MST)** of a connected weighted graph.

This project was created as part of a **Design and Analysis of Algorithms (DAA)** project to demonstrate how two classic MST algorithms work, how their results compare, and how their runtime changes with different graph sizes and densities.

---

## Features

- Generate random connected weighted graphs
- Choose graph density: Sparse, Medium, or Dense
- Run Kruskal's Algorithm
- Run Prim's Algorithm
- Compare both algorithms side by side
- Display MST edges and total MST weight
- Step-by-step animation of both algorithms
- Highlight accepted and rejected edges during animation
- Show visited nodes and frontier edges for Prim's Algorithm
- Runtime comparison using charts
- Benchmark performance across multiple input sizes
- Light mode and dark mode support

---

## Algorithms Implemented

### Kruskal's Algorithm

Kruskal's Algorithm sorts all edges by weight and selects the smallest edges one by one, as long as they do not form a cycle.

In this project, Kruskal's Algorithm uses the **Union-Find / Disjoint Set** data structure to efficiently detect cycles.

### Prim's Algorithm

Prim's Algorithm starts from a selected node and grows the MST by repeatedly choosing the minimum-weight edge that connects a visited node to an unvisited node.

In this project, Prim's Algorithm uses a **Min Heap** to efficiently select the next minimum-weight edge.

---

## Tech Stack

- React
- JavaScript
- CSS
- Chart.js
- Vite

---

## Project Structure

```text
src/
├── App.jsx
├── main.jsx
├── styles.css
├── algorithms/
│   ├── kruskal.js
│   ├── prim.js
│   ├── unionFind.js
│   └── minHeap.js
└── utils/
    ├── graphGenerator.js
    ├── benchmark.js
    ├── kruskalTrace.js
    └── primTrace.js
