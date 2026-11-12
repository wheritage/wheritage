/* POST /api/check-otp : vérifie le code saisi avec Twilio Verify.
   Entrée : { telephone, code, lead_id, courriel, lang }
   3 codes erronés → numéro verrouillé 15 minutes. Approuvé → preuve signée (HMAC) que la feuille Google
   peut vérifier : « otp_verifie » ne peut pas être inventé par un robot qui écrit directement dans le script. */
'use strict';
const LG = require('../assets/lead-guard.js');
const C = require('./_lib/core.js');

const MAX_FAILS = 3, LOCK = 900;

module.exports = async function handler(req, res) {
  if (!C.guard(req, res)) return;
  const b = C.body(req);
  const lang = b.lang === 'en' ? 'en' : 'fr';
  const T = (fr, en) => (lang === 'en' ? en : fr);
  const tw = C.twilioConf();
  if (!tw || !tw.verify) return C.send(res, 503, { approved: false, code: 'otp_non_configure' });
  const p = LG.phone(b.telephone);
  if (!p.ok) return C.send(res, 400, { approved: false, code: 'tel_motif', message: LG.blockMessage(p.block, lang) });
  const code = String(b.code || '').replace(/\D/g, '');
  if (!/^\d{4,10}$/.test(code)) return C.send(res, 400, { approved: false, code: 'format', message: T('Entrez les 6 chiffres reçus.', 'Enter the 6 digits you received.') });
  const h = C.hash(p.e164);

  const locked = Number(await C.peek('otp:lock:' + h)) || 0;
  if (locked > Date.now()) return C.send(res, 429, { approved: false, locked: true, locked_until: locked, retry_after: Math.ceil((locked - Date.now()) / 1000),
    message: T('Trop de tentatives, réessayez dans 15 min.', 'Too many attempts, try again in 15 min.') });

  let check;
  try {
    check = await C.twilio('POST', 'https://verify.twilio.com/v2/Services/' + tw.verify + '/VerificationCheck', { To: p.e164, Code: code });
  } catch (e) {
    if (e.status === 404 || e.code === 20404) return C.send(res, 410, { approved: false, expired: true,
      message: T('Ce code a expiré. Demandez-en un nouveau.', 'This code has expired. Ask for a new one.') });
    if (e.code === 60202 || e.status === 429) {
      await C.setKey('otp:lock:' + h, Date.now() + LOCK * 1000, LOCK);
      return C.send(res, 429, { approved: false, locked: true, retry_after: LOCK, message: T('Trop de tentatives, réessayez dans 15 min.', 'Too many attempts, try again in 15 min.') });
    }
    console.error('[check-otp]', e.code, e.message);
    return C.send(res, 502, { approved: false, code: 'service', message: T('Vérification impossible pour le moment. Réessayez.', 'Verification is unavailable right now. Please try again.') });
  }

  if (check.status === 'approved') {
    await C.delKey('otp:fail:' + h);
    const now = new Date().toISOString();
    const preuve = C.sign({ v: 1, id: String(b.lead_id || '').slice(0, 64), t: Date.now(), tel: p.e164, courriel: String(b.courriel || '').toLowerCase(), otp: 'verifie' });
    return C.send(res, 200, { approved: true, verifie_le: now, canal: check.channel || '', preuve });
  }
  const n = await C.hit('otp:fail:' + h, LOCK);
  if (n >= MAX_FAILS) {
    await C.setKey('otp:lock:' + h, Date.now() + LOCK * 1000, LOCK);
    return C.send(res, 200, { approved: false, locked: true, retry_after: LOCK, remaining: 0, message: T('Trop de tentatives, réessayez dans 15 min.', 'Too many attempts, try again in 15 min.') });
  }
  const left = MAX_FAILS - n;
  return C.send(res, 200, { approved: false, remaining: left,
    message: T('Code incorrect, ' + left + (left > 1 ? ' essais restants.' : ' essai restant.'), 'Wrong code, ' + left + (left > 1 ? ' attempts left.' : ' attempt left.')) });
};
