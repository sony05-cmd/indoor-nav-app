const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { getDB } = require("../db");

const router = express.Router();

// POST /api/edges — connect two nodes with a walkable path (admin tool).
// distanceMeters should be measured/paced out by the admin during mapping.
router.post("/", async (req, res) => {
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

  await getDB().collection("edges").insertOne(edge);
  delete edge._id;
  res.status(201).json(edge);
});

// GET /api/edges/floor/:floorId — all edges whose endpoints are on this
// floor. Needed so the admin tool can reload a floor's full graph (nodes +
// edges) after a page refresh, not just whatever was created this session.
router.get("/floor/:floorId", async (req, res) => {
  const db = getDB();
  const floorNodes = await db.collection("nodes").find({ floorId: req.params.floorId }).toArray();
  const floorNodeIds = floorNodes.map((n) => n.id);

  const edges = await db
    .collection("edges")
    .find(
      { $or: [{ fromNodeId: { $in: floorNodeIds } }, { toNodeId: { $in: floorNodeIds } }] },
      { projection: { _id: 0 } }
    )
    .toArray();
  res.json(edges);
});

// PATCH /api/edges/:id — update an existing edge's distance/instruction/
// hazard/oneWay (admin tool, for fixing mistakes without delete+recreate)
router.patch("/:id", async (req, res) => {
  const { distanceMeters, instruction, hazard, oneWay } = req.body;
  const db = getDB();
  const edge = await db.collection("edges").findOne({ id: req.params.id }, { projection: { _id: 0 } });
  if (!edge) return res.status(404).json({ error: "not found" });

  const updates = {};
  if (distanceMeters !== undefined) updates.distanceMeters = distanceMeters;
  if (instruction !== undefined) updates.instruction = instruction || null;
  if (hazard !== undefined) updates.hazard = hazard || null;
  if (oneWay !== undefined) updates.oneWay = !!oneWay;

  await db.collection("edges").updateOne({ id: req.params.id }, { $set: updates });
  res.json({ ...edge, ...updates });
});

// DELETE /api/edges/:id — remove a connection (admin tool, for fixing mistakes)
router.delete("/:id", async (req, res) => {
  await getDB().collection("edges").deleteOne({ id: req.params.id });
  res.status(204).send();
});

module.exports = router;