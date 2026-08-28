const express = require("express");
const db = require("../db");
const { findShortestPath } = require("../utils/pathfinding");

const router = express.Router();

// GET /api/navigate?buildingId=...&startNodeId=...&endNodeId=...
//
// This is the single most important endpoint in the whole app: the mobile
// app calls it right after the user scans a QR (giving startNodeId) and
// picks/speaks a destination (giving endNodeId). It returns turn-by-turn
// audio-ready instructions.
//
// Cross-floor routing works automatically once you add Edge rows
// connecting a "stairs-bottom" node on floor 1 to a "stairs-top" node on
// floor 2 — the stairs/lift IS the edge between floors.
router.get("/", (req, res) => {
  const { buildingId, startNodeId, endNodeId } = req.query;
  if (!buildingId || !startNodeId || !endNodeId) {
    return res.status(400).json({ error: "buildingId, startNodeId, endNodeId are required" });
  }

  const floorIds = db.get("floors").filter({ buildingId }).map("id").value();
  if (floorIds.length === 0) return res.status(404).json({ error: "building has no floors" });

  const nodes = db.get("nodes").filter((n) => floorIds.includes(n.floorId)).value();
  const nodeIds = nodes.map((n) => n.id);
  const edges = db.get("edges").filter((e) => nodeIds.includes(e.fromNodeId)).value();

  const result = findShortestPath(nodes, edges, startNodeId, endNodeId);
  if (!result) {
    return res.status(404).json({ error: "no walkable path found between these points" });
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const spokenSteps = result.steps.map((step, i) => {
    const toNode = nodeById.get(step.toNodeId);
    let text = step.instruction || `continue toward ${toNode.name}`;
    if (step.hazard) text += `. Caution: ${step.hazard}`;
    return { stepNumber: i + 1, text, toNodeName: toNode.name };
  });

  res.json({
    path: result.path,
    totalDistanceMeters: Math.round(result.totalDistance * 10) / 10,
    steps: spokenSteps,
    destinationName: nodeById.get(endNodeId)?.name,
  });
});

module.exports = router;
