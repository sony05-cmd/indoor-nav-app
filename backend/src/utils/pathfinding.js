/**
 * Dijkstra's shortest-path algorithm over the building graph.
 *
 * Why Dijkstra (not A*): indoor graphs from a real building are small
 * (usually under a few hundred nodes per floor), so Dijkstra's simplicity
 * and guaranteed-correctness outweigh A*'s speed advantage. If you want to
 * upgrade to A* later, you only need to add a heuristic function based on
 * straight-line (x, y) distance to the destination — the rest of this file
 * stays the same, since A* is Dijkstra + a heuristic.
 *
 * @param {Array} nodes - all Node rows for the relevant floor(s)
 * @param {Array} edges - all Edge rows for the relevant floor(s)
 * @param {string} startNodeId
 * @param {string} endNodeId
 * @returns {{ path: string[], totalDistance: number, steps: object[] } | null}
 */
function findShortestPath(nodes, edges, startNodeId, endNodeId) {
  // Build an adjacency list: nodeId -> [{ toNodeId, distance, instruction, hazard, edgeId }]
  const adjacency = new Map();
  nodes.forEach((n) => adjacency.set(n.id, []));

  edges.forEach((e) => {
    if (!adjacency.has(e.fromNodeId)) adjacency.set(e.fromNodeId, []);
    adjacency.get(e.fromNodeId).push({
      toNodeId: e.toNodeId,
      distance: e.distanceMeters,
      instruction: e.instruction,
      hazard: e.hazard,
      edgeId: e.id,
    });

    // Mirror the edge unless it's explicitly one-way, so corridors work
    // both directions without the admin having to create duplicate rows.
    if (!e.oneWay) {
      if (!adjacency.has(e.toNodeId)) adjacency.set(e.toNodeId, []);
      adjacency.get(e.toNodeId).push({
        toNodeId: e.fromNodeId,
        distance: e.distanceMeters,
        instruction: null, // reverse direction instruction is direction-dependent; app derives it
        hazard: e.hazard,
        edgeId: e.id,
      });
    }
  });

  // Standard Dijkstra with a simple array-based priority queue.
  // (A binary heap would be faster for huge graphs, but a building floor
  // graph is small enough that this is plenty fast and much easier to explain.)
  const distances = new Map();
  const previous = new Map(); // nodeId -> { fromNodeId, instruction, hazard, edgeId }
  const visited = new Set();

  nodes.forEach((n) => distances.set(n.id, Infinity));
  distances.set(startNodeId, 0);

  const queue = [startNodeId];

  while (queue.length > 0) {
    // Pick the unvisited node with the smallest known distance.
    queue.sort((a, b) => distances.get(a) - distances.get(b));
    const current = queue.shift();

    if (visited.has(current)) continue;
    visited.add(current);

    if (current === endNodeId) break; // reached destination, can stop early

    const neighbors = adjacency.get(current) || [];
    for (const edge of neighbors) {
      if (visited.has(edge.toNodeId)) continue;
      const newDist = distances.get(current) + edge.distance;
      if (newDist < distances.get(edge.toNodeId)) {
        distances.set(edge.toNodeId, newDist);
        previous.set(edge.toNodeId, {
          fromNodeId: current,
          instruction: edge.instruction,
          hazard: edge.hazard,
          edgeId: edge.edgeId,
        });
        queue.push(edge.toNodeId);
      }
    }
  }

  if (distances.get(endNodeId) === Infinity) {
    return null; // no path exists between these two nodes
  }

  // Walk backwards from end -> start using the `previous` map, then reverse.
  const path = [];
  const steps = [];
  let cursor = endNodeId;

  while (cursor !== startNodeId) {
    const step = previous.get(cursor);
    path.unshift(cursor);
    steps.unshift({
      fromNodeId: step.fromNodeId,
      toNodeId: cursor,
      instruction: step.instruction,
      hazard: step.hazard,
    });
    cursor = step.fromNodeId;
  }
  path.unshift(startNodeId);

  return {
    path, // ordered list of node IDs from start to end
    totalDistance: distances.get(endNodeId),
    steps, // ordered list of { fromNodeId, toNodeId, instruction, hazard }
  };
}

module.exports = { findShortestPath };
