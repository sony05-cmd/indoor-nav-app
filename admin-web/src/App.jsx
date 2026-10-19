import { useEffect, useState, useCallback } from "react";
import { api, getBaseUrl, setBaseUrl } from "./api";
import Sidebar from "./components/Sidebar";
import Canvas from "./components/Canvas";
import NodeForm from "./components/NodeForm";
import EdgeForm from "./components/EdgeForm";
import Modal from "./components/Modal";
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

  // Cross-floor linking
  const [linkingFrom, setLinkingFrom] = useState(null); // node we are linking FROM
  const [otherFloorId, setOtherFloorId] = useState("");
  const [otherNodeId, setOtherNodeId] = useState("");

  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

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
    if (!buildingId) return [];
    try {
      const building = await api.getBuilding(buildingId);
      setFloors(building.floors || []);
      return building.floors || [];
    } catch (err) {
      setError(err.message);
      return [];
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
      const floorNodes = floor?.nodes || [];
      setNodes(floorNodes);

      // Only draw edges whose two ends are both on THIS floor. Cross-floor
      // links (stairs/lift) exist in the database but can't be drawn on a
      // single-floor canvas.
      const ids = new Set(floorNodes.map((n) => n.id));
      const floorEdges = await api.getEdgesByFloor(selectedFloorId);
      setEdges(floorEdges.filter((e) => ids.has(e.fromNodeId) && ids.has(e.toNodeId)));
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
      const onThisFloor =
        nodes.some((n) => n.id === edge.fromNodeId) && nodes.some((n) => n.id === edge.toNodeId);
      if (onThisFloor) {
        setEdges((prev) => [...prev, edge]);
      } else {
        setNotice(
          `Linked "${pendingEdgePair.from.name}" to "${pendingEdgePair.to.name}" on another floor.`
        );
      }
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

  // --- Cross-floor linking ---------------------------------------------------
  const startCrossFloorLink = async () => {
    const from = pendingFrom;
    setPendingFrom(null);
    // refresh so nodes created on other floors are included
    await loadBuildingDetail(selectedBuildingId);
    setOtherFloorId("");
    setOtherNodeId("");
    setLinkingFrom(from);
  };

  const otherFloors = floors.filter((f) => f.id !== selectedFloorId);
  const otherFloorNodes = floors.find((f) => f.id === otherFloorId)?.nodes || [];

  const continueCrossFloorLink = () => {
    const target = otherFloorNodes.find((n) => n.id === otherNodeId);
    if (!target || !linkingFrom) return;
    setPendingEdgePair({ from: linkingFrom, to: target });
    setLinkingFrom(null);
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
        {notice && (
          <div className="error-banner" style={{ background: "#14532d" }} onClick={() => setNotice(null)}>
            {notice} (click to dismiss)
          </div>
        )}

        {mode === "connect" && pendingFrom && (
          <div style={{ padding: "10px 16px" }}>
            <button className="primary" onClick={startCrossFloorLink}>
              Link "{pendingFrom.name}" to a node on another floor
            </button>
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

      {linkingFrom && (
        <Modal title={`Link "${linkingFrom.name}" to another floor`} onClose={() => setLinkingFrom(null)}>
          <div className="field">
            <label htmlFor="other-floor">Floor</label>
            <select
              id="other-floor"
              value={otherFloorId}
              onChange={(e) => {
                setOtherFloorId(e.target.value);
                setOtherNodeId("");
              }}
            >
              <option value="">Choose a floor…</option>
              {otherFloors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="other-node">Node on that floor (e.g. the stairs)</label>
            <select id="other-node" value={otherNodeId} onChange={(e) => setOtherNodeId(e.target.value)}>
              <option value="">Choose a node…</option>
              {otherFloorNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setLinkingFrom(null)}>
              Cancel
            </button>
            <button type="button" className="primary" disabled={!otherNodeId} onClick={continueCrossFloorLink}>
              Next
            </button>
          </div>
        </Modal>
      )}

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