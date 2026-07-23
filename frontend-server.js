/**
 * MAGD MARKET — Local Development Frontend Server
 * ════════════════════════════════════════════════
 *
 * Use this ONLY for local split-process development:
 *   Frontend  →  http://localhost:5000   (this file)
 *   Backend   →  http://localhost:3000   (npm run backend)
 *
 * In production, Express (src/app.js) serves both the API and the
 * static files from public/ — this file is not used there.
 *
 * What it does beyond a plain file server:
 *   • Injects <meta name="api-base" content="http://localhost:3000">
 *     into every HTML response so api.js dynamically resolves the
 *     backend URL without any hardcoding inside the source files.
 *
 * Start:  npm run frontend
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────
const FRONTEND_PORT = 5000;
const BACKEND_URL   = 'http://localhost:3000';   // backend in split-process dev
const PUBLIC_DIR    = path.join(__dirname, 'public');

// The meta tag injected into every HTML page so api.js resolves the right base URL
const API_BASE_META = `<meta name="api-base" content="${BACKEND_URL}">`;

// ─── MIME Types ───────────────────────────────────────────────────────────────
const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.css':   'text/css; charset=utf-8',
  '.js':    'application/javascript; charset=utf-8',
  '.json':  'application/json',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.gif':   'image/gif',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.otf':   'font/otf',
};

// ─── Meta Tag Injection ───────────────────────────────────────────────────────
/**
 * Inserts the api-base <meta> tag right after <head> in HTML responses.
 * This is the only modification made to served files — no other content changes.
 */
function injectMeta(html) {
  const tag = html.toString();
  // Insert after <head> if present, otherwise after <html>, otherwise prepend
  if (tag.includes('<head>')) {
    return tag.replace('<head>', `<head>\n    ${API_BASE_META}`);
  }
  if (tag.includes('<head ')) {
    return tag.replace(/<head([^>]*)>/, `<head$1>\n    ${API_BASE_META}`);
  }
  return API_BASE_META + '\n' + tag;
}

// ─── Request Handler ──────────────────────────────────────────────────────────
function handler(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  const filePath = path.join(PUBLIC_DIR, urlPath);
  const ext      = path.extname(filePath).toLowerCase();
  const isHTML   = ext === '.html';
  const mimeType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // File not found — serve index.html as fallback (handles .html page links)
      const fallback = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(fallback, (err2, fallbackData) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(injectMeta(fallbackData));
        }
      });
    } else {
      res.writeHead(200, { 'Content-Type': mimeType });
      // Only inject meta into HTML responses
      res.end(isHTML ? injectMeta(data) : data);
    }
  });
}

// ─── Start ────────────────────────────────────────────────────────────────────
http.createServer(handler).listen(FRONTEND_PORT, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log(`🌐  Frontend  →  http://localhost:${FRONTEND_PORT}`);
  console.log(`🔗  API Base  →  ${BACKEND_URL}/api/v1`);
  console.log(`📁  Serving   →  ${PUBLIC_DIR}`);
  console.log('───────────────────────────────────────────────────');
  console.log('   Start backend in a second terminal: npm run backend');
  console.log('═══════════════════════════════════════════════════');
});
