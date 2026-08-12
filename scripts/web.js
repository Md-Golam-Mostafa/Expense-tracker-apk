/**
 * Web development server for the react-native-web build.
 *
 * Starts:
 *  1. Metro bundler on port 8081 (serves the JS bundle for the web platform)
 *  2. A tiny static server on port 8080 that serves public/index.html
 *
 * Open http://localhost:8080 to run the app in the browser.
 *
 * If the dev server is already running, this script prints a friendly notice
 * instead of crashing with EADDRINUSE.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');

const STATIC_PORT = 8080;
const METRO_PORT = 8081;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

/** Returns a Promise<boolean> — true when something is listening on `port`. */
function portInUse(port) {
  return new Promise(resolve => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

/** Fetches the body of a URL, or null on any failure/timeout. */
function fetchText(url, timeoutMs) {
  return new Promise(resolve => {
    const req = http.get(url, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => resolve(body));
    });
    req.on('error', () => resolve(null));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(null);
    });
  });
}

/**
 * True when the Expense Tracker dev server is actually running on
 * STATIC_PORT (i.e. it serves our index.html, not some unrelated program).
 */
async function isAppRunning() {
  const html = await fetchText(`http://127.0.0.1:${STATIC_PORT}/`, 1500);
  return Boolean(html && html.includes('id="root"'));
}

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

// Close the last crash path: if the port is grabbed between our check and
// listen(), fail with a friendly message instead of a raw stack trace.
staticServer.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n✖ Port ${STATIC_PORT} is already in use.\n`);
  } else {
    console.error('\n✖ Static server error:', err.message);
  }
  process.exit(1);
});

// ---------------------------------------------------------------------------
// 2. Metro
// ---------------------------------------------------------------------------

// Spawn via a single shell command string (instead of an args array with
// shell:true) to avoid Node's DEP0190 deprecation warning. The command is a
// static string, so shell:true is safe here. Metro's output is piped so we can
// detect when it is ready (and still forward it to the terminal).
function startMetro() {
  const metro = spawn(`npx react-native start --port ${METRO_PORT}`, {
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: path.join(__dirname, '..'),
    shell: true,
  });

  const onData = chunk => {
    const text = chunk.toString();
    if (/Bundled|Waiting on|Metro waiting|Welcome to Metro/i.test(text)) {
      setTimeout(onMetroReady, 500);
    }
    process.stdout.write(chunk);
  };
  const onErr = chunk => {
    const text = chunk.toString();
    if (/Bundled|Waiting on|Metro waiting|Welcome to Metro/i.test(text)) {
      setTimeout(onMetroReady, 500);
    }
    process.stderr.write(chunk);
  };

  metro.stdout?.on('data', onData);
  metro.stderr?.on('data', onErr);
  return metro;
}

let metroReady = false;
let staticServerStarted = false;

function onMetroReady() {
  if (metroReady) {
    return;
  }
  metroReady = true;
  staticServer.listen(STATIC_PORT, () => {
    staticServerStarted = true;
    console.log('\n──────────────────────────────────────────────');
    console.log('  💰 Expense Tracker — Web');
    console.log(`  Open:  http://localhost:${STATIC_PORT}`);
    console.log(`  (Metro bundles on :${METRO_PORT})`);
    console.log('──────────────────────────────────────────────\n');
  });
}

async function main() {
  // If something is already on the ports, figure out whether it's our dev
  // server (friendly "already running" message) or an unrelated program.
  const [staticBusy, metroBusy] = [
    await portInUse(STATIC_PORT),
    await portInUse(METRO_PORT),
  ];
  if (staticBusy || metroBusy) {
    if (await isAppRunning()) {
      console.log('\n──────────────────────────────────────────────');
      console.log('  💰 Expense Tracker — Web');
      console.log('  The dev server is already running.');
      console.log(`  Open:  http://localhost:${STATIC_PORT}`);
      console.log('  (Run this command only when the server is stopped.)');
      console.log('──────────────────────────────────────────────\n');
      process.exit(0);
    }

    // Ports are taken by something that is not our app.
    const busy = [staticBusy ? STATIC_PORT : null, metroBusy ? METRO_PORT : null]
      .filter(Boolean)
      .join(' and ');
    console.error(`\n✖ Port ${busy} is already in use by another program.`);
    console.error('  Stop that program first, then run `npm run web` again.\n');
    process.exit(1);
  }

  const metro = startMetro();
  metro.on('exit', code => {
    if (!metroReady) {
      console.error('\n✖ Metro failed to start. Is react-native installed?\n');
    }
    process.exit(code ?? 1);
  });

  // Fallback: if Metro never reports readiness, start the static server after
  // 15s anyway.
  setTimeout(onMetroReady, 15000);

  function shutdown() {
    console.log('\nShutting down…');
    metro.kill('SIGTERM');
    if (staticServerStarted) {
      staticServer.close(() => process.exit(0));
    }
    setTimeout(() => process.exit(0), 2000);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
