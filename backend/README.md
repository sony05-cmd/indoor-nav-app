# Indoor Navigation — Backend

REST API powering an accessible indoor navigation app for visually impaired
users. Buildings are modeled as a graph (nodes = decision points, edges =
walkable paths); the API finds the shortest path with Dijkstra's algorithm
and returns turn-by-turn, hazard-aware instructions ready for
text-to-speech.

## Stack
- Node.js + Express
- `lowdb` (a JSON file acting as the database — zero setup, no native
  compilation, works identically on Windows/Mac/Linux). Easy to swap for a
  real DB later by rewriting `src/db.js`; every route only calls the
  functions it exports, so nothing else needs to change.
- `qrcode` npm package for generating QR sticker images

## Setup
```bash
npm install
npm run dev      # starts on http://localhost:4000, auto-restarts on save
# or
npm start        # plain node, no auto-restart
```
The database file (`data.json`) is created automatically on first run — no
migration step, no compiler, no Python/build-tools needed.

## Data model
```
Building -> Floor -> Node -> Edge (connects two Nodes)
```
- A **Node** is any point a user needs to make a decision or reach: a
  corridor junction, room entrance, stair/lift landing, building entrance.
- A **QR sticker's printed text** is literally a Node's `qr_code` value.
  Scanning it and calling `/api/nodes/lookup/:qrCode` tells the app exactly
  where the user is standing.
- An **Edge** is a walkable segment between two Nodes, weighted by
  `distance_meters`. Edges are treated as bidirectional by default (set
  `oneWay: true` to make one direction only).
- **Multi-floor routing** works automatically: just add an Edge connecting
  a "stairs-bottom" node on floor 1 to a "stairs-top" node on floor 2. The
  stairs/lift *is* the edge between floors — no special-casing needed in
  the pathfinding code.

## API reference

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/buildings` | List all buildings + floors |
| POST | `/api/buildings` | Create a building `{ name, address }` |
| POST | `/api/buildings/:id/floors` | Add a floor `{ level, name }` |
| GET | `/api/buildings/:id` | Full building detail (floors + nodes) |
| POST | `/api/nodes` | Create a node `{ floorId, name, type, x, y }` — auto-generates `qrCode` |
| GET | `/api/nodes/:id/qrcode` | PNG image of the node's QR code (print this) |
| GET | `/api/nodes/lookup/:qrCode` | Resolve a scanned QR string to a node (mobile app calls this after scanning) |
| GET | `/api/nodes/floor/:floorId` | All nodes on a floor (for voice-search destination matching) |
| POST | `/api/edges` | Connect two nodes `{ fromNodeId, toNodeId, distanceMeters, instruction, hazard?, oneWay? }` |
| DELETE | `/api/edges/:id` | Remove a connection |
| GET | `/api/navigate?buildingId=&startNodeId=&endNodeId=` | **The core endpoint.** Returns shortest path + turn-by-turn spoken instructions |

## Why Dijkstra, not A*
A real building floor has at most a few hundred nodes — small enough that
Dijkstra's guaranteed correctness and simplicity beat A*'s speed advantage.
See the comment at the top of `src/utils/pathfinding.js` for how to upgrade
to A* later if you want the extra credit (it's a two-line change: add a
straight-line-distance heuristic).

## Next steps for this project
1. **Admin web tool** (`../admin-web`) — a map editor so you don't have to
   POST raw JSON by hand to map a real building.
2. **Mobile app** (`../mobile-app`) — Flutter app with QR scanning, voice
   search, and TTS turn-by-turn playback.
3. **Hosting** — deploy this backend to Render or Railway (free tier is
   enough for a college demo); point `DATABASE_URL`/`data.db` at a
   persistent disk so data survives restarts.
