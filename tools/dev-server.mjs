// Serveur local : fichiers statiques (cleanUrls comme Vercel) + fonctions /api/*.
// Usage : node tools/dev-server.mjs [port]            → http://localhost:3000
//         MOCK_TWILIO=1 node tools/dev-server.mjs      → Twilio simulé (code 123456, Lookup « mobile » ;
//                                                        +1 514 700-0000 = VoIP, +1 514 700-0001 = ligne inactive)
// Les variables de .env.local (même format que .env.example) sont chargées si le fichier existe.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const PORT = Number(process.argv[2]) || 3000;

const envFile = join(ROOT, '.env.local');
if (existsSync(envFile)) for (const l of readFileSync(envFile, 'utf8').split('\n')) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(l); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
if (process.env.MOCK_TWILIO === '1') {
  const { installTwilioMock } = await import('./twilio-mock.mjs');
  installTwilioMock();
  console.log('Twilio simulé : code 123456');
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.xml': 'application/xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.slice(5).replace(/[^a-z0-9-]/g, '');
    const file = join(ROOT, 'api', name + '.js');
    if (!name || !existsSync(file)) { res.statusCode = 404; return res.end('{}'); }
    let raw = ''; for await (const c of req) raw += c;
    try { req.body = raw ? JSON.parse(raw) : {}; } catch (e) { req.body = {}; }
    req.headers['x-real-ip'] = req.headers['x-real-ip'] || '127.0.0.1';
    return require(file)(req, res);
  }
  let p = decodeURIComponent(url.pathname);
  if (p.endsWith('/')) p += 'index.html';
  let f = join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
  if (!existsSync(f) && existsSync(f + '.html')) f += '.html';
  if (!existsSync(f) || statSync(f).isDirectory()) { res.statusCode = 404; f = join(ROOT, '404.html'); }
  res.setHeader('Content-Type', TYPES[extname(f)] || 'application/octet-stream');
  res.end(readFileSync(f));
}).listen(PORT, () => console.log('http://localhost:' + PORT));
