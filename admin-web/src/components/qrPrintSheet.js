import { api } from "../api";

// Opens a new tab with every node's QR code laid out in a print-ready
// grid, each labeled with the node name. Admin prints this page, cuts out
// the stickers, and sticks each one at its physical location.
export function openQrPrintSheet(nodes, floorName) {
  const win = window.open("", "_blank");
  const cards = nodes
    .map(
      (n) => `
      <div class="card">
        <img src="${api.qrCodeUrl(n.id)}" width="180" height="180" />
        <div class="label">${escapeHtml(n.name)}</div>
        <div class="type">${escapeHtml(n.type)}</div>
      </div>`
    )
    .join("");

  win.document.write(`
    <html>
      <head>
        <title>QR sheet — ${escapeHtml(floorName)}</title>
        <style>
          body { font-family: sans-serif; padding: 24px; }
          h1 { font-size: 16px; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 16px; }
          .card { border: 1px dashed #999; border-radius: 8px; padding: 16px; text-align: center; break-inside: avoid; }
          .label { font-weight: 600; margin-top: 8px; }
          .type { color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
          @media print {
            .card { border: 1px solid #ccc; }
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(floorName)} — QR stickers (${nodes.length})</h1>
        <div class="grid">${cards}</div>
      </body>
    </html>
  `);
  win.document.close();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
