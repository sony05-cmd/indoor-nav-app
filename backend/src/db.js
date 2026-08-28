const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const path = require("path");
const fs = require("fs");

// A single JSON file on disk acts as the database. No compiler, no native
// bindings, no Python/build-tools needed — just plain JS reading/writing a
// file. This trades raw performance for zero-setup reliability, which is
// the right trade for a student project with at most a few hundred nodes
// per building. If you outgrow this, swap this file for a real DB client
// (Postgres, etc.) — every route only calls the functions below, so
// nothing else in the app needs to change.
//
// The file lives in a dedicated data/ folder (not the project root) so it
// can be pointed at a persistent disk when hosted (see render.yaml) —
// otherwise a redeploy would wipe out everything the admin mapped.
const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const adapter = new FileSync(path.join(dataDir, "data.json"));
const db = low(adapter);

// Default shape of the database if data.json doesn't exist yet.
db.defaults({ buildings: [], floors: [], nodes: [], edges: [] }).write();

module.exports = db;
