// Les 20 cas du document « Ultimate Fake Lead Prevention V2 » + cas réels qui doivent passer.
// Appelle directement les fonctions api/*.js avec Twilio simulé. Écrit TEST_RESULTS_V2.md à la racine.
// Usage : node tools/test-leads.mjs
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { installTwilioMock } from './twilio-mock.mjs';

installTwilioMock();
process.env.LEAD_PROOF_SECRET = 'test-secret';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const verify = require(join(ROOT, 'api/verify-lead.js'));
const sendOtp = require(join(ROOT, 'api/send-otp.js'));
const checkOtp = require(join(ROOT, 'api/check-otp.js'));

let ipN = 1;
function call(handler, body, ip) {
  return new Promise((resolve) => {
    const req = { method: 'POST', body, headers: { origin: 'http://localhost:3000', 'x-real-ip': ip || ('10.0.0.' + (ipN++)), 'x-vercel-ip-country': 'CA' } };
    const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { resolve({ status: this.statusCode, data: JSON.parse(b || '{}') }); } };
    handler(req, res);
  });
}
const human = { elapsed_ms: 95000, focus: 5, keys: 60, pastes: 0, fields: 4 };
const lead = (o) => Object.assign({ prenom: 'Marie', nom: 'Tremblay', courriel: 'marie.tremblay@videotron.ca', telephone: '438 291-5562', signals: human, otp_possible: true, lead_id: 't' + ipN }, o);

const rows = [];
async function test(n, name, expect, fn) {
  let got, pass;
  try { [got, pass] = await fn(); } catch (e) { got = 'ERREUR ' + e.message; pass = false; }
  rows.push({ n, name, expect, got, pass });
  console.log((pass ? 'PASS ' : 'FAIL ') + n + ' · ' + name + ' → ' + got);
}
const v = (r) => r.data.ok ? r.data.action + ' ' + r.data.score + '/100' + (r.data.otp ? ', code SMS requis' : '') : 'BLOQUÉ (' + r.data.code + ') « ' + r.data.message + ' »';

