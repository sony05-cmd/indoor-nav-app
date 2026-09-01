// Thin wrapper around the backend REST API. The base URL is stored in
// localStorage so you can point this admin tool at your local dev server
// or your deployed Render URL without editing code.

const DEFAULT_BASE_URL = "https://indoor-nav-backend-tm6t.onrender.com";

export function getBaseUrl() {
  return localStorage.getItem("indoor-nav-base-url") || DEFAULT_BASE_URL;
}

export function setBaseUrl(url) {
  localStorage.setItem("indoor-nav-base-url", url.replace(/\/$/, ""));
}

async function request(path, options = {}) {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getBuildings: () => request("/api/buildings"),
  getBuilding: (id) => request(`/api/buildings/${id}`),
  createBuilding: (data) =>
    request("/api/buildings", { method: "POST", body: JSON.stringify(data) }),
  createFloor: (buildingId, data) =>
    request(`/api/buildings/${buildingId}/floors`, { method: "POST", body: JSON.stringify(data) }),

  createNode: (data) => request("/api/nodes", { method: "POST", body: JSON.stringify(data) }),
  deleteNode: (id) => request(`/api/nodes/${id}`, { method: "DELETE" }),
  qrCodeUrl: (nodeId) => `${getBaseUrl()}/api/nodes/${nodeId}/qrcode`,

  createEdge: (data) => request("/api/edges", { method: "POST", body: JSON.stringify(data) }),
  updateEdge: (id, data) => request(`/api/edges/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  getEdgesByFloor: (floorId) => request(`/api/edges/floor/${floorId}`),
  deleteEdge: (id) => request(`/api/edges/${id}`, { method: "DELETE" }),

  navigate: (buildingId, startNodeId, endNodeId) =>
    request(`/api/navigate?buildingId=${buildingId}&startNodeId=${startNodeId}&endNodeId=${endNodeId}`),
};
