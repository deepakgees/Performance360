/**
 * Production static server for the React build.
 * Binds to 0.0.0.0 so Railway's proxy can reach it; serves build/ with SPA fallback.
 * Logging is verbose to help diagnose 502 / startup issues on Railway.
 *
 * Interpreting logs:
 * - No [server] lines at all in runtime logs => start command is likely not "node server.js".
 * - [server] ... listen() callback => process bound to PORT; if 502 persists, proxy may not be routing to this PORT.
 * - [server] first HTTP request => proxy is reaching this process; 502 is likely elsewhere.
 */
(function logEnv() {
  const safe = (k, v) => (v == null ? '(undefined)' : String(v));
  console.log('[server] === server.js starting ===');
  console.log('[server] NODE_ENV=' + safe('NODE_ENV', process.env.NODE_ENV));
  console.log('[server] PORT (env)=' + safe('PORT', process.env.PORT));
  console.log('[server] cwd=' + process.cwd());
  console.log('[server] __dirname=' + __dirname);
})();

process.on('uncaughtException', (err) => {
  console.error('[server] uncaughtException:', err && err.message, err && err.stack);
  process.exit(1);
});
process.on('unhandledRejection', (reason, p) => {
  console.error('[server] unhandledRejection:', reason, p);
});

const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('[server] express required');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const BUILD = path.join(__dirname, 'build');

console.log('[server] BUILD path=' + BUILD);
console.log('[server] BUILD exists=' + fs.existsSync(BUILD));

if (!fs.existsSync(BUILD)) {
  console.error('[server] ERROR: build/ directory not found. Run "npm run build" first.');
  try {
    const parent = path.dirname(BUILD);
    console.error('[server] parent dir exists=' + fs.existsSync(parent));
    if (fs.existsSync(parent)) {
      console.error('[server] parent dir listing:', fs.readdirSync(parent).slice(0, 20));
    }
  } catch (e) {
    console.error('[server] could not inspect parent:', e && e.message);
  }
  process.exit(1);
}

const indexHtml = path.join(BUILD, 'index.html');
console.log('[server] index.html exists=' + fs.existsSync(indexHtml));
try {
  console.log('[server] build/ sample entries:', fs.readdirSync(BUILD).slice(0, 15));
} catch (e) {
  console.error('[server] readdir build failed:', e && e.message);
}

// Log only the first request to confirm Railway's proxy is reaching this process
let firstReq = true;
app.use((req, res, next) => {
  if (firstReq) {
    firstReq = false;
    console.log('[server] first HTTP request: ' + req.method + ' ' + req.url + ' (proxy is reaching us)');
  }
  next();
});

app.use(express.static(BUILD, { index: false }));

// SPA: all other requests -> index.html
app.get('*', (_, res) => res.sendFile(path.join(BUILD, 'index.html')));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('[server] listen() callback: bound to 0.0.0.0:' + PORT + ', ready to accept connections');
});

server.on('error', (err) => {
  console.error('[server] listen error:', err.code || err.message, err.message);
  if (err.code === 'EADDRINUSE') console.error('[server] (port ' + PORT + ' already in use)');
  if (err.code === 'EACCES') console.error('[server] (permission denied to bind)');
  process.exit(1);
});