await test(1, 'Lead réel : 438 291-5562 + walid.vrai@gmail.com', 'PASSE, code SMS envoyé', async () => {
  const r = await call(verify, lead({ courriel: 'walid.vrai@gmail.com' }));
  const s = await call(sendOtp, { telephone: '438 291-5562', consent: true });
  return [v(r) + ' · send-otp ' + s.status + ' ' + (s.data.ok ? 'envoyé (' + s.data.canal + ')' : s.data.code), r.data.ok && r.data.action === 'CLEAN' && r.data.otp && s.data.ok];
});
await test('1b', 'Cas 1 tel quel : (514) 123-4567', 'BLOQUÉ : le central 123 commence par 1 (impossible au NANP)', async () => {
  const r = await call(verify, lead({ telephone: '(514) 123-4567' })); return [v(r), !r.data.ok];
});
await test(2, '444-123-4567', 'BLOQUÉ (indicatif 444 inexistant)', async () => { const r = await call(verify, lead({ telephone: '444-123-4567' })); return [v(r), !r.data.ok && r.data.field === 'telephone']; });
await test(3, 'test@gmail.com', 'BLOQUÉ (préfixe test)', async () => { const r = await call(verify, lead({ courriel: 'test@gmail.com' })); return [v(r), !r.data.ok && r.data.field === 'courriel']; });
await test(4, '444-444-4444 + test@gmail.com', 'BLOQUÉ, pointage 100', async () => {
  const r = await call(verify, lead({ telephone: '444-444-4444', courriel: 'test@gmail.com' })); return [v(r) + ' · pointage ' + r.data.score, !r.data.ok && r.data.score === 100];
});
await test(5, '514-555-0100 (fictif)', 'BLOQUÉ (555-0100 à 0199 réservés)', async () => { const r = await call(verify, lead({ telephone: '514-555-0100' })); return [v(r), !r.data.ok && r.data.code === 'tel_fictif_555']; });
await test(6, '111-111-1111', 'BLOQUÉ (répétition)', async () => { const r = await call(verify, lead({ telephone: '111-111-1111' })); return [v(r), !r.data.ok]; });
await test(7, '123-456-7890', 'BLOQUÉ (séquence)', async () => { const r = await call(verify, lead({ telephone: '123-456-7890' })); return [v(r), !r.data.ok]; });
await test(8, '514-411-1234 (N11)', 'BLOQUÉ (central N11)', async () => { const r = await call(verify, lead({ telephone: '514-411-1234' })); return [v(r), !r.data.ok && r.data.code === 'tel_central_n11']; });
await test(9, 'jean@yopmail.com, jean@tempmail.com, x@0-mailer.dynv6.net', 'BLOQUÉ (jetable)', async () => {
  const a = await call(verify, lead({ courriel: 'jean@yopmail.com' })), b = await call(verify, lead({ courriel: 'jean@tempmail.com' })), c = await call(verify, lead({ courriel: 'x@0-mailer.dynv6.net' }));
  return [[a, b, c].map((r) => r.data.code).join(', ') + ' (le 3e vient de la liste complète de 10 000+ domaines)', [a, b, c].every((r) => !r.data.ok && r.data.code === 'courriel_jetable')];
});
await test(10, 'jean@gmai.com', 'Suggestion gmail.com', async () => { const r = await call(verify, lead({ courriel: 'jean@gmai.com' })); return [v(r) + ' · suggestion ' + r.data.suggestion, r.data.suggestion === 'jean@gmail.com']; });
await test('10b', 'jean@gmai.com renvoyé tel quel (faute assumée)', 'Accepté avec +30', async () => {
  const r = await call(verify, lead({ courriel: 'jean@gmai.com', acceptTypo: 'gmai.com' })); return [v(r), r.data.ok && r.data.reasons.includes('courriel_typo_maintenu')];
});
await test(11, 'Numéro Google Voice (VoIP non fixe, Lookup)', '+40 et refusé', async () => { const r = await call(verify, lead({ telephone: '514 700-0000' })); return [v(r) + ' · ' + r.data.reasons.join(' '), !r.data.ok && r.data.code === 'tel_voip']; });
await test(12, 'Ligne inactive (Lookup)', 'BLOQUÉ', async () => { const r = await call(verify, lead({ telephone: '514 700-0001' })); return [v(r), !r.data.ok && r.data.code === 'tel_inactif']; });
await test(13, 'Pot de miel rempli', 'Faux succès silencieux', async () => { const r = await call(verify, lead({ hp: 'http://spam.example' })); return [r.data.action + ' (ok: ' + r.data.ok + ', rien n\'est enregistré)', r.data.ok && r.data.action === 'SILENT']; });
await test(14, 'Envoi 1 s après l\'ouverture de la page', 'BLOQUÉ (< 3 s)', async () => {
  const r = await call(verify, lead({ signals: { elapsed_ms: 1000, focus: 0, keys: 0, pastes: 0, fields: 4 } })); return [v(r), !r.data.ok && r.data.code === 'envoi_moins_3s'];
});
await test(15, '4 envois de la même IP en 5 min', 'Le 4e est BLOQUÉ', async () => {
  const out = [];
  for (let i = 0; i < 4; i++) out.push(await call(verify, lead({ courriel: 'client' + 'abcd'[i] + '.roy@gmail.com', telephone: '438 291-55' + (70 + i) }), '10.9.9.9'));
  return [out.map((r) => r.data.ok ? 'ok' : r.data.code).join(' → '), out.slice(0, 3).every((r) => r.data.ok) && out[3].data.code === 'trop_essais'];
});
await test(16, 'Nom « xkzj qwrp »', 'BLOQUÉ (charabia)', async () => { const r = await call(verify, lead({ prenom: 'xkzj qwrp' })); return [v(r), !r.data.ok && r.data.field === 'prenom']; });
await test(17, 'asdf@gmail.com', 'BLOQUÉ (clavier)', async () => { const r = await call(verify, lead({ courriel: 'asdf@gmail.com' })); return [v(r), !r.data.ok]; });
await test(18, 'info@company.com', 'Signalé +20, accepté avec code SMS', async () => {
  const r = await call(verify, lead({ courriel: 'info@company.com', telephone: '438 291-5590' })); return [v(r) + ' · ' + r.data.reasons.join(' '), r.data.ok && r.data.reasons.includes('courriel_role') && r.data.otp];
});
await test(19, 'Code SMS erroné 3 fois', 'Numéro verrouillé 15 min', async () => {
  const tel = '438 291-5599';
  await call(sendOtp, { telephone: tel, consent: true });
  const a = await call(checkOtp, { telephone: tel, code: '000000' }), b = await call(checkOtp, { telephone: tel, code: '111111' }), c = await call(checkOtp, { telephone: tel, code: '222222' });
  const d = await call(checkOtp, { telephone: tel, code: '123456' });
  const e = await call(sendOtp, { telephone: tel, consent: true });
  return ['« ' + a.data.message + ' » → « ' + b.data.message + ' » → verrouillé ' + c.data.retry_after + ' s; bon code ensuite : ' + d.status + '; nouvel envoi : ' + e.status,
    a.data.remaining === 2 && b.data.remaining === 1 && c.data.locked && d.status === 429 && e.status === 429];
});
await test(20, 'Bon code SMS', 'Approuvé, preuve signée', async () => {
  const tel = '438 291-5588';
  await call(sendOtp, { telephone: tel, consent: true });
  const r = await call(checkOtp, { telephone: tel, code: '123456', lead_id: 'abc', courriel: 'a@b.ca' });
  return ['approved: ' + r.data.approved + ', preuve ' + (r.data.preuve ? r.data.preuve.slice(0, 18) + '…' : 'absente'), r.data.approved && !!r.data.preuve];
});
// Garde-fous supplémentaires
await test(21, 'Envoi de code sans consentement LCAP', 'Refusé (400)', async () => { const r = await call(sendOtp, { telephone: '438 291-5577' }); return [r.status + ' ' + r.data.code, r.status === 400]; });
await test(22, 'Renvoi du code avant 60 s', 'Refusé (429), délai indiqué', async () => {
  await call(sendOtp, { telephone: '438 291-5566', consent: true }); const r = await call(sendOtp, { telephone: '438 291-5566', consent: true });
  return [r.status + ' ' + r.data.code + ' ' + r.data.retry_after + ' s', r.status === 429 && r.data.code === 'attendre'];
});
await test(23, 'Appel d\'un autre site (Origin étranger)', 'Refusé (403)', async () => {
  const r = await new Promise((resolve) => verify({ method: 'POST', body: lead({}), headers: { origin: 'https://evil.example' } },
    { statusCode: 200, setHeader() {}, end(b) { resolve({ status: this.statusCode, data: JSON.parse(b) }); } }));
  return [String(r.status), r.status === 403];
});
await test(24, 'SMS pumping élevé (Lookup)', 'BLOQUÉ, aucun code envoyé', async () => { const r = await call(verify, lead({ telephone: '514 700-0003' })); return [v(r), !r.data.ok]; });
await test(25, 'VoIP fixe (téléphone résidentiel Internet)', 'Accepté +15, code par appel vocal', async () => { const r = await call(verify, lead({ telephone: '514 700-0002' })); return [v(r) + ' · canal ' + r.data.canal, r.data.ok && r.data.canal === 'call']; });
await test(30, 'Numéro hors Québec / Ontario : 604 (C.-B.), 403 (Alberta), 212 (New York)', 'BLOQUÉ (zone desservie)', async () => {
  const out = []; for (const t of ['604 555-1234', '403 555-1234', '212 555-1234']) out.push(await call(verify, lead({ telephone: t })));
  return [out.map((r) => r.data.code).join(', '), out.every((r) => !r.data.ok && r.data.code === 'tel_hors_zone')];
});
await test(31, 'Terminaisons inhabituelles : x@site.xyz, x@mail.ru, x@promo.top', 'BLOQUÉ (courriel suspect)', async () => {
  const out = []; for (const e of ['x.roy@site.xyz', 'luc.roy@mail.ru', 'ana.roy@promo.top']) out.push(await call(verify, lead({ courriel: e })));
  return [out.map((r) => r.data.code).join(', '), out.every((r) => !r.data.ok && r.data.code === 'courriel_suspect')];
});
await test(32, 'Commence par « test » ou « fake » : test.jean@, test_1@, fake-email@', 'BLOQUÉ', async () => {
  const out = []; for (const e of ['test.jean@gmail.com', 'test_1@hotmail.com', 'fake-email@gmail.com']) out.push(await call(verify, lead({ courriel: e })));
  return [out.map((r) => r.data.code).join(', '), out.every((r) => !r.data.ok && r.data.field === 'courriel')];
});
await test(33, 'Adresse d\'entreprise : jean@constructionabc.ca, info@cpa-tremblay.com', 'PASSE', async () => {
  const a = await call(verify, lead({ courriel: 'jean@constructionabc.ca', telephone: '613 555-7788' })), b = await call(verify, lead({ courriel: 'info@cpa-tremblay.com', telephone: '819 821-2333' }));
  return [v(a) + ' | ' + v(b), a.data.ok && b.data.ok];
});
for (const [n, c] of [['26', { prenom: 'Ève', nom: 'Côté-Nguyen', courriel: 'eve.cote@hotmail.ca', telephone: '819 821-2121' }], ['27', { prenom: 'Li', nom: '', courriel: 'li.wang@outlook.com', telephone: '+1 (416) 555-2368' }],
  ['28', { prenom: 'Jean-François', nom: "O'Brien", courriel: 'jf.obrien+site@gmail.com', telephone: '1-581-300-4412' }], ['29', { prenom: 'Paul', nom: 'Testard', courriel: 'paul.testard@sympatico.ca', telephone: '450 430-1212' }]]) {
  await test(n, 'Vrai lead : ' + c.prenom + ' ' + c.nom + ', ' + c.courriel + ', ' + c.telephone, 'PASSE', async () => { const r = await call(verify, lead(c)); return [v(r), r.data.ok && r.data.action !== 'FAKE']; });
}

