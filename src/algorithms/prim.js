import MinHeap from "./minHeap.js";

export function prim(vertices, adjacencyList, start = 0) {
  const visited = Array(vertices).fill(false);
  const heap = new MinHeap();
  const mstEdges = [];
  let totalWeight = 0;
  let visitedCount = 0;

  visited[start] = true;
  visitedCount += 1;

  for (const neighbor of adjacencyList[start]) {
    heap.push({
      from: start,
      to: neighbor.to,
      weight: neighbor.weight,
    });
  }

  while (!heap.isEmpty() && mstEdges.length < vertices - 1) {
    const edge = heap.pop();
    if (!edge) break;

    const { from, to, weight } = edge;
    if (visited[to]) continue; 

    visited[to] = true;
    visitedCount += 1;
    mstEdges.push({ from, to, weight });
    totalWeight += weight;

    for (const neighbor of adjacencyList[to]) {
      if (!visited[neighbor.to]) {
        heap.push({
          from: to,
          to: neighbor.to,
          weight: neighbor.weight,
        });
      }
    }
  }

  const connected = visitedCount === vertices && mstEdges.length === vertices - 1;

  return {
    algorithm: "Prim",
    mstEdges,
    totalWeight,
    connected,
  };
}
