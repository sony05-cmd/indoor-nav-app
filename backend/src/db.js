const { MongoClient } = require("mongodb");

// A single shared MongoDB connection, established once when the server
// starts (see server.js) and reused by every route. Unlike the old
// lowdb setup, this is a real network connection to a cloud database —
// data persists independently of Render's ephemeral filesystem, so it
// survives redeploys and free-tier sleep/wake cycles.
//
// Every document keeps its own app-level `id` (a uuid string) as its
// primary key — the rest of the codebase (pathfinding.js, the admin
// tool, the mobile app) already works in terms of these uuids, so we
// query by `{ id: ... }` instead of MongoDB's own `_id`. This kept the
// migration from the JSON-file version much smaller.

let db = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to your .env file (local dev) or your Render environment variables (production)."
    );
  }

  const client = new MongoClient(uri);
  await client.connect();

  // The database name comes from the URI path (e.g. `.../indoor-nav?...`
  // → "indoor-nav"). If none was given, fall back to a sensible default.
  db = client.db(); // uses the db name embedded in the URI

  // Indexes: uniqueness where the app depends on it, plus lookup speed
  // for the fields every query filters on.
  await db.collection("nodes").createIndex({ qrCode: 1 }, { unique: true });
  await db.collection("nodes").createIndex({ floorId: 1 });
  await db.collection("floors").createIndex({ buildingId: 1 });
  await db.collection("edges").createIndex({ fromNodeId: 1 });
  await db.collection("edges").createIndex({ toNodeId: 1 });

  console.log(`Connected to MongoDB database: ${db.databaseName}`);
  return db;
}

function getDB() {
  if (!db) {
    throw new Error("Database not connected yet — connectDB() must be awaited before getDB() is called.");
  }
  return db;
}

module.exports = { connectDB, getDB };