/* ==========================================================================
   Outils communs des fonctions Vercel /api (anti-faux leads + vérification SMS)
   Aucune dépendance npm : Twilio, Turnstile, Abstract et IPQualityScore sont appelés par fetch (Node 18+).
   Chaque service ne s'active que si sa variable d'environnement existe (voir .env.example).
   ========================================================================== */
'use strict';
const crypto = require('crypto');

const env = (k) => (process.env[k] || '').trim();

/* ── Requête / réponse ── */
function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}
function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; }
}
function ip(req) {
  const h = req.headers || {};
  return String(h['x-real-ip'] || (h['x-forwarded-for'] || '').split(',')[0] || (req.socket && req.socket.remoteAddress) || '').trim();
}
// Géolocalisation gratuite fournie par Vercel (en-têtes x-vercel-ip-*)
function geo(req) {
  const h = req.headers || {};
  return { pays: h['x-vercel-ip-country'] || '', region: h['x-vercel-ip-country-region'] || '', ville: decodeURIComponent(h['x-vercel-ip-city'] || '') };
}
/* Seules les pages du site peuvent appeler l'API : protège le compte Twilio contre le « SMS pumping ».
   ALLOWED_ORIGINS = liste séparée par des virgules ; par défaut le domaine de production et localhost. */
function originOk(req) {
  const o = (req.headers && (req.headers.origin || req.headers.referer)) || '';
  if (!o) return false;
  const allowed = (env('ALLOWED_ORIGINS') || 'https://wheritage.vercel.app,http://localhost,http://127.0.0.1').split(',').map((s) => s.trim()).filter(Boolean);
  if (allowed.some((a) => o === a || o.indexOf(a + '/') === 0 || o.indexOf(a + ':') === 0)) return true;
  // Aperçus Vercel du projet (wheritage-xxxx.vercel.app)
  return env('ALLOW_PREVIEWS') !== '0' && /^https:\/\/wheritage-[a-z0-9-]+\.vercel\.app(\/|$)/.test(o);
}
function guard(req, res) {
  if (req.method === 'OPTIONS') { send(res, 204, {}); return false; }
  if (req.method !== 'POST') { send(res, 405, { error: 'POST seulement' }); return false; }
  if (!originOk(req)) { send(res, 403, { error: 'origine refusée' }); return false; }
  return true;
}

/* ── Compteurs (limites de débit, verrous OTP) ──
   Upstash Redis / Vercel KV si configuré (fiable entre instances), sinon mémoire de l'instance (au mieux). */
const mem = new Map();
function kvConf() {
  const url = env('UPSTASH_REDIS_REST_URL') || env('KV_REST_API_URL');
  const token = env('UPSTASH_REDIS_REST_TOKEN') || env('KV_REST_API_TOKEN');
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}
async function kv(cmds) {
  const c = kvConf();
  if (!c) return null;
  const r = await fetch(c.url + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + c.token, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('KV HTTP ' + r.status);
  return (await r.json()).map((x) => x.result);
}
function memGet(k) { const v = mem.get(k); if (!v) return null; if (v.exp < Date.now()) { mem.delete(k); return null; } return v; }
// Incrémente et renvoie le compte de la fenêtre (ttl en secondes)
async function hit(key, ttl) {
  key = 'wh:' + key;
  try { const r = await kv([['INCR', key], ['EXPIRE', key, ttl, 'NX']]); if (r) return Number(r[0]); } catch (e) { /* repli mémoire */ }
  const v = memGet(key) || { n: 0, exp: Date.now() + ttl * 1000 };
  v.n++; mem.set(key, v); return v.n;
}
async function peek(key) {
  key = 'wh:' + key;
  try { const r = await kv([['GET', key]]); if (r) return r[0] == null ? 0 : Number(r[0]) || r[0]; } catch (e) { /* repli */ }
  const v = memGet(key); return v ? v.n : 0;
}
async function setKey(key, val, ttl) {
  key = 'wh:' + key;
  try { const r = await kv([['SET', key, String(val), 'EX', ttl]]); if (r) return; } catch (e) { /* repli */ }
  mem.set(key, { n: val, exp: Date.now() + ttl * 1000 });
}
async function delKey(key) {
  key = 'wh:' + key;
  try { const r = await kv([['DEL', key]]); if (r) return; } catch (e) { /* repli */ }
  mem.delete(key);
}
const hash = (s) => crypto.createHash('sha256').update(String(s).toLowerCase()).digest('hex').slice(0, 24);

/* ── Preuve signée (HMAC) : la feuille Google peut vérifier que le score et la vérification SMS
   viennent bien du serveur et non d'un robot qui écrit directement dans le script. ── */
function sign(obj) {
  const secret = env('LEAD_PROOF_SECRET');
  if (!secret) return '';
  const payload = Buffer.from(JSON.stringify(obj)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const mac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return payload + '.' + mac;
}

/* ── Twilio ── */
function twilioConf() {
  const sid = env('TWILIO_ACCOUNT_SID'), token = env('TWILIO_AUTH_TOKEN');
  // Clé API (SK…) recommandée en production ; sinon SID + jeton principal
  const user = env('TWILIO_API_KEY') || sid, pass = env('TWILIO_API_SECRET') || token;
  return sid && user && pass ? { sid, auth: 'Basic ' + Buffer.from(user + ':' + pass).toString('base64'), verify: env('TWILIO_VERIFY_SERVICE_SID') } : null;
}
async function twilio(method, url, form) {
  const c = twilioConf();
  if (!c) throw new Error('Twilio non configuré');
  const opt = { method, headers: { Authorization: c.auth } };
  if (form) { opt.headers['Content-Type'] = 'application/x-www-form-urlencoded'; opt.body = new URLSearchParams(form).toString(); }
  const r = await fetch(url, opt);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.message || ('Twilio HTTP ' + r.status)); e.status = r.status; e.code = j.code; throw e; }
  return j;
}
/* Lookup v2 : type de ligne (mobile, landline, fixedVoip, nonFixedVoip…), statut, risque de SMS pumping.
   TWILIO_LOOKUP_FIELDS peut ajouter sim_swap, call_forwarding, reassigned_number (approbation Twilio requise au Canada). */
