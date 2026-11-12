// Exécute tools/apps-script-diagnostic.gs + assets/lead-guard.js dans Node avec des simulacres de
// SpreadsheetApp, CalendarApp, MailApp, etc. Vérifie le routage : pipeline, mise à jour par lead_id,
// quarantaine (5 min), preuve HMAC, doublons, liste de blocage, rapports.  Usage : node tools/test-apps-script.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import crypto from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SECRET = 'secret-test';

/* ── Simulacres ── */
function makeSheet(name) {
  const sh = { name, data: [], bg: {} };
  const range = (r, c, nr = 1, nc = 1) => ({
    getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => (sh.data[r - 1 + i] || [])[c - 1 + j] ?? '')),
    getValue: () => (sh.data[r - 1] || [])[c - 1] ?? '',
    setValues: (v) => { v.forEach((row, i) => row.forEach((x, j) => { (sh.data[r - 1 + i] ||= [])[c - 1 + j] = x; })); },
    setValue: (x) => { (sh.data[r - 1] ||= [])[c - 1] = x; },
    setBackground: (b) => { sh.bg[r] = b; }, setFontWeight() {}, setDataValidation() {}, insertCheckboxes() {}
  });
  Object.assign(sh, {
    getLastRow: () => sh.data.length,
    getLastColumn: () => Math.max(0, ...sh.data.map((r) => r.length)),
    appendRow: (row) => { sh.data.push(row.slice()); },
    deleteRow: (r) => { sh.data.splice(r - 1, 1); },
    getRange: range,
    getDataRange: () => range(1, 1, sh.data.length, Math.max(...sh.data.map((r) => r.length))),
    setFrozenRows() {}
  });
  return sh;
}
const sheets = {};
const ss = { getSheetByName: (n) => sheets[n] || null, insertSheet: (n) => (sheets[n] = makeSheet(n)), getUrl: () => 'https://docs.google.com/spreadsheets/d/TEST' };
const events = [], mails = [], cache = new Map();
const pad = (n) => String(n).padStart(2, '0');
function formatDate(d, tz, fmt) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(d).map((x) => [x.type, x.value]));
  const u = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[p.weekday];
  const local = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  const off = Math.round((local - Math.floor(d.getTime() / 1000) * 1000) / 60000), sign = off < 0 ? '-' : '+';
  const map = { yyyy: p.year, MM: p.month, dd: p.day, HH: p.hour, mm: p.minute, ss: p.second, H: String(+p.hour), u: String(u), XXX: sign + pad(Math.floor(Math.abs(off) / 60)) + ':' + pad(Math.abs(off) % 60) };
  return fmt.replace(/yyyy|MM|dd|HH|mm|ss|XXX|H|u/g, (k) => map[k]);
}
const ctx = {
  console, Date, JSON, Math, String, Number, Object, Array, RegExp,
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => ({ LEAD_PROOF_SECRET: SECRET, NOTIF_EMAIL: 'walid@test' })[k] || null }) },
  SpreadsheetApp: { getActiveSpreadsheet: () => ss, newDataValidation: () => { const b = { requireValueInList: () => b, setAllowInvalid: () => b, build: () => ({}) }; return b; } },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  CacheService: { getScriptCache: () => ({ get: (k) => cache.get(k) || null, put: (k, v) => cache.set(k, v) }) },
  ContentService: { createTextOutput: (t) => ({ text: t }) },
  CalendarApp: { Color: { YELLOW: 'y' }, getCalendarsByName: () => [{ createEvent: (t, s, e, o) => { const ev = { t, s, o, addPopupReminder() {} }; events.push(ev); return ev; } }], createCalendar() {} },
  MailApp: { sendEmail: (to, subj, body) => mails.push({ to, subj, body }) },
  ScriptApp: { getProjectTriggers: () => [] },
  Utilities: {
    formatDate,
    computeHmacSha256Signature: (v, k) => [...crypto.createHmac('sha256', k).update(v).digest()].map((b) => (b > 127 ? b - 256 : b)),
    base64DecodeWebSafe: (s) => [...Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')],
    newBlob: (bytes) => ({ getDataAsString: () => Buffer.from(bytes.map((b) => (b + 256) % 256)).toString('utf8') })
  }
};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync(join(ROOT, 'assets/lead-guard.js'), 'utf8'), ctx, { filename: 'LeadGuard.gs' });
vm.runInContext(readFileSync(join(ROOT, 'tools/apps-script-diagnostic.gs'), 'utf8'), ctx, { filename: 'apps-script-diagnostic.gs' });

