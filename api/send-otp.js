/* POST /api/send-otp : envoie un code à 6 chiffres par SMS (ou appel vocal) avec Twilio Verify.
   Entrée : { telephone, canal: 'sms'|'call', lang, consent: true }
   Sécurité : consentement LCAP obligatoire, 3 envois / numéro / heure, 5 / IP / heure, 60 s entre deux envois,
   numéro verrouillé 15 min après 3 codes erronés, Lookup (VoIP non fixe, ligne inactive, SMS pumping) avant l'envoi.
   Aucun code n'est stocké ici : Twilio le génère, le garde 10 minutes et le vérifie (Loi 25). */
'use strict';
const LG = require('../assets/lead-guard.js');
const C = require('./_lib/core.js');

const OTP_LIMITS = { perPhoneHour: 3, perIpHour: 5, cooldown: 60, lock: 900 };

module.exports = async function handler(req, res) {
  if (!C.guard(req, res)) return;
  const b = C.body(req);
  const lang = b.lang === 'en' ? 'en' : 'fr';
  const T = (fr, en) => (lang === 'en' ? en : fr);
  const tw = C.twilioConf();
  if (!tw || !tw.verify) return C.send(res, 503, { ok: false, code: 'otp_non_configure', message: T('La vérification par texto n\'est pas disponible.', 'Text verification is not available.') });
  if (b.consent !== true) return C.send(res, 400, { ok: false, code: 'consentement', message: T('Cochez la case pour recevoir le code.', 'Check the box to receive the code.') });

  const p = LG.phone(b.telephone);
  if (!p.ok) return C.send(res, 400, { ok: false, code: p.block.code, field: 'telephone', message: LG.blockMessage(p.block, lang) });
  const h = C.hash(p.e164), addr = C.ip(req);

  const locked = Number(await C.peek('otp:lock:' + h)) || 0;
  if (locked > Date.now()) return C.send(res, 429, { ok: false, code: 'verrouille', locked_until: locked, retry_after: Math.ceil((locked - Date.now()) / 1000),
    message: T('Trop de tentatives, réessayez dans 15 min.', 'Too many attempts, try again in 15 min.') });
  const cool = Number(await C.peek('otp:cool:' + h)) || 0;
  if (cool > Date.now()) return C.send(res, 429, { ok: false, code: 'attendre', retry_after: Math.ceil((cool - Date.now()) / 1000),
    message: T('Patientez quelques secondes avant de demander un nouveau code.', 'Wait a few seconds before asking for a new code.') });
  const [nTel, nIp] = await Promise.all([C.hit('otp:tel:1h:' + h, 3600), addr ? C.hit('otp:ip:1h:' + C.hash(addr), 3600) : 0]);
  if (nTel > OTP_LIMITS.perPhoneHour || nIp > OTP_LIMITS.perIpHour) return C.send(res, 429, { ok: false, code: 'trop_essais', retry_after: 3600,
    message: T('Trop de codes demandés pour ce numéro. Réessayez dans une heure ou appelez-moi au (514) 296-7511.', 'Too many codes requested for this number. Try again in an hour or call me at (514) 296-7511.') });

  // Lookup avant l'envoi (une fois par heure et par numéro) : bloque VoIP non fixe, ligne inactive, SMS pumping
  let lk = null;
  if (C.env('TWILIO_LOOKUP') !== '0') {
    const cached = await C.peek('lk:' + h);
    if (cached && typeof cached === 'string') { try { lk = JSON.parse(cached); } catch (e) { lk = null; } }
    if (!lk) { lk = await C.withTimeout(C.lookup(p.e164).catch(() => null), 5000); if (lk) await C.setKey('lk:' + h, JSON.stringify(lk), 3600); }
  }
  if (lk) {
    if (!lk.valid) return C.send(res, 400, { ok: false, code: 'tel_motif', field: 'telephone', message: LG.msg('tel_motif', lang) });
    if (lk.status === 'inactive') return C.send(res, 400, { ok: false, code: 'tel_inactif', field: 'telephone', message: LG.msg('tel_inactif', lang) });
    if (lk.type === 'nonFixedVoip' && C.env('TWILIO_BLOCK_VOIP') !== '0') return C.send(res, 400, { ok: false, code: 'tel_voip', field: 'telephone', message: LG.msg('tel_voip', lang) });
    if (lk.pumping === 'high' || lk.pumping_blocked || (lk.pumping_score != null && lk.pumping_score >= 75)) return C.send(res, 400, { ok: false, code: 'rejete', field: 'telephone', message: LG.msg('rejete', lang) });
  }

  let canal = b.canal === 'call' ? 'call' : 'sms';
  try {
    const v = await C.twilio('POST', 'https://verify.twilio.com/v2/Services/' + tw.verify + '/Verifications', { To: p.e164, Channel: canal, Locale: lang });
    await C.setKey('otp:cool:' + h, Date.now() + OTP_LIMITS.cooldown * 1000, OTP_LIMITS.cooldown);
    return C.send(res, 200, { ok: true, canal, status: v.status, retry_after: OTP_LIMITS.cooldown, expires_in: 600, display: p.display,
      carrier: lk && lk.carrier || '', type: lk && lk.type || '' });
  } catch (e) {
    // 60205 : le numéro ne reçoit pas les SMS (ligne fixe) → proposer l'appel vocal
    if (e.code === 60205) return C.send(res, 400, { ok: false, code: 'sms_impossible', suggest: 'call',
      message: T('Ce numéro ne reçoit pas les textos. Recevez plutôt le code par appel vocal.', 'This number cannot receive texts. Get the code by voice call instead.') });
    if (e.code === 60203 || e.status === 429) return C.send(res, 429, { ok: false, code: 'trop_essais', retry_after: 600,
      message: T('Trop de codes demandés. Réessayez dans 10 minutes.', 'Too many codes requested. Try again in 10 minutes.') });
    if (e.code === 60410 || e.code === 60605) return C.send(res, 400, { ok: false, code: 'rejete', message: LG.msg('rejete', lang) });
    if (e.code === 60200 || e.code === 21211 || e.code === 21614) return C.send(res, 400, { ok: false, code: 'tel_motif', field: 'telephone', message: LG.msg('tel_motif', lang) });
    console.error('[send-otp]', e.code, e.message);
    return C.send(res, 502, { ok: false, code: 'service', message: T('Le code n\'a pas pu être envoyé. Réessayez dans un instant.', 'The code could not be sent. Please try again shortly.') });
  }
};
