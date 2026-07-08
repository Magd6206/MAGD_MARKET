/**
 * MAGD MARKET — Frontend Static File Server
 * ─────────────────────────────────────────
 * Runs INDEPENDENTLY from the Express backend.
 * Backend  → http://localhost:3000  (Express / MongoDB)
 * Frontend → http://localhost:5000  (this file)
 *
 * Zero dependencies — uses Node.js built-in `http` and `fs` only.
 * Start with:  node frontend-server.js
 *           or npm run frontend
 */

const http = require("http");
const fs   = require("fs");
const path = require("path");

// ─── Configuration ────────────────────────────────────────────────────────────
// Frontend port is always 5000. Never share this with BACKEND_PORT.
const FRONTEND_PORT = 5000;
const PUBLIC_DIR    = path.join(__dirname, "public");

// ─── MIME Types ───────────────────────────────────────────────────────────────
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css" : "text/css; charset=utf-8",
  ".js"  : "application/javascript; charset=utf-8",
  ".json": "application/json",
  ".png" : "image/png",
  ".jpg" : "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif" : "image/gif",
  ".svg" : "image/svg+xml",
  ".ico" : "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf" : "font/ttf",
  ".otf" : "font/otf",
};

// ─── Request Handler ──────────────────────────────────────────────────────────
function handler(req, res) {
  // Strip query strings
  let urlPath = req.url.split("?")[0];

  // Default to index.html
  if (urlPath === "/" || urlPath === "") urlPath = "/index.html";

  const filePath = path.join(PUBLIC_DIR, urlPath);
  const ext      = path.extname(filePath).toLowerCase();
  const mimeType = MIME[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Fall back to index.html for unknown routes (soft 404)
      const fallback = path.join(PUBLIC_DIR, "index.html");
      fs.readFile(fallback, (err2, fallbackData) => {
        if (err2) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("404 Not Found");
        } else {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(fallbackData);
        }
      });
    } else {
      res.writeHead(200, { "Content-Type": mimeType });
      res.end(data);
    }
  });
}

// ─── Start ────────────────────────────────────────────────────────────────────
const server = http.createServer(handler);

server.listen(FRONTEND_PORT, () => {
  console.log("─────────────────────────────────────────────────");
  console.log(`🌐 Frontend  → http://localhost:${FRONTEND_PORT}`);
  console.log(`🚀 Backend   → http://localhost:3000  (start separately)`);
  console.log("─────────────────────────────────────────────────");
  console.log(`   Serving: ${PUBLIC_DIR}`);
});
