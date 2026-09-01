const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");

const router = express.Router();

// POST /api/edges — connect two nodes with a walkable path (admin tool).
// distanceMeters should be measured/paced out by the admin during mapping.
router.post("/", (req, res) => {
  const { fromNodeId, toNodeId, distanceMeters, instruction, hazard, oneWay } = req.body;
  if (!fromNodeId || !toNodeId || distanceMeters === undefined) {
    return res.status(400).json({ error: "fromNodeId, toNodeId, distanceMeters are required" });
  }

  const edge = {
    id: uuidv4(),
    fromNodeId,
    toNodeId,
    distanceMeters,
    instruction: instruction || null,
    hazard: hazard || null,
    oneWay: !!oneWay,
  };

  db.get("edges").push(edge).write();
  res.status(201).json(edge);
});

// GET /api/edges/floor/:floorId — all edges whose endpoints are on this
// floor. Needed so the admin tool can reload a floor's full graph (nodes +
// edges) after a page refresh, not just whatever was created this session.
router.get("/floor/:floorId", (req, res) => {
  const floorNodeIds = new Set(
    db.get("nodes").filter({ floorId: req.params.floorId }).map("id").value()
  );
  const edges = db
    .get("edges")
    .filter((e) => floorNodeIds.has(e.fromNodeId) || floorNodeIds.has(e.toNodeId))
    .value();
  res.json(edges);
});

// DELETE /api/edges/:id — remove a connection (admin tool, for fixing mistakes)
router.delete("/:id", (req, res) => {
  db.get("edges").remove({ id: req.params.id }).write();
  res.status(204).send();
});

module.exports = router;
