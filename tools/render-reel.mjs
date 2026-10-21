// Frame-exact MP4 export for the reel pages (text-effects.html, motion-lab.html).
// Serves the repo locally, opens the page with ?render=1, seeks the GSAP master timeline
// frame by frame through window.reel / window.motionLab, screenshots the stage and pipes
// the PNGs into ffmpeg. Same time in, same frame out: no screen-recorder drops.
//
//   node tools/render-reel.mjs text-effects.html my-clip-text-effects.mp4
//   node tools/render-reel.mjs text-effects.html out.mp4 --format 16:9 --height 1080
//
// Needs Node 18+, ffmpeg on PATH and Playwright (npm i -g playwright, or npx playwright).
// GSAP_DIR=/path/to/gsap/dist serves GSAP from disk when the CDN is unreachable.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [page = 'text-effects.html', out = 'my-clip-text-effects.mp4', ...rest] = process.argv.slice(2);
const opt = Object.fromEntries(rest.join(' ').split('--').filter(Boolean).map(s => s.trim().split(/\s+/)));
const format = opt.format || '9:16';
const fps = Number(opt.fps || 30);
const [fw, fh] = format.split(':').map(Number);
const H = Number(opt.height || (format === '16:9' ? 1080 : 1920));
const W = Math.round((H * fw) / fh / 2) * 2;
const DPR = 2;                                       // lay out at half size, capture at full

async function loadPlaywright() {
  try { return await import('playwright'); } catch {}
  const globalRoot = execSync('npm root -g').toString().trim();
  return createRequire(path.join(globalRoot, 'noop.js'))('playwright');
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json' };
const server = http.createServer(async (req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try { res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }).end(await readFile(file)); }
  catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

const { chromium } = await loadPlaywright();
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: W / DPR, height: H / DPR }, deviceScaleFactor: DPR,
  reducedMotion: 'no-preference' });
if (process.env.GSAP_DIR) {
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/gsap@[^/]+\/dist\/(.+)$/, async (route, req) => {
    const name = req.url().match(/dist\/(.+)$/)[1];
    route.fulfill({ contentType: 'text/javascript', body: await readFile(path.join(process.env.GSAP_DIR, name)) });
  });
}
const tab = await ctx.newPage();
tab.on('pageerror', e => console.error('page error:', e.message));
tab.on('requestfailed', r => process.env.DEBUG && console.error('failed:', r.url()));
await tab.goto(`${base}${page}?render=1&record=1&format=${encodeURIComponent(format)}`, { waitUntil: 'networkidle' });
await tab.waitForFunction(() => !!(window.reel || window.motionLab)?.timeline, null, { timeout: 60000, polling: 100 });
await tab.waitForTimeout(400);                       // let the first ResizeObserver rebuild settle

const duration = Number(opt.to || await tab.evaluate(() => (window.reel || window.motionLab).duration));
const from = Number(opt.from || 0);
const frames = Math.round((duration - from) * fps);
const stage = tab.locator('#stage');

const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
  '-vf', `scale=${W}:${H}:flags=lanczos`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', path.resolve(out)], { stdio: ['pipe', 'inherit', 'inherit'] });

for (let i = 0; i < frames; i++) {
  const t = from + i / fps;
  await tab.evaluate(t => {
    const api = window.reel || window.motionLab;
    api.seek(t);
    return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, t);
  const png = await stage.screenshot({ type: 'png', animations: 'allow' });
  if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % fps === 0) process.stdout.write(`\r${(t).toFixed(1)}s / ${duration}s`);
}
ff.stdin.end();
await new Promise((r, j) => ff.on('close', c => (c ? j(new Error(`ffmpeg exited ${c}`)) : r())));
await browser.close();
server.close();
console.log(`\n${out}: ${W}x${H}, ${fps} fps, ${frames} frames`);
