/**
 * Web development server for the react-native-web build.
 *
 * Starts:
 *  1. Metro bundler on port 8081 (serves the JS bundle for the web platform)
 *  2. A tiny static server on port 8080 that serves public/index.html
 *
 * Open http://localhost:8080 to run the app in the browser.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const STATIC_PORT = 8080;
const METRO_PORT = 8081;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const METRO_URL = `http://localhost:${METRO_PORT}/index.web.bundle?platform=web&dev=true`;

const isWindows = process.platform === 'win32';

// ---------------------------------------------------------------------------
// 1. Static server for public/index.html
// ---------------------------------------------------------------------------
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

const staticServer = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'index.html' : urlPath);

  // Prevent path traversal.
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  res.writeHead(200, {
    'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream',
  });
  fs.createReadStream(filePath).pipe(res);
});

// ---------------------------------------------------------------------------
// 2. Metro
// ---------------------------------------------------------------------------
const metro = spawn(
  isWindows ? 'npx.cmd' : 'npx',
  ['react-native', 'start', '--port', String(METRO_PORT)],
  {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    shell: isWindows,
  },
);

let metroReady = false;
metro.on('exit', code => {
  if (!metroReady) {
    console.error('\n✖ Metro failed to start. Is react-native installed?\n');
  }
  process.exit(code ?? 1);
});

function onMetroReady() {
  if (metroReady) {
    return;
  }
  metroReady = true;
  staticServer.listen(STATIC_PORT, () => {
    console.log('\n──────────────────────────────────────────────');
    console.log('  💰 Expense Tracker — Web');
    console.log(`  Open:  http://localhost:${STATIC_PORT}`);
    console.log('  (Metro bundles on :8081)');
    console.log('──────────────────────────────────────────────\n');
  });
}

// Metro prints "Bundled" or "Metro waiting on exp://" once it is up.
metro.stdout?.on('data', chunk => {
  const text = chunk.toString();
  if (/Bundled|Waiting on|Metro waiting|Welcome to Metro/i.test(text)) {
    setTimeout(onMetroReady, 500);
  }
  process.stdout.write(chunk);
});

metro.stderr?.on('data', chunk => {
  const text = chunk.toString();
  if (/Bundled|Waiting on|Metro waiting|Welcome to Metro/i.test(text)) {
    setTimeout(onMetroReady, 500);
  }
  process.stdout.write(chunk);
});

// Give Metro up to 30s to boot.
setTimeout(onMetroReady, 15000);

function shutdown() {
  console.log('\nShutting down…');
  metro.kill('SIGTERM');
  staticServer.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
