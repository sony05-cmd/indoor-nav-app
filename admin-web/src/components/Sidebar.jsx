export default function Sidebar({
  buildings,
  selectedBuildingId,
  onSelectBuilding,
  onCreateBuilding,
  floors,
  selectedFloorId,
  onSelectFloor,
  onCreateFloor,
  nodes,
  edges,
  onEditEdge,
  mode,
  onSetMode,
  onDeleteNode,
  onDeleteEdge,
  onPrintQr,
  baseUrl,
  onEditBaseUrl,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Indoor Nav</h1>
        <p className="subtitle">Building mapper</p>
      </div>

      <section className="sidebar-section">
        <label htmlFor="building-select">Building</label>
        <div className="row">
          <select
            id="building-select"
            value={selectedBuildingId || ""}
            onChange={(e) => onSelectBuilding(e.target.value)}
          >
            <option value="" disabled>
              select a building
            </option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button onClick={onCreateBuilding} title="Add building">
            +
          </button>
        </div>
      </section>

      {selectedBuildingId && (
        <section className="sidebar-section">
          <label htmlFor="floor-select">Floor</label>
          <div className="row">
            <select id="floor-select" value={selectedFloorId || ""} onChange={(e) => onSelectFloor(e.target.value)}>
              <option value="" disabled>
                select a floor
              </option>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <button onClick={onCreateFloor} title="Add floor">
              +
            </button>
          </div>
        </section>
      )}

      {selectedFloorId && (
        <>
          <section className="sidebar-section">
            <label>Mode</label>
            <div className="mode-toggle">
              <button className={mode === "place" ? "primary" : ""} onClick={() => onSetMode("place")}>
                Place nodes
              </button>
              <button className={mode === "connect" ? "primary" : ""} onClick={() => onSetMode("connect")}>
                Connect nodes
              </button>
            </div>
            <p className="hint">
              {mode === "place"
                ? "Click anywhere on the canvas to add a node."
                : "Click one node, then another, to connect them."}
            </p>
          </section>

          <section className="sidebar-section scroll">
            <label>Nodes ({nodes.length})</label>
            <ul className="list">
              {nodes.map((n) => (
                <li key={n.id}>
                  <span>{n.name}</span>
                  <button className="danger small" onClick={() => onDeleteNode(n.id)}>
                    ✕
                  </button>
                </li>
              ))}
              {nodes.length === 0 && <li className="empty">No nodes yet</li>}
            </ul>
          </section>

          <section className="sidebar-section scroll">
            <label>Edges ({edges.length})</label>
            <ul className="list">
              {edges.map((e) => (
                <li key={e.id}>
                  <span className="edge-item" onClick={() => onEditEdge(e)} title="Click to edit">
                    {e.distanceMeters}m{e.hazard ? " ⚠" : ""}
                    {e.instruction ? "" : " · no instruction"}
                  </span>
                  <button className="danger small" onClick={() => onDeleteEdge(e.id)}>
                    ✕
                  </button>
                </li>
              ))}
              {edges.length === 0 && <li className="empty">No edges yet</li>}
            </ul>
          </section>

          <section className="sidebar-section">
            <button className="primary full-width" onClick={onPrintQr} disabled={nodes.length === 0}>
              Print QR sheet
            </button>
          </section>
        </>
      )}

      <section className="sidebar-section settings">
        <label htmlFor="base-url">Backend URL</label>
        <input id="base-url" value={baseUrl} onChange={(e) => onEditBaseUrl(e.target.value)} />
      </section>
    </aside>
  );
}
