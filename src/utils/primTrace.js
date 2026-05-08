import MinHeap from "../algorithms/minHeap.js";
import { buildAdjacencyList } from "./graphGenerator.js";

export function buildPrimTrace(vertices, edges, start = 0) {
  const adjacencyList = buildAdjacencyList(vertices, edges);
  const visited = Array(vertices).fill(false);
  const heap = new MinHeap();

  const steps = [];
  const acceptedEdges = [];
  let totalWeight = 0;

  visited[start] = true;

  for (const neighbor of adjacencyList[start]) {
    heap.push({ from: start, to: neighbor.to, weight: neighbor.weight });
  }

  while (!heap.isEmpty() && acceptedEdges.length < vertices - 1) {
    const edge = heap.pop();
    if (!edge) break;

    const currentFrontier = heap.heap.map((item) => ({ ...item }));

    if (visited[edge.to]) {
      steps.push({
        edge,
        status: "rejected",
        acceptedEdges: [...acceptedEdges],
        frontierEdges: currentFrontier,
        visitedNodes: visited.map((v, i) => (v ? i : null)).filter((x) => x !== null),
        totalWeight,
      });
      continue;
    }

    visited[edge.to] = true;
    acceptedEdges.push(edge);
    totalWeight += edge.weight;

    for (const neighbor of adjacencyList[edge.to]) {
      if (!visited[neighbor.to]) {
        heap.push({ from: edge.to, to: neighbor.to, weight: neighbor.weight });
      }
    }

    const updatedFrontier = heap.heap.map((item) => ({ ...item }));

    steps.push({
      edge,
      status: "accepted",
      acceptedEdges: [...acceptedEdges],
      frontierEdges: updatedFrontier,
      visitedNodes: visited.map((v, i) => (v ? i : null)).filter((x) => x !== null),
      totalWeight,
    });
  }

  return {
    steps,
    mstEdges: acceptedEdges,
    totalWeight,
    connected: acceptedEdges.length === vertices - 1,
    startNode: start,
  };
}
