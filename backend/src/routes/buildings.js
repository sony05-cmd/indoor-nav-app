const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { getDB } = require("../db");

const router = express.Router();

// GET /api/buildings — list all buildings, each with its floors
router.get("/", async (req, res) => {
  const db = getDB();
  const buildings = await db.collection("buildings").find({}, { projection: { _id: 0 } }).toArray();
  const floors = await db.collection("floors").find({}, { projection: { _id: 0 } }).toArray();

  const result = buildings.map((b) => ({
    ...b,
    floors: floors.filter((f) => f.buildingId === b.id),
  }));
  res.json(result);
});

// POST /api/buildings — create a new building (admin tool)
router.post("/", async (req, res) => {
  const { name, address } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });

  const building = { id: uuidv4(), name, address: address || null };
  await getDB().collection("buildings").insertOne(building);
  delete building._id;
  res.status(201).json(building);
});

// POST /api/buildings/:id/floors — add a floor to a building (admin tool)
router.post("/:id/floors", async (req, res) => {
  const { id } = req.params;
  const { level, name } = req.body;
  if (level === undefined || !name) {
    return res.status(400).json({ error: "level and name are required" });
  }

  const floor = { id: uuidv4(), buildingId: id, level, name };
  await getDB().collection("floors").insertOne(floor);
  delete floor._id;
  res.status(201).json(floor);
});

// GET /api/buildings/:id — full building detail (floors + nodes), used by
// the admin map editor to render everything at once
router.get("/:id", async (req, res) => {
  const db = getDB();
  const building = await db.collection("buildings").findOne({ id: req.params.id }, { projection: { _id: 0 } });
  if (!building) return res.status(404).json({ error: "not found" });

  const floors = await db.collection("floors").find({ buildingId: building.id }, { projection: { _id: 0 } }).toArray();
  const nodes = await db
    .collection("nodes")
    .find({ floorId: { $in: floors.map((f) => f.id) } }, { projection: { _id: 0 } })
    .toArray();

  const floorsWithNodes = floors.map((f) => ({
    ...f,
    nodes: nodes.filter((n) => n.floorId === f.id),
  }));

  res.json({ ...building, floors: floorsWithNodes });
});

module.exports = router;