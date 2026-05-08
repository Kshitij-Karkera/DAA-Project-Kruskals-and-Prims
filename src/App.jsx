import { useEffect, useMemo, useRef, useState } from "react";
import {
  generateConnectedGraph,
  getRecommendedExtraEdges,
} from "./utils/graphGenerator.js";
import { compareAlgorithms, runKruskal, runPrim, runScalingBenchmark } from "./utils/benchmark.js";
import { buildKruskalTrace } from "./utils/kruskalTrace.js";
import { buildPrimTrace } from "./utils/primTrace.js";
import { Chart, registerables } from "chart.js";

import "./styles.css";

Chart.register(...registerables);

const ANIM_SPEEDS = [1200, 800, 500, 250, 100];

const ALL_BENCH_SIZES = [10, 25, 50, 100, 200, 300, 500, 750, 1000];

function fmt(ms) {
  return Number(ms).toFixed(3);
}

function edgeKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function StatCard({ label, value, hint }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}

function EdgePreview({ edges }) {
  if (!edges || edges.length === 0) {
    return <p className="empty-text">Generate a graph to preview edges.</p>;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>From</th>
            <th>To</th>
            <th>Weight</th>
          </tr>
        </thead>
        <tbody>
          {edges.map((edge, i) => (
            <tr key={`${edge.from}-${edge.to}-${i}`}>
              <td>{i + 1}</td>
              <td>{edge.from}</td>
              <td>{edge.to}</td>
              <td>{edge.weight}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GraphSketch({
  vertices,
  edges,
  mstEdgesKruskal,
  mstEdgesPrim,
  animationStep,
  showAnimation,
  animationAlgorithm,
  startNode,
}) {
  if (!vertices || !edges || edges.length === 0) {
    return (
      <p className="empty-text">Graph visualization will appear here after generation.</p>
    );
  }

  const width = 700;
  const height = 460;
  const cx = width / 2;
  const cy = height / 2;

  let radius = Math.min(width, height) / 2 - 70;
  if (vertices >= 40) radius = Math.min(width, height) / 2 - 50;
  if (vertices >= 80) radius = Math.min(width, height) / 2 - 35;

  let nodeRadius = 22;
  if (vertices > 15) nodeRadius = 16;
  if (vertices > 30) nodeRadius = 11;
  if (vertices > 50) nodeRadius = 8;
  if (vertices > 80) nodeRadius = 6;

  let nodeFontSize = 11;
  if (vertices > 30) nodeFontSize = 9;
  if (vertices > 50) nodeFontSize = 7;
  if (vertices > 80) nodeFontSize = 6;

  let maxEdgesToRender = 120;
  if (vertices > 30) maxEdgesToRender = 90;
  if (vertices > 60) maxEdgesToRender = 70;
  if (vertices > 90) maxEdgesToRender = 55;

  const nodes = Array.from({ length: vertices }, (_, i) => {
    const angle = (2 * Math.PI * i) / vertices - Math.PI / 2;
    return { id: i, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });

  const acceptedSet = new Set();
  const rejectedSet = new Set();
  const frontierSet = new Set();
  const visitedNodeSet = new Set();

  if (showAnimation && animationStep) {
    for (const e of animationStep.acceptedEdges || []) acceptedSet.add(edgeKey(e.from, e.to));
    if (animationAlgorithm === "kruskal") {
      for (const e of animationStep.rejectedEdges || []) rejectedSet.add(edgeKey(e.from, e.to));
    }
    if (animationAlgorithm === "prim") {
      for (const e of animationStep.frontierEdges || []) frontierSet.add(edgeKey(e.from, e.to));
      for (const n of animationStep.visitedNodes || []) visitedNodeSet.add(n);
    }
  } else {
    const activeMst = mstEdgesKruskal?.length ? mstEdgesKruskal : mstEdgesPrim || [];
    for (const e of activeMst) acceptedSet.add(edgeKey(e.from, e.to));
  }

  const currentEdgeKey =
    showAnimation && animationStep?.edge
      ? edgeKey(animationStep.edge.from, animationStep.edge.to)
      : null;

  const renderedEdges =
    vertices > 40
      ? edges
        .filter((e) => {
          const k = edgeKey(e.from, e.to);
          return (
            acceptedSet.has(k) ||
            rejectedSet.has(k) ||
            frontierSet.has(k) ||
            k === currentEdgeKey
          );
        })
        .slice(0, maxEdgesToRender)
      : edges.slice(0, maxEdgesToRender);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="graph-svg"
      role="img"
      aria-label="Graph visualization"
    >
      {renderedEdges.map((edge, index) => {
        const from = nodes[edge.from];
        const to = nodes[edge.to];
        const key = edgeKey(edge.from, edge.to);

        let edgeClass = "edge-line";
        let weightClass = "edge-weight";
        let showThisWeight = false;

        if (frontierSet.has(key)) {
          edgeClass = "edge-line frontier";
          weightClass = "edge-weight frontier";
          showThisWeight = true;
        }
        if (acceptedSet.has(key)) {
          edgeClass = "edge-line accepted";
          weightClass = "edge-weight accepted";
          showThisWeight = true;
        }
        if (rejectedSet.has(key)) {
          edgeClass = "edge-line rejected";
          weightClass = "edge-weight rejected";
        }
        if (currentEdgeKey === key && animationStep?.status === "accepted") {
          edgeClass =
            animationAlgorithm === "prim" ? "edge-line current-prim" : "edge-line current-accepted";
          weightClass =
            animationAlgorithm === "prim"
              ? "edge-weight current-prim"
              : "edge-weight current-accepted";
          showThisWeight = true;
        }
        if (currentEdgeKey === key && animationStep?.status === "rejected") {
          edgeClass = "edge-line current-rejected";
          weightClass = "edge-weight current-rejected";
          showThisWeight = true;
        }
        if (!showAnimation && vertices <= 18) showThisWeight = true;

        return (
          <g key={`${edge.from}-${edge.to}-${index}`}>
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className={edgeClass} />
            {showThisWeight && (
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2}
                className={weightClass}
                textAnchor="middle"
              >
                {edge.weight}
              </text>
            )}
          </g>
        );
      })}

      {nodes.map((node) => {
        let nodeClass = "node-circle";
        if (animationAlgorithm === "prim" && visitedNodeSet.has(node.id)) nodeClass = "node-circle visited";
        if (animationAlgorithm === "prim" && node.id === startNode) nodeClass = "node-circle start";
        return (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r={nodeRadius} className={nodeClass} />
            <text
              x={node.x}
              y={node.y + 2}
              textAnchor="middle"
              className="node-label"
              style={{ fontSize: `${nodeFontSize}px` }}
            >
              {node.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function TransportBar({
  traceData,
  currentStepIndex,
  isPlaying,
  animationAlgorithm,
  primStartNode,
  onAnimAlgoChange,
  onPrimStartChange,
  onStart,
  onPlay,
  onPrev,
  onNext,
  onReset,
  speed,
  onSpeedChange,
}) {
  const total = traceData?.steps?.length ?? 0;
  const cur = currentStepIndex >= 0 ? currentStepIndex + 1 : 0;
  const pct = total > 0 ? ((cur / total) * 100).toFixed(1) + "%" : "0%";

  const step = traceData && currentStepIndex >= 0 ? traceData.steps[currentStepIndex] : null;

  const dotClass = step
    ? step.status === "accepted"
      ? "status-dot accepted"
      : "status-dot rejected"
    : "status-dot";

  const statusText = step
    ? `(${step.edge.from},${step.edge.to}) w=${step.edge.weight} → ${step.status}`
    : "ready";

  return (
    <div className="transport-bar">
      <div className="animation-config-row" style={{ marginBottom: 10 }}>
        <label>
          Animation algorithm
          <select value={animationAlgorithm} onChange={(e) => onAnimAlgoChange(e.target.value)}>
            <option value="kruskal">Kruskal</option>
            <option value="prim">Prim</option>
          </select>
        </label>
        {animationAlgorithm === "prim" && (
          <label>
            Start node
            <input
              type="number"
              min="0"
              value={primStartNode}
              onChange={(e) => onPrimStartChange(Number(e.target.value))}
              style={{ width: 64 }}
            />
          </label>
        )}
        <div style={{ marginLeft: "auto", alignSelf: "flex-end" }}>
          <span className="status-pill">
            <span className={dotClass} />
            <span style={{ fontSize: 11 }}>{statusText}</span>
          </span>
        </div>
      </div>

      <div className="progress-row">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: pct }} />
        </div>
        <span className="progress-label">
          {cur} / {total}
        </span>
      </div>

      <div className="transport-row">
        <button className="transport-btn" onClick={onReset} title="Reset">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
          </svg>
        </button>

        <button className="transport-btn" onClick={onPrev} title="Previous step">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          className="transport-btn play-pause"
          onClick={onPlay}
          title={
            !traceData
              ? `Start ${animationAlgorithm === "kruskal" ? "Kruskal" : "Prim"} animation`
              : isPlaying
                ? "Pause"
                : currentStepIndex >= (traceData?.steps?.length ?? 0) - 1
                  ? "Replay"
                  : "Play"
          }
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="white" stroke="none" width="16" height="16">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="white"
              stroke="none"
              width="16"
              height="16"
              style={{ marginLeft: 2 }}
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        <button className="transport-btn" onClick={onNext} title="Next step">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="speed-row">
        <span>Speed</span>
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
        />
        <span className="speed-value">{speed}x</span>
      </div>

      {step && (
        <>
          <div className="anim-stat-strip">
            <div className="anim-stat">
              <div className="anim-stat-label">Step</div>
              <div className="anim-stat-value">
                {cur} / {total}
              </div>
            </div>
            <div className="anim-stat">
              <div className="anim-stat-label">Accepted</div>
              <div className="anim-stat-value">{step.acceptedEdges.length}</div>
            </div>
            <div className="anim-stat">
              <div className="anim-stat-label">
                {animationAlgorithm === "kruskal" ? "Rejected" : "Visited nodes"}
              </div>
              <div className="anim-stat-value">
                {animationAlgorithm === "kruskal"
                  ? step.rejectedEdges.length
                  : step.visitedNodes.length}
              </div>
            </div>
          </div>
          <div className="anim-weight-row">
            MST weight so far: <strong>{step.totalWeight}</strong>
          </div>
        </>
      )}
    </div>
  );
}

function BenchmarkSection() {
  const [activeSizes, setActiveSizes] = useState(new Set([10, 25, 50, 100, 200, 500]));
  const [density, setDensity] = useState("sparse");
  const [trials, setTrials] = useState(5);
  const [chartType, setChartType] = useState("line");
  const [benchData, setBenchData] = useState(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  function toggleSize(s) {
    setActiveSizes((prev) => {
      const next = new Set(prev);
      if (next.has(s)) {
        if (next.size > 2) next.delete(s);
      } else next.add(s);
      return next;
    });
  }

  async function handleRun() {
    setRunning(true);
    setProgress(0);
    setBenchData(null);
    setStatusText("Starting…");

    const sizes = Array.from(activeSizes).sort((a, b) => a - b);
    const total = sizes.length * trials;

    const results = await runScalingBenchmark(sizes, density, trials, (done, _total, currentV) => {
      setProgress(Math.round((done / total) * 100));
      setStatusText(`Testing V=${currentV}… (${done}/${total})`);
    });

    setBenchData(results);
    setRunning(false);
    setStatusText(`Done — ${sizes.length} sizes, ${trials} trials each.`);
  }

  useEffect(() => {
    if (!benchData || !chartRef.current) return;
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = benchData.map((r) => r.size);
    const kData = benchData.map((r) => r.kruskalAvg);
    const pData = benchData.map((r) => r.primAvg);
    const isLine = chartType === "line";

    const styles = getComputedStyle(document.documentElement);
    const textColor = styles.getPropertyValue("--chart-text").trim() || "#9ca3af";
    const gridColor = styles.getPropertyValue("--chart-grid").trim() || "rgba(156,163,175,0.16)";

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: isLine ? "line" : "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Kruskal",
            data: kData,
            borderColor: "#3b82f6",
            backgroundColor: isLine ? "rgba(59,130,246,0.12)" : "#3b82f6",
            borderWidth: 2,
            borderDash: [],
            pointRadius: 4,
            pointBackgroundColor: "#3b82f6",
            fill: isLine,
            tension: 0.3,
            borderRadius: isLine ? 0 : 4,
          },
          {
            label: "Prim",
            data: pData,
            borderColor: "#10b981",
            backgroundColor: isLine ? "rgba(16,185,129,0.12)" : "#10b981",
            borderWidth: 2,
            borderDash: isLine ? [5, 3] : [],
            pointRadius: 4,
            pointBackgroundColor: "#10b981",
            fill: isLine,
            tension: 0.3,
            borderRadius: isLine ? 0 : 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { color: gridColor },
            title: { display: true, text: "Vertices (V)", font: { size: 11 }, color: textColor },
            ticks: { font: { size: 10 }, color: textColor },
          },
          y: {
            grid: { color: gridColor },
            title: { display: true, text: "Avg time (ms)", font: { size: 11 }, color: textColor },
            beginAtZero: true,
            ticks: {
              color: textColor,
              font: { size: 10 },
              callback: (v) => (v < 1 ? v.toFixed(3) : v < 10 ? v.toFixed(2) : v.toFixed(1)),
            },
          },
        },
      },
    });
  }, [benchData, chartType]);

  return (
    <section className="panel">
      <div className="section-title-row">
        <h2>Runtime vs input size</h2>
        <span className="pill">Experimental results</span>
      </div>

      <p className="bench-description">
        Runs both algorithms across multiple graph sizes and plots how runtime scales. Each size is
        averaged over multiple trials, giving you the experimental growth curves expected in your
        project report (Kruskal: O(E log E), Prim: O(E log V)).
      </p>

      <div className="bench-config-grid">
        <label>
          Density
          <select value={density} onChange={(e) => setDensity(e.target.value)} disabled={running}>
            <option value="sparse">Sparse</option>
            <option value="medium">Medium</option>
            <option value="dense">Dense</option>
          </select>
        </label>
        <label>
          Trials per size
          <select value={trials} onChange={(e) => setTrials(Number(e.target.value))} disabled={running}>
            <option value={3}>3 trials</option>
            <option value={5}>5 trials</option>
            <option value={10}>10 trials</option>
          </select>
        </label>
        <label>
          Chart type
          <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
            <option value="line">Line chart</option>
            <option value="bar">Bar chart</option>
          </select>
        </label>
      </div>

      <p className="size-chips-label">Input sizes to benchmark:</p>
      <div className="size-chips">
        {ALL_BENCH_SIZES.map((s) => (
          <div
            key={s}
            className={`size-chip${activeSizes.has(s) ? " active" : ""}`}
            onClick={() => !running && toggleSize(s)}
          >
            {s} V
          </div>
        ))}
      </div>

      <div className="bench-run-row">
        <button className="primary-btn" onClick={handleRun} disabled={running}>
          {running ? "Running…" : "Run benchmark"}
        </button>
        <span className="bench-status-text">{statusText}</span>
      </div>

      <div className="bench-progress-wrap">
        <div className="bench-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-swatch" style={{ background: "#3b82f6" }} />
          Kruskal — O(E log E)
        </div>
        <div className="legend-item">
          <div
            className="legend-swatch"
            style={{ background: "#10b981", borderTop: "2px dashed #10b981", height: 0 }}
          />
          Prim — O(E log V)
        </div>
      </div>

      <div className="bench-chart-wrap">
        <canvas
          ref={chartRef}
          role="img"
          aria-label="Line chart of Kruskal and Prim runtime across input sizes"
        >
          Runtime vs input size chart.
        </canvas>
        {!benchData && !running && (
          <p className="empty-text" style={{ position: "absolute", top: "40%", left: 0, right: 0 }}>
            Click "Run benchmark" to generate the experimental results chart.
          </p>
        )}
      </div>

      {benchData && (
        <div className="bench-table-wrap">
          <table className="bench-results-table">
            <thead>
              <tr>
                <th>Vertices</th>
                <th>Edges</th>
                <th>Kruskal avg (ms)</th>
                <th>Prim avg (ms)</th>
                <th>Faster</th>
              </tr>
            </thead>
            <tbody>
              {benchData.map((row) => {
                const diff = Math.abs(row.kruskalAvg - row.primAvg);
                let fasterEl;
                if (diff < 0.005) {
                  fasterEl = <span className="faster-badge faster-tie">Tie</span>;
                } else if (row.kruskalAvg < row.primAvg) {
                  fasterEl = <span className="faster-badge faster-kruskal">Kruskal</span>;
                } else {
                  fasterEl = <span className="faster-badge faster-prim">Prim</span>;
                }
                return (
                  <tr key={row.size}>
                    <td>{row.size}</td>
                    <td>{row.edges}</td>
                    <td>{row.kruskalAvg.toFixed(4)}</td>
                    <td>{row.primAvg.toFixed(4)}</td>
                    <td>{fasterEl}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("mst-theme") || "light");

  const [vertices, setVertices] = useState(10);
  const [densityType, setDensityType] = useState("sparse");
  const [graphData, setGraphData] = useState(null);
  const [results, setResults] = useState(null);
  const [selectedMode, setSelectedMode] = useState("compare");
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("kruskal");
  const [error, setError] = useState("");

  const [traceData, setTraceData] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationAlgorithm, setAnimationAlgorithm] = useState("kruskal");
  const [primStartNode, setPrimStartNode] = useState(0);
  const [animSpeed, setAnimSpeed] = useState(3);

  const barChartRef = useRef(null);
  const barChartInstance = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("mst-theme", theme);
  }, [theme]);

  const edgeInfo = useMemo(() => {
    const v = Number(vertices);
    if (!Number.isInteger(v) || v < 2) return { extraEdges: 0, expectedTotal: 0 };
    const extraEdges = getRecommendedExtraEdges(v, densityType);
    return { extraEdges, expectedTotal: v - 1 + extraEdges };
  }, [vertices, densityType]);

  useEffect(() => {
    if (!isPlaying || !traceData?.steps?.length) return;
    if (currentStepIndex >= traceData.steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
    }, ANIM_SPEEDS[animSpeed - 1]);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, traceData, animSpeed]);

  useEffect(() => {
    if (!barChartRef.current) return;
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
    }

    const kt = results?.kruskal?.timeMs ?? 0;
    const pt = results?.prim?.timeMs ?? 0;

    const styles = getComputedStyle(document.documentElement);
    const textColor = styles.getPropertyValue("--chart-text").trim() || "#9ca3af";
    const gridColor = styles.getPropertyValue("--chart-grid").trim() || "rgba(156,163,175,0.16)";

    barChartInstance.current = new Chart(barChartRef.current, {
      type: "bar",
      data: {
        labels: ["Kruskal", "Prim"],
        datasets: [
          {
            label: "ms",
            data: [kt, pt],
            backgroundColor: ["#3b82f6", "#10b981"],
            borderWidth: 0,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              callback: (v) => v.toFixed(3),
              font: { size: 10 },
            },
          },
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 11 } },
          },
        },
      },
    });
  }, [results, theme]);

  function resetAnimation() {
    setTraceData(null);
    setCurrentStepIndex(-1);
    setIsPlaying(false);
  }

  function handleGenerateGraph() {
    const v = Number(vertices);
    if (!Number.isInteger(v) || v < 2) {
      setError("Number of vertices must be an integer ≥ 2.");
      return;
    }
    const extraEdges = getRecommendedExtraEdges(v, densityType);
    setGraphData(generateConnectedGraph(v, extraEdges, 1, 100));
    setResults(null);
    setError("");
    resetAnimation();
    if (primStartNode >= v) setPrimStartNode(0);
  }

  function handleRun() {
    if (!graphData) {
      setError("Generate a graph first.");
      return;
    }
    setError("");
    resetAnimation();

    if (selectedMode === "compare") {
      setResults(compareAlgorithms(graphData.vertices, graphData.edges));
    } else if (selectedAlgorithm === "kruskal") {
      setResults({ kruskal: runKruskal(graphData.vertices, graphData.edges), prim: null });
    } else {
      setResults({ kruskal: null, prim: runPrim(graphData.vertices, graphData.edges) });
    }
  }

  function handleStartAnimation() {
    if (!graphData) {
      setError("Generate a graph first.");
      return;
    }
    setError("");
    const trace =
      animationAlgorithm === "kruskal"
        ? buildKruskalTrace(graphData.vertices, graphData.edges)
        : buildPrimTrace(graphData.vertices, graphData.edges, Number(primStartNode));
    setTraceData(trace);
    setCurrentStepIndex(0);
    setIsPlaying(true);
  }

  function handlePlayPause() {
    if (!traceData) {
      handleStartAnimation();
      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    if (currentStepIndex >= traceData.steps.length - 1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
      return;
    }

    setIsPlaying(true);
  }

  const kruskalResult = results?.kruskal?.result ?? null;
  const primResult = results?.prim?.result ?? null;

  const fasterText = useMemo(() => {
    if (!results?.kruskal || !results?.prim) return "Run both algorithms to compare speed.";
    const k = results.kruskal.timeMs;
    const p = results.prim.timeMs;
    if (Math.abs(k - p) < 0.005) return "Both algorithms ran in essentially the same time.";
    return k < p
      ? `Kruskal was faster by ${fmt(p - k)} ms`
      : `Prim was faster by ${fmt(k - p)} ms`;
  }, [results]);

  const currentAnimationStep =
    traceData && currentStepIndex >= 0 ? traceData.steps[currentStepIndex] : null;

  return (
    <div className="app-shell">
      <div className="background-glow glow-1" />
      <div className="background-glow glow-2" />

      <main className="app-container">
        <div className="topbar">
          <div className="topbar-left">
            <span className="topbar-title">MST Visualization</span>
          </div>

          <button
            className="theme-toggle"
            onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <span className="theme-toggle-icon">{theme === "light" ? "🌙" : "☀️"}</span>
            <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
          </button>
        </div>

        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">CS Project 4</span>
            <h1>Minimum Spanning Tree</h1>
            <p>
              Compare <strong>Kruskal</strong> and <strong>Prim</strong> on randomly generated
              connected weighted graphs and analyze how
              runtime scales with input size.
            </p>
          </div>
          <div className="hero-stats">
            <StatCard
              label="Vertices"
              value={graphData ? graphData.vertices : Number(vertices)}
              hint="Current graph size"
            />
            <StatCard label="Planned edges" value={edgeInfo.expectedTotal} hint={`${densityType} density`} />
            <StatCard
              label="Mode"
              value={selectedMode === "compare" ? "Compare" : "Single"}
              hint="Execution style"
            />
          </div>
        </section>

        <section className="panel controls-panel">
          <div className="section-title-row">
            <h2>Experiment controls</h2>
            <span className="pill">Interactive demo</span>
          </div>

          <div className="controls-grid">
            <label>
              Mode
              <select value={selectedMode} onChange={(e) => setSelectedMode(e.target.value)}>
                <option value="compare">Compare both algorithms</option>
                <option value="single">Run one algorithm</option>
              </select>
            </label>
            <label>
              Algorithm
              <select
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value)}
                disabled={selectedMode === "compare"}
              >
                <option value="kruskal">Kruskal</option>
                <option value="prim">Prim</option>
              </select>
            </label>
            <label>
              Number of vertices
              <input type="number" min="2" value={vertices} onChange={(e) => setVertices(e.target.value)} />
            </label>
            <label>
              Graph density
              <select value={densityType} onChange={(e) => setDensityType(e.target.value)}>
                <option value="sparse">Sparse</option>
                <option value="medium">Medium</option>
                <option value="dense">Dense</option>
              </select>
            </label>
          </div>

          <div className="button-row">
            <button className="primary-btn" onClick={handleGenerateGraph}>
              Generate graph
            </button>
            <button className="secondary-btn" onClick={handleRun}>
              Run algorithm(s)
            </button>
          </div>

          {error && <p className="error">{error}</p>}
        </section>

        <section className="content-grid">
          <div className="panel visual-panel">
            <div className="section-title-row">
              <h2>Graph visualization</h2>
              <span className="pill subtle">MST highlighted after run</span>
            </div>

            <GraphSketch
              vertices={graphData?.vertices}
              edges={graphData?.edges}
              mstEdgesKruskal={kruskalResult?.mstEdges}
              mstEdgesPrim={primResult?.mstEdges}
              animationStep={currentAnimationStep}
              showAnimation={Boolean(traceData)}
              animationAlgorithm={animationAlgorithm}
              startNode={Number(primStartNode)}
            />

            <TransportBar
              traceData={traceData}
              currentStepIndex={currentStepIndex}
              isPlaying={isPlaying}
              animationAlgorithm={animationAlgorithm}
              primStartNode={primStartNode}
              speed={animSpeed}
              onAnimAlgoChange={(val) => {
                setAnimationAlgorithm(val);
                resetAnimation();
              }}
              onPrimStartChange={setPrimStartNode}
              onStart={handleStartAnimation}
              onPlay={handlePlayPause}
              onPrev={() => {
                if (!traceData) return;
                setIsPlaying(false);
                setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
              }}
              onNext={() => {
                if (!traceData) return;
                setIsPlaying(false);
                setCurrentStepIndex((prev) => Math.min(prev + 1, traceData.steps.length - 1));
              }}
              onReset={resetAnimation}
              onSpeedChange={setAnimSpeed}
            />
          </div>

          <div className="stack-column">
            <div className="panel">
              <div className="section-title-row">
                <h2>Graph details</h2>
                <span className="pill subtle">Input preview</span>
              </div>
              <div className="stats-grid compact">
                <StatCard label="Vertices" value={graphData ? graphData.vertices : "—"} />
                <StatCard label="Edges" value={graphData ? graphData.edges.length : "—"} />
                <StatCard label="Extra edges" value={edgeInfo.extraEdges} />
              </div>
              <EdgePreview edges={graphData?.edges ?? []} />
            </div>

            <div className="panel">
              <div className="section-title-row">
                <h2>Single-run comparison</h2>
                <span className="pill subtle">Runtime insight</span>
              </div>
              <p className="summary-text">{fasterText}</p>
              <div className="stats-grid compact">
                <StatCard
                  label="Kruskal"
                  value={results?.kruskal ? `${fmt(results.kruskal.timeMs)} ms` : "—"}
                />
                <StatCard label="Prim" value={results?.prim ? `${fmt(results.prim.timeMs)} ms` : "—"} />
              </div>
              <div style={{ position: "relative", height: 140 }}>
                <canvas ref={barChartRef} role="img" aria-label="Bar chart comparing Kruskal and Prim runtime">
                  Runtime comparison.
                </canvas>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-title-row">
            <h2>Results</h2>
          </div>

          <div className="results-grid">
            <article className="result-card kruskal-card">
              <div className="result-header">
                <h3>Kruskal</h3>
                <span className="badge">Union-Find</span>
              </div>
              <p>
                Connected: <strong>{kruskalResult ? (kruskalResult.connected ? "Yes" : "No") : "—"}</strong>
              </p>
              <p>
                MST weight: <strong>{kruskalResult ? kruskalResult.totalWeight : "—"}</strong>
              </p>
              <p>
                MST edges: <strong>{kruskalResult ? kruskalResult.mstEdges.length : "—"}</strong>
              </p>
              <p>
                Runtime: <strong>{results?.kruskal ? `${fmt(results.kruskal.timeMs)} ms` : "—"}</strong>
              </p>
            </article>

            <article className="result-card prim-card">
              <div className="result-header">
                <h3>Prim</h3>
                <span className="badge">Min-Heap</span>
              </div>
              <p>
                Connected: <strong>{primResult ? (primResult.connected ? "Yes" : "No") : "—"}</strong>
              </p>
              <p>
                MST weight: <strong>{primResult ? primResult.totalWeight : "—"}</strong>
              </p>
              <p>
                MST edges: <strong>{primResult ? primResult.mstEdges.length : "—"}</strong>
              </p>
              <p>
                Runtime: <strong>{results?.prim ? `${fmt(results.prim.timeMs)} ms` : "—"}</strong>
              </p>
            </article>
          </div>
        </section>

        <BenchmarkSection />
      </main>
    </div>
  );
}