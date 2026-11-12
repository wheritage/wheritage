// Met à jour api/_lib/disposable-domains.js depuis la liste communautaire
// github.com/disposable-email-domains/disposable-email-domains (10 000+ domaines jetables, CC0).
// Usage : node tools/update-disposable-domains.mjs   (lancé chaque mois par .github/workflows/disposable-domains.yml)
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BASE = 'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main/';
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'api', '_lib', 'disposable-domains.js');

const get = async (f) => { const r = await fetch(BASE + f); if (!r.ok) throw new Error(f + ' HTTP ' + r.status); return r.text(); };
const lines = (t) => t.split('\n').map((l) => l.trim().toLowerCase()).filter((l) => l && !l.startsWith('#'));
const block = lines(await get('disposable_email_blocklist.conf'));
// Liste d'exceptions : facultative (le dépôt l'a déjà déplacée ; un 404 n'arrête pas la mise à jour)
const allow = new Set(lines(await get('allowlist.conf').catch(() => '')));
const list = [...new Set(block)].filter((d) => !allow.has(d) && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)).sort();
if (list.length < 3000) throw new Error('Liste anormalement courte (' + list.length + '), rien n\'est écrit.');

writeFileSync(out,
  '/* Généré par tools/update-disposable-domains.mjs le ' + new Date().toISOString().slice(0, 10) + ' : ' + list.length + ' domaines.\n' +
  '   Source : github.com/disposable-email-domains/disposable-email-domains (CC0). Ne pas modifier à la main. */\n' +
  'module.exports = ' + JSON.stringify(list.join('\n')) + '.split(\'\\n\');\n');
console.log(list.length + ' domaines écrits dans ' + out);
