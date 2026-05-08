import UnionFind from "./unionFind.js";

export function kruskal(vertices, edges) {
  const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);

  const uf = new UnionFind(vertices);
  const mstEdges = [];
  let totalWeight = 0;

  for (const edge of sortedEdges) {
    const { from, to, weight } = edge;

    if (uf.union(from, to)) {
      mstEdges.push(edge);
      totalWeight += weight;

      if (mstEdges.length === vertices - 1) break;
    }
  }

  const connected = mstEdges.length === vertices - 1;

  return {
    algorithm: "Kruskal",
    mstEdges,
    totalWeight,
    connected,
  };
}