async function lookup(e164) {
  const fields = env('TWILIO_LOOKUP_FIELDS') || 'line_type_intelligence,line_status,sms_pumping_risk';
  const j = await twilio('GET', 'https://lookups.twilio.com/v2/PhoneNumbers/' + encodeURIComponent(e164) + '?Fields=' + encodeURIComponent(fields));
  const lti = j.line_type_intelligence || {}, ls = j.line_status || {}, sp = j.sms_pumping_risk || {}, ss = j.sim_swap || {}, cf = j.call_forwarding || {}, rn = j.reassigned_number || {};
  return {
    valid: j.valid !== false,
    type: lti.type || '', carrier: lti.carrier_name || '',
    status: ls.status || '',
    pumping: sp.carrier_risk_category || '', pumping_score: sp.sms_pumping_risk_score == null ? null : Number(sp.sms_pumping_risk_score), pumping_blocked: !!sp.number_blocked,
    sim_swap: ss.last_sim_swap && ss.last_sim_swap.swapped_in_period === true,
    forwarding: cf.call_forwarding_enabled === true,
    reassigned: rn.is_number_reassigned === true || rn.is_number_reassigned === 'yes'
  };
}

/* ── Cloudflare Turnstile ── */
async function turnstile(token, remoteip) {
  const secret = env('TURNSTILE_SECRET');
  if (!secret) return { configured: false, ok: true };
  if (!token) return { configured: true, ok: false };
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, remoteip: remoteip || '' }).toString()
  });
  const j = await r.json().catch(() => ({}));
  return { configured: true, ok: !!j.success };
}

/* ── Abstract API (validation SMTP du courriel, sans envoi) ── */
async function abstractEmail(email) {
  const key = env('ABSTRACT_EMAIL_KEY') || env('ABSTRACT_KEY');
  if (!key) return null;
  const r = await fetch('https://emailvalidation.abstractapi.com/v1/?api_key=' + encodeURIComponent(key) + '&email=' + encodeURIComponent(email));
  if (!r.ok) return null;
  const j = await r.json();
  const v = (o) => o && typeof o === 'object' ? o.value : o;
  return { deliverability: j.deliverability || '', quality: j.quality_score == null ? null : Number(j.quality_score),
    disposable: !!v(j.is_disposable_email), role: !!v(j.is_role_email), catchall: !!v(j.is_catchall_email), smtp: v(j.is_smtp_valid), mx: v(j.is_mx_found) };
}

/* ── IPQualityScore (VPN, proxy, Tor) ── */
async function ipqs(addr) {
  const key = env('IPQS_KEY');
  if (!key || !addr) return null;
  const r = await fetch('https://ipqualityscore.com/api/json/ip/' + encodeURIComponent(key) + '/' + encodeURIComponent(addr) + '?strictness=1&allow_public_access_points=true');
  if (!r.ok) return null;
  const j = await r.json();
  return j && j.success !== false ? { proxy: !!j.proxy, vpn: !!j.vpn, tor: !!j.tor, fraud: Number(j.fraud_score) || 0, abuse: !!j.recent_abuse } : null;
}

/* ── MX : le domaine peut-il recevoir du courriel ? ──
   Sûr par défaut : un « aucun MX » n'est cru que si le DNS répond normalement pour un domaine témoin
   (gmail.com). Une panne DNS donne « unknown » et ne bloque personne. */
const dns = require('dns').promises;
const KNOWN = new Set(require('../../assets/lead-guard.js').KNOWN_DOMAINS);
let dnsHealthy = null, dnsCheckedAt = 0;
async function dnsOk(t) {
  if (dnsHealthy !== null && Date.now() - dnsCheckedAt < 300000) return dnsHealthy;
  try { const r = await t(dns.resolveMx('gmail.com')); dnsHealthy = !!(r && r.length); } catch (e) { dnsHealthy = false; }
  dnsCheckedAt = Date.now();
  return dnsHealthy;
}
async function mx(domain) {
  if (KNOWN.has(domain)) return 'ok';
  const t = (p) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'ETIMEOUT' })), 2500))]);
  const verdict = await mxRaw(domain, t);
  if (verdict === 'none' || verdict === 'a_only') return (await dnsOk(t)) ? verdict : 'unknown';
  return verdict;
}
async function mxRaw(domain, t) {
  try { const r = await t(dns.resolveMx(domain)); if (r && r.some((x) => x.exchange && x.exchange !== '.')) return 'ok'; return 'none'; }
  catch (e) {
    if (e.code === 'ENOTFOUND' || e.code === 'ENODATA') {
      try { await t(dns.resolve4(domain)); return 'a_only'; } catch (e2) { return e2.code === 'ETIMEOUT' ? 'unknown' : 'none'; }
    }
    return 'unknown';
  }
}

const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(() => r(null), ms))]).catch(() => null);

module.exports = { env, send, body, ip, geo, guard, hit, peek, setKey, delKey, hash, sign, twilioConf, twilio, lookup, turnstile, abstractEmail, ipqs, mx, withTimeout, kvConf };
