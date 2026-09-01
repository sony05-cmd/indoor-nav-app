const express = require("express");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const { getDB } = require("../db");

const router = express.Router();

// POST /api/nodes — create a node (admin tool, when mapping a building).
// Automatically generates a unique qrCode value; the admin then prints
// this as a QR code and sticks it at the physical location.
router.post("/", async (req, res) => {
  const { floorId, name, type, x, y, isDestination } = req.body;
  if (!floorId || !name || !type || x === undefined || y === undefined) {
    return res.status(400).json({ error: "floorId, name, type, x, y are required" });
  }

  const node = {
    id: uuidv4(),
    floorId,
    name,
    type,
    qrCode: `NODE-${uuidv4()}`, // this string is what gets encoded into the QR image
    x,
    y,
    isDestination: isDestination === false ? false : true,
  };

  await getDB().collection("nodes").insertOne(node);
  delete node._id;
  res.status(201).json(node);
});

// GET /api/nodes/:id/qrcode — returns a PNG QR code image encoding this
// node's qrCode string. Admin prints this and sticks it at the location.
router.get("/:id/qrcode", async (req, res) => {
  const node = await getDB().collection("nodes").findOne({ id: req.params.id });
  if (!node) return res.status(404).json({ error: "not found" });

  const pngBuffer = await QRCode.toBuffer(node.qrCode, { width: 400, margin: 2 });
  res.set("Content-Type", "image/png");
  res.send(pngBuffer);
});

// GET /api/nodes/lookup/:qrCode — the app calls this right after scanning
// a QR code, to resolve "what node did the user just scan?"
router.get("/lookup/:qrCode", async (req, res) => {
  const db = getDB();
  const node = await db.collection("nodes").findOne({ qrCode: req.params.qrCode }, { projection: { _id: 0 } });
  if (!node) return res.status(404).json({ error: "unrecognized QR code" });

  const floor = await db.collection("floors").findOne({ id: node.floorId }, { projection: { _id: 0 } });
  const building = floor
    ? await db.collection("buildings").findOne({ id: floor.buildingId }, { projection: { _id: 0 } })
    : null;

  res.json({ ...node, floor: floor ? { ...floor, building } : null });
});

// GET /api/nodes/floor/:floorId — all destinations on a floor, for voice
// search ("take me to Room 204") to match against
router.get("/floor/:floorId", async (req, res) => {
  const nodes = await getDB()
    .collection("nodes")
    .find({ floorId: req.params.floorId }, { projection: { _id: 0 } })
    .toArray();
  res.json(nodes);
});

// DELETE /api/nodes/:id — remove a node (admin tool). Also cascades to
// remove any edges that reference it, so the graph never has dangling
// edges pointing at a node that no longer exists.
router.delete("/:id", async (req, res) => {
  const db = getDB();
  await db.collection("nodes").deleteOne({ id: req.params.id });
  await db.collection("edges").deleteMany({ $or: [{ fromNodeId: req.params.id }, { toNodeId: req.params.id }] });
  res.status(204).send();
});

module.exports = router;