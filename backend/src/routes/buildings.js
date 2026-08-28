const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");

const router = express.Router();

// GET /api/buildings — list all buildings, each with its floors
router.get("/", (req, res) => {
  const buildings = db.get("buildings").value();
  const result = buildings.map((b) => ({
    ...b,
    floors: db.get("floors").filter({ buildingId: b.id }).value(),
  }));
  res.json(result);
});

// POST /api/buildings — create a new building (admin tool)
router.post("/", (req, res) => {
  const { name, address } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });

  const building = { id: uuidv4(), name, address: address || null };
  db.get("buildings").push(building).write();
  res.status(201).json(building);
});

// POST /api/buildings/:id/floors — add a floor to a building (admin tool)
router.post("/:id/floors", (req, res) => {
  const { id } = req.params;
  const { level, name } = req.body;
  if (level === undefined || !name) {
    return res.status(400).json({ error: "level and name are required" });
  }

  const floor = { id: uuidv4(), buildingId: id, level, name };
  db.get("floors").push(floor).write();
  res.status(201).json(floor);
});

// GET /api/buildings/:id — full building detail (floors + nodes), used by
// the admin map editor to render everything at once
router.get("/:id", (req, res) => {
  const building = db.get("buildings").find({ id: req.params.id }).value();
  if (!building) return res.status(404).json({ error: "not found" });

  const floors = db.get("floors").filter({ buildingId: building.id }).value();
  const floorsWithNodes = floors.map((f) => ({
    ...f,
    nodes: db.get("nodes").filter({ floorId: f.id }).value(),
  }));

  res.json({ ...building, floors: floorsWithNodes });
});

module.exports = router;
