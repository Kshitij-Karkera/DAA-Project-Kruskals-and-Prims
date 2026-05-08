import { kruskal } from "../algorithms/kruskal.js";
import { prim } from "../algorithms/prim.js";
import { buildAdjacencyList, generateConnectedGraph, getRecommendedExtraEdges } from "./graphGenerator.js";

export function measureExecutionTime(fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return { result, timeMs: end - start };
}

export function runKruskal(vertices, edges) {
  return measureExecutionTime(() => kruskal(vertices, edges));
}

export function runPrim(vertices, edges) {
  const adjacencyList = buildAdjacencyList(vertices, edges);
  return measureExecutionTime(() => prim(vertices, adjacencyList));
}

export function compareAlgorithms(vertices, edges) {
  const kruskalRun = runKruskal(vertices, edges);
  const primRun = runPrim(vertices, edges);
  return { kruskal: kruskalRun, prim: primRun };
}

export async function runScalingBenchmark(sizes, densityType, trialsPerSize, onProgress) {
  const results = [];
  const total = sizes.length * trialsPerSize;
  let done = 0;

  for (const V of sizes) {
    let kSum = 0;
    let pSum = 0;
    let edgeCount = 0;

    for (let t = 0; t < trialsPerSize; t++) {
      const extraEdges = getRecommendedExtraEdges(V, densityType);
      const graph = generateConnectedGraph(V, extraEdges, 1, 100);
      edgeCount = graph.edges.length;

      const kr = measureExecutionTime(() => kruskal(V, graph.edges));
      kSum += kr.timeMs;

      const al = buildAdjacencyList(V, graph.edges);
      const pr = measureExecutionTime(() => prim(V, al));
      pSum += pr.timeMs;

      done++;
      if (onProgress) onProgress(done, total, V);

      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    results.push({
      size: V,
      edges: edgeCount,
      kruskalAvg: kSum / trialsPerSize,
      primAvg: pSum / trialsPerSize,
    });
  }

  return results;
}
