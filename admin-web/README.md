# Indoor Navigation — Admin Web Tool

A visual editor for mapping a building's graph: click to place nodes,
click two nodes to connect them, then print a sheet of QR codes to stick
up around the real building.

## Setup
```bash
npm install
npm run dev      # opens on http://localhost:5173
```

On first load, set **Backend URL** in the bottom-left of the sidebar to
your backend's address — either `http://localhost:4000` for local dev, or
your deployed Render URL. It's saved in the browser so you only set it once.

## How to map a building

1. **Create a building**, then **create a floor** (e.g. "Ground Floor",
   level `0`).
2. **Place nodes** — switch to "Place nodes" mode and click anywhere on
   the canvas for every decision point in the real building: junctions,
   room doors, stairs, lifts, the entrance. Name each one clearly (you'll
   hear this name read aloud by the mobile app), e.g. "Room 204 entrance".
3. **Connect nodes** — switch to "Connect nodes" mode, click one node then
   another to link them. You'll be asked for:
   - **Distance in meters** — pace this out in the real building (roughly
     1 meter per stride is fine for a v1).
   - **Spoken instruction** — what the app should say, e.g. "walk straight
     for 10 meters, then turn right."
   - **Hazard warning** (optional) — anything the user should be cautious
     of, e.g. "uneven flooring near the doorway." Edges with a hazard are
     drawn in red on the canvas.
4. Repeat for every floor. To connect floors (stairs/lift), place a node
   at the bottom and top of the stairwell/lift on each floor's graph, then
   connect them with an edge — the stairs/lift *is* the edge between floors.
5. Click **Print QR sheet** to open a printable page with every node's QR
   code, labeled by name. Print it, cut out each code, and stick it at its
   real physical location — that sticker is what the mobile app scans to
   know where the user is standing.

## Notes
- Canvas coordinates are just pixels for laying out the map visually —
  they don't need to match real-world scale. Only the typed-in edge
  distances matter for navigation accuracy.
- Deleting a node also deletes any edges connected to it (with a
  confirmation prompt).
- If you're hosting the backend on Render's free tier, the first request
  after 15 minutes of inactivity can take 30-50 seconds — that's normal,
  just wait for the building/floor list to load.
