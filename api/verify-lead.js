/* POST /api/verify-lead : note un lead de 0 à 100 avant qu'il parte vers la feuille et le courriel.
   Couches : LeadGuard (motifs, NANP, préfixes, 10 000+ domaines jetables) → Turnstile → limites de débit →
   MX du domaine → Twilio Lookup v2 → Abstract (SMTP) → IPQualityScore → géo Vercel.
   Réponse : { ok, action: CLEAN|SUSPICIOUS|FAKE|SILENT, score, reasons, field, message, suggestion,
               otp, canal, phone, meta, preuve }
   ok:false = la personne doit corriger un champ (message prêt à afficher). */
'use strict';
const LG = require('../assets/lead-guard.js');
const DISPOSABLE = new Set(require('./_lib/disposable-domains.js'));
const C = require('./_lib/core.js');

const isDisposable = (d) => { if (DISPOSABLE.has(d)) return true; const p = d.split('.'); for (let i = 1; i < p.length - 1; i++) if (DISPOSABLE.has(p.slice(i).join('.'))) return true; return false; };

module.exports = async function handler(req, res) {
  if (!C.guard(req, res)) return;
  const b = C.body(req);
  const lang = b.lang === 'en' ? 'en' : 'fr';
  const addr = C.ip(req), geo = C.geo(req);
  const meta = { ip: addr, pays: geo.pays, region: geo.region };
  const reply = (o) => C.send(res, 200, Object.assign({ meta: { pays: geo.pays, region: geo.region } }, o));
  const fail = (code, field, extra) => reply(Object.assign({ ok: false, action: 'FAKE', field: field || null, code, message: LG.msg(code, lang, extra && extra.vars) }, extra || {}));

  // 1. Pot de miel : faux succès, rien d'autre (le robot ne doit pas savoir qu'il est repéré)
  if (b.hp) return reply({ ok: true, action: 'SILENT', score: 100, reasons: ['pot_de_miel'] });

  // 2. Limite brute par IP (toutes tentatives confondues, y compris les corrections)
  if (addr) {
    const n = await C.hit('vl:ip:10m:' + C.hash(addr), 600);
    if (n > 12) return fail('trop_essais', null, { retry_after: 600 });
  }

  // 3. Turnstile (si TURNSTILE_SECRET)
  const ts = await C.turnstile(b.turnstile, addr).catch(() => ({ configured: true, ok: false }));
  if (!ts.ok) return fail('captcha', null);

  // 4. Règles locales (mêmes que dans le navigateur, avec la liste complète des domaines jetables)
  const sig = b.signals || {};
  const lead = {
    prenom: b.prenom, nom: b.nom, courriel: b.courriel, telephone: b.telephone, message: b.message,
    hp: b.hp, elapsed_ms: typeof sig.elapsed_ms === 'number' ? sig.elapsed_ms : undefined, signals: sig,
    phoneOptional: !!b.phoneOptional, emailOptional: !!b.emailOptional, prenomOptional: !!b.prenomOptional, acceptTypo: b.acceptTypo || ''
  };
  if (b.prenom === undefined) delete lead.prenom;
  const a = LG.assess(lead, { disposable: isDisposable });
  let score = a.score; const reasons = a.reasons.slice();
  if (a.blocks.length) {
    const blk = a.blocks[0];
    return reply({ ok: false, action: 'FAKE', score: Math.min(100, score), reasons, field: blk.field, code: blk.code,
      message: LG.blockMessage(blk, lang), suggestion: a.email && a.email.suggestion || null });
  }
  const e164 = a.phone && a.phone.e164 || '';
  const email = a.email && a.email.value || '';

  // 5. Vérifications distantes, en parallèle, chacune plafonnée à quelques secondes
  const tw = C.twilioConf();
  const doLookup = !!(tw && e164 && C.env('TWILIO_LOOKUP') !== '0');
  const [mxr, abs, ipr, lk] = await Promise.all([
    email ? C.withTimeout(C.mx(email.split('@')[1]), 3000) : null,
    email ? C.withTimeout(C.abstractEmail(email), 4000) : null,
    C.withTimeout(C.ipqs(addr), 3000),
    doLookup ? C.withTimeout(C.lookup(e164).catch((e) => ({ error: e.message })), 5000) : null
  ]);

  // Courriel
  if (mxr === 'none') return fail('courriel_domaine', 'courriel', { score: 100, reasons: reasons.concat('courriel_sans_mx') });
  if (mxr === 'a_only') { score += 20; reasons.push('courriel_sans_mx'); }
  if (abs) {
    if (abs.disposable) return fail('courriel_jetable', 'courriel', { score: 100, reasons: reasons.concat('courriel_jetable_api') });
    if (abs.deliverability === 'UNDELIVERABLE') return fail('courriel_invalide', 'courriel', { score: 100, reasons: reasons.concat('courriel_non_livrable') });
    if (abs.role && reasons.indexOf('courriel_role') < 0) { score += 20; reasons.push('courriel_role'); }
    if (abs.catchall) { score += 10; reasons.push('courriel_catchall'); }
    if (abs.deliverability === 'RISKY') { score += 20; reasons.push('courriel_risque'); }
    if (abs.quality != null && abs.quality < 0.5 && abs.deliverability !== 'DELIVERABLE') { score += 20; reasons.push('courriel_qualite_faible'); }
  }

  // Téléphone (Twilio Lookup v2)
  let phoneInfo = e164 ? { e164, display: a.phone.display, province: a.phone.province || '' } : null;
  let canal = 'sms';
  if (lk && !lk.error) {
    phoneInfo.carrier = lk.carrier; phoneInfo.type = lk.type; phoneInfo.status = lk.status;
    if (!lk.valid) return fail('tel_motif', 'telephone', { score: 100, reasons: reasons.concat('lookup_invalide') });
    if (lk.status === 'inactive') return fail('tel_inactif', 'telephone', { score: 100, reasons: reasons.concat('ligne_inactive') });
    if (lk.type === 'nonFixedVoip') {
      reasons.push('tel_voip_non_fixe'); score += 40;
      if (C.env('TWILIO_BLOCK_VOIP') !== '0') return fail('tel_voip', 'telephone', { score: Math.min(100, score), reasons });
    }
    if (lk.type === 'fixedVoip') { score += 15; reasons.push('tel_voip_fixe'); canal = 'call'; }
    if (lk.type === 'landline') { canal = 'call'; }
    if (/^(personal|tollFree|premium|sharedCost|uan|voicemail|pager)$/.test(lk.type)) { score += 30; reasons.push('tel_type_' + lk.type); }
    if (lk.type === 'unknown' || !lk.type) { score += 10; reasons.push('tel_type_inconnu'); }
    if (lk.status === 'unreachable') { score += 15; reasons.push('ligne_injoignable'); }
    if (lk.pumping === 'high' || (lk.pumping_score != null && lk.pumping_score >= 75) || lk.pumping_blocked) {
      return fail('rejete', 'telephone', { score: 100, reasons: reasons.concat('sms_pumping_eleve') });
    }
    if (lk.sim_swap) { score += 30; reasons.push('sim_echangee_7j'); }
    if (lk.forwarding) { score += 10; reasons.push('renvoi_appel'); }
    if (lk.reassigned) { score += 40; reasons.push('numero_reattribue'); }
  } else if (lk && lk.error) reasons.push('lookup_erreur');

  // Réseau
  if (ipr) {
    if (ipr.tor) { score += 40; reasons.push('ip_tor'); }
    else if (ipr.proxy || ipr.vpn) { score += 20; reasons.push('ip_proxy_vpn'); }
    if (ipr.fraud >= 85 || ipr.abuse) { score += 20; reasons.push('ip_abus_recent'); }
  }
  if (geo.pays && geo.pays !== 'CA' && geo.pays !== 'US') { score += 20; reasons.push('geo_pays_' + geo.pays); }

  // 6. Limites par soumission acceptée (IP 3/10 min, 5/h, 10/jour ; même courriel ou téléphone 2/h)
  const h = { ip: addr ? C.hash(addr) : '', em: email ? C.hash(email) : '', tel: e164 ? C.hash(e164) : '' };
  const counts = await Promise.all([
    h.ip ? C.hit('sub:ip:10m:' + h.ip, 600) : 0, h.ip ? C.hit('sub:ip:1h:' + h.ip, 3600) : 0, h.ip ? C.hit('sub:ip:1d:' + h.ip, 86400) : 0,
    h.em ? C.hit('sub:em:1h:' + h.em, 3600) : 0, h.tel ? C.hit('sub:tel:1h:' + h.tel, 3600) : 0
  ]);
  if (counts[0] > 3 || counts[1] > 5 || counts[2] > 10 || counts[3] > 2 || counts[4] > 2) {
    return fail('trop_essais', null, { score: Math.min(100, score + 20), reasons: reasons.concat('limite_debit'), retry_after: 600 });
  }

  score = Math.min(100, score);
  const action = LG.action(score, false);
  const otp = !!(b.otp_possible && e164 && tw && tw.verify);
  const preuve = C.sign({ v: 1, id: String(b.lead_id || '').slice(0, 64), t: Date.now(), tel: e164, courriel: email, score, action, reasons, ip: addr, pays: geo.pays });
  return reply({ ok: true, action, score, reasons, otp, canal, phone: phoneInfo, meta: { ip: addr, pays: geo.pays, region: geo.region }, preuve,
    checks: { mx: mxr || 'n/a', lookup: !!(lk && !lk.error), abstract: !!abs, ipqs: !!ipr, turnstile: ts.configured, kv: !!C.kvConf() } });
};
