// W Héritage content engine: fills Brand Foundry templates from wh/content.json
// and renders them through the running studio.
//
//   node wh/render.mjs                    render every asset (PNG stills, MP4 motion)
//   node wh/render.mjs stat-cdc quote-…   render only these names
//   node wh/render.mjs --frames           one PNG poster frame per asset (fast proof)
//   node wh/render.mjs --size=sq,st       override output sizes
//   node wh/render.mjs --mov              transparent MOV instead of MP4 for motion
//
// Needs the studio running (npm start). STUDIO_URL defaults to the config address.
import { readFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WH = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(WH);
const OUT = path.join(WH, 'renders');
const config = JSON.parse(readFileSync(path.join(ROOT, 'studio.config.json'), 'utf8'));
const base = process.env.STUDIO_URL || `http://${config.server.host}:${process.env.PORT || config.server.port}`;
const content = JSON.parse(readFileSync(path.join(WH, 'content.json'), 'utf8'));

const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const names = process.argv.slice(2).filter(a => !a.startsWith('--'));
const frames = flags.includes('--frames');
const mov = flags.includes('--mov');
const sizeFlag = flags.find(f => f.startsWith('--size='))?.slice(7).split(',');

const api = async (route, init) => {
  const res = await fetch(new URL(route, base), init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${route}: ${body.error || res.status}`);
  return body;
};
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
async function upload(id, file) {
  const full = path.join(WH, file);
  const form = new FormData();
  form.append('file', new Blob([readFileSync(full)], { type: MIME[path.extname(full).toLowerCase()] }), path.basename(full));
  return (await api(`/api/upload/${id}`, { method: 'POST', body: form })).path;
}
// "@file:x" values (one per line in multi-line fields) are uploaded to the template.
async function resolveFiles(id, variables) {
  const out = {};
  for (const [key, value] of Object.entries(variables)) {
    if (typeof value === 'string' && value.includes('@file:')) {
      const lines = [];
      for (const line of value.split('\n')) lines.push(line.startsWith('@file:') ? await upload(id, line.slice(6)) : line);
      out[key] = lines.join('\n');
    } else out[key] = value;
  }
  return out;
}

const manifest = await api('/api/manifest');
const assets = content.assets.filter(a => !names.length || names.includes(a.name));
if (names.length && assets.length !== names.length) throw new Error('Unknown name(s): ' + names.filter(n => !assets.some(a => a.name === n)).join(', '));
mkdirSync(OUT, { recursive: true });

let failed = 0;
for (const asset of assets) {
  const tpl = manifest.templates.find(t => t.id === asset.id);
  if (!tpl) { console.error(`✗ ${asset.name}: template ${asset.id} not in manifest`); failed++; continue; }
  const declared = new Set(tpl.variables.map(v => v.id));
  const unknown = Object.keys(asset.variables).filter(k => !declared.has(k));
  if (unknown.length) { console.error(`✗ ${asset.name}: undeclared field(s) ${unknown.join(', ')}`); failed++; continue; }
  const variables = await resolveFiles(asset.id, asset.variables);
  const still = tpl.kind === 'still' || frames;
  for (const suffix of sizeFlag || asset.sizes || content.defaults[tpl.kind]) {
    if (!tpl.sizes.some(s => s.suffix === suffix)) { console.error(`✗ ${asset.name}: no size ${suffix}`); failed++; continue; }
    const started = Date.now();
    try {
      const result = await api(still ? '/api/export/png' : '/api/export/video', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: asset.id, suffix, variables, ...(still ? {} : { transparent: mov }) }),
      });
      const source = path.join(ROOT, 'exports', path.basename(result.url));
      if (!existsSync(source)) throw new Error('export file missing: ' + source);
      const dest = path.join(OUT, `${asset.name}-${suffix}${frames && tpl.kind === 'motion' ? '-frame' : ''}${path.extname(source)}`);
      copyFileSync(source, dest);
      console.log(`✓ ${path.relative(ROOT, dest)}  (${((Date.now() - started) / 1000).toFixed(1)}s)`);
    } catch (e) { console.error(`✗ ${asset.name}-${suffix}: ${e.message.slice(0, 400)}`); failed++; }
  }
}
if (failed) { console.error(`\n${failed} render(s) failed`); process.exitCode = 1; }
