import { useRef } from "react";

const NODE_COLORS = {
  entrance: "#f2a93b",
  junction: "#eaf2fb",
  room: "#4fd1c5",
  stairs: "#c792ea",
  lift: "#c792ea",
};

// The floor-plan canvas. Click empty space to place a node (in "place"
// mode); click one node then another to connect them (in "connect" mode).
// Coordinates are plain SVG pixels — this tool doesn't need real-world
// scale calibration since edge *distances* are typed in by the admin
// separately (paced out in the real building), not derived from pixels.
export default function Canvas({ nodes, edges, mode, pendingFrom, onCanvasClick, onNodeClick, onEdgeClick, selectedNodeId }) {
  const svgRef = useRef(null);

  const handleBackgroundClick = (e) => {
    if (mode !== "place") return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    onCanvasClick(x, y);
  };

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg
      ref={svgRef}
      className="canvas"
      onClick={handleBackgroundClick}
      style={{ cursor: mode === "place" ? "crosshair" : "default" }}
    >
      <defs>
        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="var(--grid-line)" strokeWidth="1" />
        </pattern>
        <pattern id="grid-major" width="120" height="120" patternUnits="userSpaceOnUse">
          <rect width="120" height="120" fill="url(#grid)" />
          <path d="M 120 0 L 0 0 0 120" fill="none" stroke="var(--grid-line-strong)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-major)" />

      {/* Edges drawn first so nodes sit visually on top */}
      {edges.map((edge) => {
        const from = nodeById.get(edge.fromNodeId);
        const to = nodeById.get(edge.toNodeId);
        if (!from || !to) return null;
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        return (
          <g
            key={edge.id}
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              onEdgeClick(edge, from, to);
            }}
          >
            {/* wide invisible hit area, since the visible line is thin */}
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="transparent" strokeWidth="16" />
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={edge.hazard ? "var(--danger)" : "var(--edge)"}
              strokeWidth="2.5"
              strokeDasharray={edge.oneWay ? "6 4" : undefined}
            />
            <text x={midX} y={midY - 6} fill="var(--ink-dim)" fontSize="11" textAnchor="middle">
              {edge.distanceMeters}m
            </text>
          </g>
        );
      })}

      {/* Rubber-band preview line while connecting two nodes */}
      {mode === "connect" && pendingFrom && (
        <text x={pendingFrom.x} y={pendingFrom.y - 20} fill="var(--accent)" fontSize="12" textAnchor="middle">
          click destination node…
        </text>
      )}

      {nodes.map((node) => {
        const isSelected = node.id === selectedNodeId;
        const isPending = pendingFrom?.id === node.id;
        return (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            onClick={(e) => {
              e.stopPropagation();
              onNodeClick(node);
            }}
            style={{ cursor: "pointer" }}
          >
            <circle
              r={isSelected || isPending ? 11 : 8}
              fill={NODE_COLORS[node.type] || "var(--ink)"}
              stroke={isSelected || isPending ? "var(--accent)" : "var(--bg)"}
              strokeWidth="2.5"
            />
            <text y="-16" fill="var(--ink)" fontSize="12" textAnchor="middle" fontFamily="Space Grotesk, sans-serif">
              {node.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
