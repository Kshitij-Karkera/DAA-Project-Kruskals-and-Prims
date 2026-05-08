export function buildAdjacencyList(vertices, edges) {
  const adjacencyList = Array.from({ length: vertices }, () => []);

  for (const edge of edges) {
    adjacencyList[edge.from].push({ to: edge.to, weight: edge.weight });
    adjacencyList[edge.to].push({ to: edge.from, weight: edge.weight });
  }

  return adjacencyList;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateConnectedGraph(vertices, extraEdges = 0, minWeight = 1, maxWeight = 100) {
  if (vertices < 2) {
    return { vertices, edges: [] };
  }

  const edges = [];
  const edgeSet = new Set();

  function edgeKey(a, b) {
    return a < b ? `${a}-${b}` : `${b}-${a}`;
  }

  for (let i = 1; i < vertices; i += 1) {
    const parent = randomInt(0, i - 1);
    const weight = randomInt(minWeight, maxWeight);
    edges.push({ from: i, to: parent, weight });
    edgeSet.add(edgeKey(i, parent));
  }

  const maxPossibleEdges = (vertices * (vertices - 1)) / 2;
  const targetEdgeCount = Math.min(maxPossibleEdges, edges.length + extraEdges);
  let attempts = 0;

  while (edges.length < targetEdgeCount && attempts < 200000) {
    attempts++;
    const a = randomInt(0, vertices - 1);
    const b = randomInt(0, vertices - 1);

    if (a === b) continue;

    const key = edgeKey(a, b);
    if (edgeSet.has(key)) continue;

    edgeSet.add(key);
    edges.push({
      from: a,
      to: b,
      weight: randomInt(minWeight, maxWeight),
    });
  }

  return { vertices, edges };
}

export function getRecommendedExtraEdges(vertices, densityType) {
  const maxPossibleEdges = (vertices * (vertices - 1)) / 2;
  const minConnectedEdges = vertices - 1;

  if (densityType === "sparse") {
    return Math.max(0, Math.floor(vertices * 0.5));
  }

  if (densityType === "medium") {
    return Math.max(0, Math.floor(vertices * 2));
  }

  if (densityType === "dense") {
    const target = Math.floor(maxPossibleEdges * 0.4);
    return Math.max(0, target - minConnectedEdges);
  }

  return Math.max(0, Math.floor(vertices));
}
