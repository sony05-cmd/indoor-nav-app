const express = require("express");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");

const router = express.Router();

// POST /api/nodes — create a node (admin tool, when mapping a building).
// Automatically generates a unique qrCode value; the admin then prints
// this as a QR code and sticks it at the physical location.
router.post("/", (req, res) => {
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

  db.get("nodes").push(node).write();
  res.status(201).json(node);
});

// GET /api/nodes/:id/qrcode — returns a PNG QR code image encoding this
// node's qrCode string. Admin prints this and sticks it at the location.
router.get("/:id/qrcode", async (req, res) => {
  const node = db.get("nodes").find({ id: req.params.id }).value();
  if (!node) return res.status(404).json({ error: "not found" });

  const pngBuffer = await QRCode.toBuffer(node.qrCode, { width: 400, margin: 2 });
  res.set("Content-Type", "image/png");
  res.send(pngBuffer);
});

// GET /api/nodes/lookup/:qrCode — the app calls this right after scanning
// a QR code, to resolve "what node did the user just scan?"
router.get("/lookup/:qrCode", (req, res) => {
  const node = db.get("nodes").find({ qrCode: req.params.qrCode }).value();
  if (!node) return res.status(404).json({ error: "unrecognized QR code" });

  const floor = db.get("floors").find({ id: node.floorId }).value();
  const building = floor ? db.get("buildings").find({ id: floor.buildingId }).value() : null;

  res.json({ ...node, floor: floor ? { ...floor, building } : null });
});

// GET /api/nodes/floor/:floorId — all destinations on a floor, for voice
// search ("take me to Room 204") to match against
router.get("/floor/:floorId", (req, res) => {
  const nodes = db.get("nodes").filter({ floorId: req.params.floorId }).value();
  res.json(nodes);
});

module.exports = router;
