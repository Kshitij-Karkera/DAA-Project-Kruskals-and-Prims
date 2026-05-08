import UnionFind from "../algorithms/unionFind.js";

export function buildKruskalTrace(vertices, edges) {
  const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
  const uf = new UnionFind(vertices);

  const steps = [];
  const acceptedEdges = [];
  const rejectedEdges = [];
  let totalWeight = 0;

  for (const edge of sortedEdges) {
    const { from, to, weight } = edge;

    if (uf.find(from) !== uf.find(to)) {
      uf.union(from, to);
      acceptedEdges.push(edge);
      totalWeight += weight;

      steps.push({
        edge,
        status: "accepted",
        acceptedEdges: [...acceptedEdges],
        rejectedEdges: [...rejectedEdges],
        totalWeight,
      });
    } else {
      rejectedEdges.push(edge);

      steps.push({
        edge,
        status: "rejected",
        acceptedEdges: [...acceptedEdges],
        rejectedEdges: [...rejectedEdges],
        totalWeight,
      });
    }

    if (acceptedEdges.length === vertices - 1) break;
  }

  return {
    steps,
    mstEdges: acceptedEdges,
    totalWeight,
    connected: acceptedEdges.length === vertices - 1,
  };
}
