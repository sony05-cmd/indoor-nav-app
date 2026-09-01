import { useEffect, useState, useCallback } from "react";
import { api, getBaseUrl, setBaseUrl } from "./api";
import Sidebar from "./components/Sidebar";
import Canvas from "./components/Canvas";
import NodeForm from "./components/NodeForm";
import EdgeForm from "./components/EdgeForm";
import { openQrPrintSheet } from "./components/qrPrintSheet";
import "./App.css";

export default function App() {
  const [baseUrl, setBaseUrlState] = useState(getBaseUrl());
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [floors, setFloors] = useState([]);
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const [mode, setMode] = useState("place");
  const [pendingFrom, setPendingFrom] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const [pendingNodePos, setPendingNodePos] = useState(null); // { x, y } awaiting the NodeForm
  const [pendingEdgePair, setPendingEdgePair] = useState(null); // { from, to } awaiting the EdgeForm (create)
  const [editingEdge, setEditingEdge] = useState(null); // { edge, from, to } awaiting the EdgeForm (edit)

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Loading data -----------------------------------------------------
  const loadBuildings = useCallback(async () => {
    try {
      const data = await api.getBuildings();
      setBuildings(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadBuildings();
  }, [loadBuildings]);

  const loadBuildingDetail = useCallback(async (buildingId) => {
    if (!buildingId) return;
    try {
      const building = await api.getBuilding(buildingId);
      setFloors(building.floors || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (selectedBuildingId) loadBuildingDetail(selectedBuildingId);
    else {
      setFloors([]);
      setSelectedFloorId(null);
    }
  }, [selectedBuildingId, loadBuildingDetail]);

  const refreshFloorGraph = useCallback(async () => {
    if (!selectedBuildingId || !selectedFloorId) return;
    try {
      const building = await api.getBuilding(selectedBuildingId);
      const floor = (building.floors || []).find((f) => f.id === selectedFloorId);
      setNodes(floor?.nodes || []);

      const floorEdges = await api.getEdgesByFloor(selectedFloorId);
      setEdges(floorEdges);
    } catch (err) {
      setError(err.message);
    }
  }, [selectedBuildingId, selectedFloorId]);

  useEffect(() => {
    refreshFloorGraph();
  }, [selectedFloorId, refreshFloorGraph]);

  // --- Building / floor creation -----------------------------------------
  const handleCreateBuilding = async () => {
    const name = prompt("Building name:");
    if (!name) return;
    try {
      const building = await api.createBuilding({ name });
      await loadBuildings();
      setSelectedBuildingId(building.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateFloor = async () => {
    const name = prompt("Floor name (e.g. Ground Floor):");
    if (!name) return;
    const levelStr = prompt("Floor level number (0 = ground, 1 = first floor, -1 = basement):", "0");
    if (levelStr === null) return;
    try {
      const floor = await api.createFloor(selectedBuildingId, { name, level: parseInt(levelStr, 10) || 0 });
      await loadBuildingDetail(selectedBuildingId);
      setSelectedFloorId(floor.id);
    } catch (err) {
      setError(err.message);
    }
  };

  // --- Canvas interaction --------------------------------------------------
  const handleCanvasClick = (x, y) => {
    setPendingNodePos({ x, y });
  };

  const handleNodeFormSubmit = async ({ name, type }) => {
    try {
      const node = await api.createNode({
        floorId: selectedFloorId,
        name,
        type,
        x: pendingNodePos.x,
        y: pendingNodePos.y,
      });
      setNodes((prev) => [...prev, node]);
      setPendingNodePos(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleNodeClick = (node) => {
    if (mode !== "connect") return;
    if (!pendingFrom) {
      setPendingFrom(node);
      return;
    }
    if (pendingFrom.id === node.id) {
      setPendingFrom(null); // clicked the same node twice, cancel
      return;
    }
    setPendingEdgePair({ from: pendingFrom, to: node });
    setPendingFrom(null);
  };

  const handleEdgeFormSubmit = async (fields) => {
    try {
      const edge = await api.createEdge({
        fromNodeId: pendingEdgePair.from.id,
        toNodeId: pendingEdgePair.to.id,
        ...fields,
      });
      setEdges((prev) => [...prev, edge]);
      setPendingEdgePair(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdgeClickOnCanvas = (edge, from, to) => {
    setEditingEdge({ edge, from, to });
  };

  const handleEditEdgeFromSidebar = (edge) => {
    const from = nodes.find((n) => n.id === edge.fromNodeId);
    const to = nodes.find((n) => n.id === edge.toNodeId);
    if (from && to) setEditingEdge({ edge, from, to });
  };

  const handleEdgeEditSubmit = async (fields) => {
    try {
      const updated = await api.updateEdge(editingEdge.edge.id, fields);
      setEdges((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setEditingEdge(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteNode = async (id) => {
    if (!confirm("Delete this node? Connected edges will also be removed.")) return;
    try {
      await api.deleteNode(id);
      setNodes((prev) => prev.filter((n) => n.id !== id));
      setEdges((prev) => prev.filter((e) => e.fromNodeId !== id && e.toNodeId !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteEdge = async (id) => {
    try {
      await api.deleteEdge(id);
      setEdges((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditBaseUrl = (url) => {
    setBaseUrlState(url);
    setBaseUrl(url);
  };

  return (
    <div className="app">
      <Sidebar
        buildings={buildings}
        selectedBuildingId={selectedBuildingId}
        onSelectBuilding={setSelectedBuildingId}
        onCreateBuilding={handleCreateBuilding}
        floors={floors}
        selectedFloorId={selectedFloorId}
        onSelectFloor={setSelectedFloorId}
        onCreateFloor={handleCreateFloor}
        nodes={nodes}
        edges={edges}
        onEditEdge={handleEditEdgeFromSidebar}
        mode={mode}
        onSetMode={(m) => {
          setMode(m);
          setPendingFrom(null);
        }}
        onDeleteNode={handleDeleteNode}
        onDeleteEdge={handleDeleteEdge}
        onPrintQr={() => openQrPrintSheet(nodes, floors.find((f) => f.id === selectedFloorId)?.name || "Floor")}
        baseUrl={baseUrl}
        onEditBaseUrl={handleEditBaseUrl}
      />

      <main className="main">
        {error && (
          <div className="error-banner" onClick={() => setError(null)}>
            {error} (click to dismiss)
          </div>
        )}
        {!selectedFloorId ? (
          <div className="empty-state">
            <h2>Select or create a building and floor to start mapping</h2>
            <p>Nodes are the decision points a user needs — junctions, room doors, stairs. Edges connect them.</p>
          </div>
        ) : (
          <Canvas
            nodes={nodes}
            edges={edges}
            mode={mode}
            pendingFrom={pendingFrom}
            selectedNodeId={selectedNodeId}
            onCanvasClick={handleCanvasClick}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClickOnCanvas}
          />
        )}
      </main>

      {pendingNodePos && <NodeForm onSubmit={handleNodeFormSubmit} onClose={() => setPendingNodePos(null)} />}
      {pendingEdgePair && (
        <EdgeForm
          fromNode={pendingEdgePair.from}
          toNode={pendingEdgePair.to}
          onSubmit={handleEdgeFormSubmit}
          onClose={() => setPendingEdgePair(null)}
        />
      )}
      {editingEdge && (
        <EdgeForm
          fromNode={editingEdge.from}
          toNode={editingEdge.to}
          existingEdge={editingEdge.edge}
          onSubmit={handleEdgeEditSubmit}
          onClose={() => setEditingEdge(null)}
        />
      )}
    </div>
  );
}