const ok = rows.filter((r) => r.pass).length;
const md = ['# Résultats des tests anti-faux leads (V2)', '',
  'Généré par `node tools/test-leads.mjs` le ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC, avec Twilio simulé (`tools/twilio-mock.mjs`).',
  'Les vérifications MX, Abstract, IPQualityScore et Turnstile ne sont pas actives dans ce test (pas de clés, réseau DNS du bac à sable).', '',
  '**' + ok + ' / ' + rows.length + ' réussis.**', '',
  '| # | Cas | Attendu | Obtenu | |', '|---|---|---|---|---|',
  ...rows.map((r) => '| ' + r.n + ' | ' + r.name.replace(/\|/g, '/') + ' | ' + r.expect + ' | ' + String(r.got).replace(/\|/g, '/') + ' | ' + (r.pass ? '✅' : '❌') + ' |'), '',
  '## Écarts volontaires par rapport au document', '',
  '- **Cas 1** : le document attend que `(514) 123-4567` passe, mais le central `123` commence par 1, ce qui est impossible au NANP (le même document demande de bloquer les centraux 0XX/1XX). Le test 1 utilise donc un numéro valide.',
  '- **« 444 n\'importe où »** : seuls l\'indicatif 444 (inexistant) et la suite `444444` sont bloqués. Bloquer tout numéro contenant « 444 » refuserait de vrais clients (ex. 450 444-2187).',
  '- **VoIP fixe** (`fixedVoip`) : signalée (+15) et code envoyé par appel vocal, pas bloquée. Au Québec, beaucoup de lignes résidentielles (Vidéotron, Bell Fibe) sont de la VoIP fixe. La VoIP non fixe (Google Voice, TextNow) reste bloquée.',
  '- **Charabia dans le courriel** (`xkzjq@`) : points de risque (+30), pas de blocage : des initiales ou des noms rares peuvent ressembler à du charabia. Le code SMS tranche.',
  '- **Faute de domaine** : suggestion cliquable ; si la personne renvoie la même adresse, elle est acceptée avec +30 (le document : « +30 si non corrigé »).', ''].join('\n');
writeFileSync(join(ROOT, 'TEST_RESULTS_V2.md'), md);
console.log('\n' + ok + '/' + rows.length + ' → TEST_RESULTS_V2.md');
process.exit(ok === rows.length ? 0 : 1);
