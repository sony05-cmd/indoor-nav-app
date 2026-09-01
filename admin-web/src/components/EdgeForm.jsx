import { useState } from "react";
import Modal from "./Modal";

export default function EdgeForm({ fromNode, toNode, existingEdge, onSubmit, onClose }) {
  const [distance, setDistance] = useState(existingEdge ? String(existingEdge.distanceMeters) : "");
  const [instruction, setInstruction] = useState(existingEdge?.instruction || "");
  const [hazard, setHazard] = useState(existingEdge?.hazard || "");
  const [oneWay, setOneWay] = useState(existingEdge?.oneWay || false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const distanceMeters = parseFloat(distance);
    if (!distanceMeters || distanceMeters <= 0) return;
    onSubmit({
      distanceMeters,
      instruction: instruction.trim() || null,
      hazard: hazard.trim() || null,
      oneWay,
    });
  };

  return (
    <Modal title={`${existingEdge ? "Edit" : "Connect"} "${fromNode.name}" → "${toNode.name}"`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="edge-distance">Distance (meters, paced out in the real building)</label>
          <input
            id="edge-distance"
            autoFocus
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 8.5"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="edge-instruction">Spoken instruction (optional)</label>
          <input
            id="edge-instruction"
            placeholder="e.g. walk straight, then turn right"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="edge-hazard">Hazard warning (optional)</label>
          <input
            id="edge-hazard"
            placeholder="e.g. uneven flooring near the doorway"
            value={hazard}
            onChange={(e) => setHazard(e.target.value)}
          />
        </div>
        <div className="field field-checkbox">
          <label htmlFor="edge-oneway" className="checkbox-label">
            <input
              id="edge-oneway"
              type="checkbox"
              style={{ width: "auto" }}
              checked={oneWay}
              onChange={(e) => setOneWay(e.target.checked)}
            />
            One-way only (e.g. a turnstile)
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            {existingEdge ? "Save changes" : "Connect"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
