import { useState } from "react";
import Modal from "./Modal";

const NODE_TYPES = ["junction", "room", "entrance", "stairs", "lift"];

export default function NodeForm({ onSubmit, onClose }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("junction");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), type });
  };

  return (
    <Modal title="New node" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="node-name">Name</label>
          <input
            id="node-name"
            autoFocus
            placeholder="e.g. Room 204 entrance"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="node-type">Type</label>
          <select id="node-type" value={type} onChange={(e) => setType(e.target.value)}>
            {NODE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            Place node
          </button>
        </div>
      </form>
    </Modal>
  );
}