const sign = (o) => { const p = Buffer.from(JSON.stringify(o)).toString('base64url'); return p + '.' + crypto.createHmac('sha256', SECRET).update(p).digest('hex'); };
const rows = (n) => (sheets[n] ? sheets[n].data.slice(1).map((r) => Object.fromEntries(sheets[n].data[0].map((k, i) => [k, r[i]]))) : []);
let fails = 0;
const check = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? ' → ' + extra : '')); if (!cond) fails++; };
const base = (o) => Object.assign({ source: 'diagnostic', profil: 'entrepreneur', prenom: 'Marie', nom: 'Tremblay', courriel: 'marie@videotron.ca', telephone: '438 291-5562',
  qualifie: true, enjeu_principal: 'liquidites', niveaux: { revenu: 'faible', succession: 'moyenne', liquidites: 'elevee' }, risque_score: 0, risque_action: 'CLEAN',
  consentement_diagnostic: { date: new Date().toISOString(), version: 'diag-c1-v1', texte: 'ok' } }, o);

// 1. En attente de vérification → Leads « En attente vérif », pas de rappel
ctx.routeLead_(base({ lead_id: 'L1', otp_statut: 'en_attente', preuve_risque: sign({ v: 1, id: 'L1', t: Date.now(), tel: '+14382915562', score: 0, action: 'CLEAN' }) }));
check('En attente → Leads, pas de rappel', rows('Leads')[0]?.Statut === 'En attente vérif' && events.length === 0, rows('Leads')[0]?.Statut);
// 2. Vérifié (preuve valide) → même ligne mise à jour, rappel « VÉRIFIÉ »
ctx.routeLead_(base({ lead_id: 'L1', otp_statut: 'verifie', otp_verifie_le: new Date().toISOString(), preuve_otp: sign({ v: 1, id: 'L1', t: Date.now(), tel: '+14382915562', otp: 'verifie' }) }));
check('Vérifié → mise à jour (1 ligne), case OTP cochée', rows('Leads').length === 1 && rows('Leads')[0]['OTP vérifié'] === true && rows('Diagnostic').length === 1);
check('Rappel agenda « CALLBACK: … - VÉRIFIÉ »', events.length === 1 && /VÉRIFIÉ/.test(events[0].t), events[0] && events[0].t + ' · ' + formatDate(events[0].s, 'America/Toronto', 'yyyy-MM-dd HH:mm'));
// 3. Preuve OTP falsifiée → non vérifié, « À vérifier »
ctx.routeLead_(base({ lead_id: 'L2', courriel: 'paul@sympatico.ca', telephone: '450 430-1212', otp_statut: 'verifie', preuve_otp: 'abc.def' }));
const l2 = rows('Leads').find((r) => r['Lead ID'] === 'L2');
check('Preuve OTP falsifiée → À vérifier, pas vérifié', l2 && l2.Statut === 'À vérifier' && l2['OTP vérifié'] === false, l2 && l2.Raisons);
// 4. Robot qui écrit directement : 444 + test@gmail.com → Quarantaine + Blocklist
ctx.routeLead_(base({ lead_id: 'L3', courriel: 'test@gmail.com', telephone: '444-444-4444', otp_statut: 'non_requis' }));
check('444 + test@gmail.com → Quarantaine', rows('Quarantaine').some((r) => r['Lead ID'] === 'L3') && !rows('Leads').some((r) => r['Lead ID'] === 'L3'), rows('Quarantaine')[0]?.['Raison quarantaine']);
check('… et ajoutés à la Blocklist', rows('Blocklist').length === 2, rows('Blocklist').map((r) => r.Valeur).join(', '));
// 5. Pot de miel : rien n'est écrit
const before = JSON.stringify(sheets);
ctx.routeLead_(base({ lead_id: 'L4', website: 'http://spam' }));
check('Pot de miel → rien d\'écrit', JSON.stringify(sheets) === before);
// 6. Doublon 30 jours : pas de nouvelle ligne, activité ajoutée
ctx.routeLead_(base({ lead_id: 'L5', otp_statut: 'non_requis', source: 'contact', sujet: 'Retraite' }));
check('Doublon (même courriel) → activité ajoutée, pas de nouvelle ligne', rows('Leads').filter((r) => r.Courriel === 'marie@videotron.ca').length === 1 && /à nouveau via contact/.test(rows('Leads')[0].Activité));
// 7. Quarantaine après 5 min sans code
ctx.routeLead_(base({ lead_id: 'L6', courriel: 'luc@outlook.com', telephone: '514 382-9911', otp_statut: 'en_attente' }));
const sh = sheets.Leads, iD = sh.data[0].indexOf('Date entrée'), r6 = sh.data.findIndex((r) => r[sh.data[0].indexOf('Lead ID')] === 'L6');
sh.data[r6][iD] = new Date(Date.now() - 6 * 60000);
ctx.quarantinePending();
check('En attente > 5 min → Quarantaine', !rows('Leads').some((r) => r['Lead ID'] === 'L6') && rows('Quarantaine').some((r) => r['Lead ID'] === 'L6' && /non confirmé/.test(r['Raison quarantaine'])));
// 8. Vérifié après la quarantaine → sort de la quarantaine
ctx.routeLead_(base({ lead_id: 'L6', courriel: 'luc@outlook.com', telephone: '514 382-9911', otp_statut: 'verifie', preuve_otp: sign({ v: 1, id: 'L6', t: Date.now(), tel: '+15143829911', otp: 'verifie' }) }));
check('Code entré après 5 min → retour dans Leads', rows('Leads').some((r) => r['Lead ID'] === 'L6' && r['OTP vérifié'] === true) && !rows('Quarantaine').some((r) => r['Lead ID'] === 'L6'));
// 9. Liste de blocage manuelle
sheets.Blocklist.appendRow(['courriel', '@spammeur.ca', 'manuel', new Date()]);
ctx.routeLead_(base({ lead_id: 'L7', courriel: 'bob@spammeur.ca', telephone: '514 382-9922', otp_statut: 'non_requis' }));
check('Domaine en Blocklist → Quarantaine', rows('Quarantaine').some((r) => r['Lead ID'] === 'L7'));
// 10. Rappels du matin, relances, rapports, anonymisation
const lr = sheets.Leads.data, H = lr[0];
lr[1][H.indexOf('Dernier contact')] = new Date(Date.now() - 9 * 86400000); lr[1][H.indexOf('Heure rappel')] = '';
const n0 = events.length;
ctx.callbackCheck();
check('9 h : lead sans contact depuis 9 j → rappel + ligne rouge', events.length > n0 && sheets.Leads.bg[2] === '#f4cccc', events.at(-1).t);
lr[1][H.indexOf('Dernier contact')] = new Date();
ctx.followUpPlan();
check('16 h 30 : contacté aujourd\'hui → relance planifiée', /^Relance /.test(sheets.Leads.data[1][H.indexOf('Prochaine action')]), sheets.Leads.data[1][H.indexOf('Prochaine action')]);
ctx.rapportQuotidien(); ctx.rapportHebdo();
check('18 h et vendredi : rapports envoyés', mails.length === 2, mails.map((m) => m.subj).join(' | '));
lr[1][H.indexOf('Date entrée')] = new Date(Date.now() - 40 * 86400000); lr[1][H.indexOf('IP')] = '1.2.3.4';
ctx.anonymiserIp();
check('IP effacée après 30 jours (Loi 25)', sheets.Leads.data[1][H.indexOf('IP')] === '');
// 11. Ancienne feuille Diagnostic sans colonnes de risque : colonnes ajoutées
check('Colonnes anti-faux leads présentes dans Diagnostic', ['lead_id', 'otp_statut', 'risque_score', 'preuve_valide'].every((k) => sheets.Diagnostic.data[0].includes(k)));
check('Une ligne par lead dans Diagnostic (mise à jour par lead_id)', new Set(rows('Diagnostic').map((r) => r.lead_id)).size === rows('Diagnostic').length);

console.log('\n' + mails[0]?.body.split('\n').slice(0, 8).join('\n'));
console.log(fails ? '\n' + fails + ' échec(s)' : '\nTout passe.');
process.exit(fails ? 1 : 0);
