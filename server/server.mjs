import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { StateStore } from './stateStore.mjs';
import { fetchWeatherBoard } from './weather.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 8080);
const store = new StateStore();
await store.load();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png'
};

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; if (raw.length > 1_000_000) reject(new Error('Payload too large')); });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}

async function serveFile(res, filePath) {
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME[ext] || 'text/plain; charset=utf-8');
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Not found');
  }
}

async function currentBoardState() {
  const state = store.get();
  const entries = (state.schedules || []).filter((s) => s.enabled !== false);
  if (!entries.length) return { lines: ['', '', '', '', ''], active: null, state };
  if (state.mode === 'weather') {
    const lines = await fetchWeatherBoard(state.weatherCity || 'Minneapolis');
    return { lines, active: 'weather', state };
  }
  if (state.mode === 'message') {
    const entry = entries.find((e) => e.type === 'message') || entries[0];
    return { lines: entry.lines || ['', '', '', '', ''], active: entry.id, state };
  }
  const total = entries.reduce((sum, entry) => sum + Math.max(5, Number(entry.durationSec || 15)), 0);
  let cursor = Math.floor(Date.now() / 1000) % total;
  let selected = entries[0];
  for (const entry of entries) {
    const dur = Math.max(5, Number(entry.durationSec || 15));
    if (cursor < dur) { selected = entry; break; }
    cursor -= dur;
  }
  if (selected.type === 'weather') {
    const lines = await fetchWeatherBoard(state.weatherCity || 'Minneapolis');
    return { lines, active: selected.id, state };
  }
  return { lines: selected.lines || ['', '', '', '', ''], active: selected.id, state };
}

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});

  if (req.method === 'GET' && req.url === '/api/state') {
    try {
      return json(res, 200, await currentBoardState());
    } catch (error) {
      return json(res, 500, { error: error.message });
    }
  }

  if (req.method === 'POST' && req.url === '/api/state') {
    try {
      const payload = await readJson(req);
      const next = await store.set(payload);
      return json(res, 200, next);
    } catch (error) {
      return json(res, 400, { error: error.message });
    }
  }

  if (req.method === 'GET' && req.url === '/api/config') {
    return json(res, 200, store.get());
  }

  if (req.method === 'GET' && req.url === '/control') {
    return serveFile(res, path.join(root, 'control.html'));
  }

  const requested = req.url === '/' ? '/index.html' : req.url;
  const safePath = path.normalize(requested).replace(/^([.]{2}[\\/])+/, '');
  const filePath = path.join(root, safePath);
  if (!filePath.startsWith(root)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  await serveFile(res, filePath);
}).listen(PORT, () => {
  console.log(`FlipOff server listening on http://0.0.0.0:${PORT}`);
});
