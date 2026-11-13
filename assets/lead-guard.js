/* ==========================================================================
   W HÉRITAGE · LeadGuard : filtre anti-faux leads (téléphone, courriel, nom, message, comportement)
   Un seul fichier, trois usages :
     1. navigateur : <script src="/assets/lead-guard.js"> → window.LeadGuard (avant site.js)
     2. Vercel     : require('../assets/lead-guard.js') dans api/verify-lead.js
     3. Apps Script: coller ce fichier tel quel dans un fichier « LeadGuard.gs » du projet
   Aucune dépendance. Règles NANP (indicatif, central, N11, 555-01XX fictifs), motifs de faux numéros,
   préfixes de courriel bidons (test@gmail.com), domaines jetables courants, fautes de frappe,
   charabia, comptes de rôle, pot de miel et temps de remplissage. Pointage 0-100 :
     0-29 CLEAN · 30-69 SUSPICIOUS · 70+ FAKE · pot de miel = SILENT (faux succès, rien n'est gardé).
   Une règle « bloquante » (block) arrête le formulaire avec un message par champ ; les autres
   ajoutent des points (pts) et seront jugées avec les vérifications serveur (Twilio, MX, etc.).
   ========================================================================== */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LeadGuard = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ── Indicatifs régionaux canadiens en service ou annoncés (CNAC / NANPA, 2026) ── */
  var CA_AREA = {
    QC: ['263', '354', '367', '418', '438', '450', '468', '514', '579', '581', '819', '873'],
    ON: ['226', '249', '289', '343', '365', '382', '416', '437', '519', '548', '613', '647', '683', '705', '742', '753', '807', '905', '942'],
    BC: ['236', '250', '257', '604', '672', '778'],
    AB: ['368', '403', '587', '780', '825'],
    SK: ['306', '474', '639'],
    MB: ['204', '431', '584'],
    NB: ['428', '506'],
    NS_PE: ['782', '902'],
    NL: ['709', '879'],
    NORD: ['867']
  };
  var AREA_PROV = {};
  Object.keys(CA_AREA).forEach(function (p) { CA_AREA[p].forEach(function (a) { AREA_PROV[a] = p; }); });
  // Sans frais et non géographiques : pas un numéro personnel
  var NON_PERSONNEL = /^(800|833|844|855|866|877|888|600|622|633|644|655|677|688|900|976)$/;
  var TEST_NUMBERS = ['1234567890', '0123456789', '9876543210', '1231231234', '1111111111', '2222222222', '3333333333',
    '4444444444', '5555555555', '6666666666', '7777777777', '8888888888', '9999999999', '0000000000', '5555551234', '5555555555'];

  /* ── Courriel ── */
  // Préfixes bidons : comparés à la partie locale sans chiffres ni séparateurs (test, test123, t.e.s.t, test_1 …)
  var FAKE_LOCAL = ['test', 'tests', 'testing', 'testtest', 'tester', 'testeur', 'essai', 'fake', 'faked', 'faketest', 'fakeemail', 'fakemail',
    'faux', 'asdf', 'asdfasdf', 'asdfg', 'asdfgh', 'qwerty', 'qwert', 'qwertz', 'azerty', 'zxcv', 'zxcvb', 'zxcvbn', 'qazwsx', 'qaz', 'wsx',
    'password', 'motdepasse', 'admin', 'administrator', 'administrateur', 'root', 'user', 'username', 'utilisateur', 'name', 'nom', 'prenom',
    'first', 'last', 'firstlast', 'firstname', 'lastname', 'johndoe', 'janedoe', 'johnsmith', 'sample', 'example', 'exemple',
    'temp', 'temporary', 'temporaire', 'disposable', 'trash', 'garbage', 'junk', 'invalid', 'null', 'undefined', 'void', 'none', 'nobody', 'nothing',
    'spam', 'spammer', 'bot', 'robot', 'noreply', 'donotreply', 'nepasrepondre', 'postmaster', 'hostmaster', 'webmaster', 'abuse', 'mailerdaemon',
    'abc', 'abcd', 'abcdef', 'abcdefg', 'xyz', 'xxx', 'xxxx', 'aaa', 'foo', 'bar', 'foobar', 'blah', 'blabla', 'lorem', 'loremipsum', 'nope',
    'nonono', 'jeanmichel', 'nomail', 'noemail', 'pasdecourriel', 'aucun', 'rien', 'email', 'courriel', 'mail', 'monemail', 'moncourriel', 'myemail'];
  var FAKE_LOCAL_SET = {};
  FAKE_LOCAL.forEach(function (w) { FAKE_LOCAL_SET[w] = 1; });
  // Purement numériques ou suites évidentes : 123456@, 123123@, 111111@
  var FAKE_LOCAL_RX = /^(\d{1,4}|1234\d*|123123\d*|(\d)\2{3,}|0+)$/;
  // Comptes de rôle : acceptés, mais pas une personne (+20)
  var ROLE_LOCAL = ['info', 'infos', 'contact', 'contacts', 'support', 'sales', 'ventes', 'vente', 'marketing', 'billing', 'facturation',
    'accounting', 'comptabilite', 'compta', 'finance', 'finances', 'hr', 'rh', 'humanresources', 'recruiting', 'jobs', 'careers', 'emplois',
    'carrieres', 'press', 'presse', 'media', 'medias', 'legal', 'juridique', 'compliance', 'conformite', 'office', 'bureau', 'reception', 'accueil',
    'service', 'services', 'serviceclient', 'help', 'aide', 'team', 'equipe', 'hello', 'bonjour', 'security', 'securite', 'privacy', 'admin',
    'direction', 'general', 'commandes', 'orders', 'administration', 'secretariat'];
  var ROLE_SET = {};
  ROLE_LOCAL.forEach(function (w) { ROLE_SET[w] = 1; });

  // Domaines jetables les plus courants (la liste complète, 10 000+, est vérifiée côté serveur)
  var DISPOSABLE = ['mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com', 'sharklasers.com',
    'grr.la', 'pokemail.net', 'spam4.me', '10minutemail.com', '10minutemail.net', '10minutemail.co.uk', '10minemail.com', '20minutemail.com',
    'temp-mail.org', 'temp-mail.io', 'tempmail.com', 'tempmail.net', 'tempmailo.com', 'tempmail.dev', 'tempmailaddress.com', 'tempr.email',
    'tempinbox.com', 'yopmail.com', 'yopmail.fr', 'yopmail.net', 'cool.fr.nf', 'jetable.fr.nf', 'nospam.ze.tc', 'nomail.xl.cx', 'mega.zik.dj',
    'speed.1s.fr', 'courriel.fr.nf', 'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf', 'jetable.org', 'trashmail.com', 'trashmail.net',
    'trashmail.de', 'trashmail.me', 'trash-mail.com', 'maildrop.cc', 'dispostable.com', 'throwawaymail.com', 'getnada.com', 'nada.email',
    'mintemail.com', 'mohmal.com', 'emailondeck.com', '0-mail.com', '0815.ru', '0clickemail.com', '0wnd.net', '0wnd.org', '10mail.org',
    '33mail.com', 'mailnesia.com', 'mailcatch.com', 'mytemp.email', 'fakeinbox.com', 'fakemail.net', 'fakemailgenerator.com', 'emailfake.com',
    'mail.tm', 'mail.gw', 'tmail.ws', 'tmpmail.org', 'tmpmail.net', 'tmpeml.com', 'spamgourmet.com', 'spambox.us', 'spamex.com', 'mailinator.net',
    'mailinator2.com', 'binkmail.com', 'bobmail.info', 'chammy.info', 'devnullmail.com', 'letthemeatspam.com', 'mailin8r.com', 'mailinater.com',
    'notmailinator.com', 'reallymymail.com', 'safetymail.info', 'sogetthis.com', 'spamherelots.com', 'thisisnotmyrealemail.com', 'tradermail.info',
    'veryrealemail.com', 'zippymail.info', 'suremail.info', 'mailexpire.com', 'meltmail.com', 'incognitomail.org', 'anonbox.net', 'discard.email',
    'discardmail.com', 'dropmail.me', 'emailtemporanea.net', 'burnermail.io', 'inboxkitten.com', 'harakirimail.com', 'mvrht.net', 'spambog.com',
    'mailpoof.com', 'moakt.com', 'byom.de', 'wegwerfmail.de', 'wegwerfemail.de', 'einrot.com', 'emltmp.com', 'emailnax.com', 'luxusmail.org',
    'fexbox.org', 'fexpost.com', 'mailbox.in.ua', 'rover.info', 'vomoto.com', 'kzccv.com', 'qiott.com', 'wuuvo.com', 'cuvox.de', 'armyspy.com',
    'dayrep.com', 'einrot.de', 'fleckens.hu', 'gustr.com', 'jourrapide.com', 'rhyta.com', 'superrito.com', 'teleworm.us', 'mailsac.com',
    'linshiyouxiang.net', 'emailtemp.org', 'tempemail.co', 'tempemail.net', 'minuteinbox.com', 'mail7.io', 'inboxbear.com', 'tempm.com',
    'crazymailing.com', 'mailforspam.com', 'trbvm.com', 'mailtothis.com', 'spamfree24.org', 'getairmail.com', 'airmail.cc', 'mailmetrash.com'];
  var DISPOSABLE_SET = {};
  DISPOSABLE.forEach(function (d) { DISPOSABLE_SET[d] = 1; });

  // Fournisseurs connus, pour suggérer la bonne orthographe (gmai.com → gmail.com)
  var KNOWN_DOMAINS = ['gmail.com', 'hotmail.com', 'hotmail.ca', 'hotmail.fr', 'outlook.com', 'outlook.fr', 'live.com', 'live.ca', 'msn.com',
    'yahoo.com', 'yahoo.ca', 'yahoo.fr', 'icloud.com', 'me.com', 'mac.com', 'videotron.ca', 'videotron.qc.ca', 'sympatico.ca', 'bell.net',
    'rogers.com', 'shaw.ca', 'telus.net', 'cogeco.ca', 'protonmail.com', 'proton.me', 'aol.com', 'gmx.com', 'gmx.net', 'mail.com', 'globetrotter.net',
    'videotron.net', 'eastlink.ca', 'ymail.com', 'googlemail.com'];
  var KNOWN_SET = {};
  KNOWN_DOMAINS.forEach(function (d) { KNOWN_SET[d] = 1; });
  var TYPO_TLD = { con: 'com', cmo: 'com', comm: 'com', coom: 'com', ocm: 'com', vom: 'com', xom: 'com', cpm: 'com', cim: 'com', comn: 'com', cm: 'com', om: 'com', co: 'com', cxa: 'ca', caa: 'ca', ac: 'ca', ner: 'net', nte: 'net', bet: 'net' };
  // Zone desservie : permis au Québec et en Ontario seulement. Tout autre indicatif est refusé.
  var ZONE = { QC: 1, ON: 1 };
  // Terminaisons de courriel acceptées : les fournisseurs courants + les adresses d'entreprise normales.
  // Tout le reste (.xyz, .top, .ru, .click, .online…) est refusé : c'est là que vivent les adresses jetables et le pourriel.
  var OK_TLD = /^(ca|com|net|org|me|info|biz|co|us|fr|be|ch|quebec|io|edu|gov|gouv)$/;
  var BAD_TLD = /^(local|localhost|localdomain|test|example|invalid|lan|internal|home|corp|domain|fake|none)$/;

  /* ── Nom ── */
  var FAKE_NAMES = ['test', 'tests', 'tester', 'essai', 'fake', 'faux', 'asdf', 'asdfasdf', 'qwerty', 'azerty', 'zxcv', 'john doe', 'jane doe',
    'user', 'username', 'name', 'nom', 'prenom', 'prénom', 'first last', 'firstname', 'lastname', 'first', 'last', 'aaa', 'bbb', 'xxx',
    'abc', 'abcd', 'xyz', 'foo', 'bar', 'foo bar', 'null', 'undefined', 'none', 'nobody', 'personne', 'anonyme', 'anonymous', 'mickey mouse',
    'donald duck', 'batman', 'superman', 'lorem', 'lorem ipsum', 'blabla', 'bla bla', 'admin', 'bot', 'robot', 'spam', 'n/a', 'na', 'nil'];
  var FAKE_NAME_SET = {};
  FAKE_NAMES.forEach(function (w) { FAKE_NAME_SET[w] = 1; });
  var WALKS = /(qwert|wert|asdf|sdfg|zxcv|xcvb|qazw|wsxe|yxcv|azert|qsdf|wxcv|uiop|hjkl|jkl;|1qaz|2wsx)/;
  var VOWELS = /[aeiouyàâäéèêëîïôöùûüÿæœ]/gi;

  /* ── Message ── */
  var MSG_FAKE = /\b(test(ing)?|this is a test|ceci est un test|c'?est un test|lorem ipsum|asdf|qwerty|fake|blabla|bla bla)\b/i;
  var MSG_SPAM = /\b(viagra|cialis|casino|porn|xxx|crypto ?(investment|trading|signals?)|bitcoin (investment|doubler)|forex signals?|seo (services?|ranking)|backlinks?|guest post|loan offer|pr[eê]t urgent|web ?design (services?|agency)|increase your (traffic|sales)|whatsapp me)\b/i;

  /* ── Messages affichés (FR / EN) ── */
  var MSG = {
    tel_vide: ['Entrez votre numéro de téléphone.', 'Enter your phone number.'],
    tel_longueur: ['Un numéro canadien a 10 chiffres, par exemple 514 296-7511.', 'A Canadian number has 10 digits, for example 514 296-7511.'],
    tel_hors_canada: ['Entrez un numéro du Québec ou de l\'Ontario à 10 chiffres. Si vous êtes ailleurs, écrivez-moi plutôt à walid.harchaoui@agc.ia.ca.', 'Enter a 10-digit Quebec or Ontario number. If you are elsewhere, email me instead at walid.harchaoui@agc.ia.ca.'],
    tel_hors_zone: ['J\'accompagne les clients du Québec et de l\'Ontario seulement : entrez un numéro avec un indicatif de ces provinces (514, 438, 450, 418, 819, 416, 613…). Si vous êtes ailleurs, écrivez-moi à walid.harchaoui@agc.ia.ca.', 'I serve clients in Quebec and Ontario only: enter a number with an area code from these provinces (514, 438, 450, 418, 819, 416, 613…). If you are elsewhere, email me at walid.harchaoui@agc.ia.ca.'],
    courriel_suspect: ['Utilisez votre adresse courriel habituelle (par exemple @gmail.com, @hotmail.com, @outlook.com ou l\'adresse de votre entreprise en .ca ou .com).', 'Use your usual email address (for example @gmail.com, @hotmail.com, @outlook.com or your business address ending in .ca or .com).'],
    tel_indicatif: ['L\'indicatif régional {a} n\'existe pas au Canada. Vérifiez les 3 premiers chiffres.', 'Area code {a} does not exist in Canada. Check the first 3 digits.'],
    tel_sans_frais: ['Entrez un numéro personnel (cellulaire ou résidence), pas un numéro sans frais.', 'Enter a personal number (mobile or home), not a toll-free number.'],
    tel_central: ['Ce numéro n\'est pas valide : les chiffres 4 à 6 ne peuvent pas commencer par 0 ou 1, ni être 211, 311, 411, 511, 611, 711, 811 ou 911.', 'This number is not valid: digits 4 to 6 cannot start with 0 or 1, or be 211, 311, 411, 511, 611, 711, 811 or 911.'],
    tel_fictif: ['Les numéros 555-0100 à 555-0199 sont réservés au cinéma et à la publicité. Entrez votre vrai numéro.', 'Numbers 555-0100 to 555-0199 are reserved for movies and ads. Enter your real number.'],
    tel_motif: ['Ce numéro ressemble à un numéro fictif. Entrez le numéro où je peux vraiment vous joindre.', 'This looks like a made-up number. Enter the number where I can actually reach you.'],
    courriel_vide: ['Entrez votre adresse courriel.', 'Enter your email address.'],
    courriel_format: ['Vérifiez votre adresse courriel (exemple : prenom.nom@gmail.com).', 'Check your email address (example: first.last@gmail.com).'],
    courriel_test: ['Entrez votre vraie adresse courriel personnelle : « {e} » n\'est pas acceptée.', 'Enter your real personal email address: “{e}” is not accepted.'],
    courriel_jetable: ['Veuillez utiliser votre adresse permanente, pas une adresse temporaire.', 'Please use your permanent address, not a temporary one.'],
    courriel_typo: ['Vouliez-vous dire {s} ?', 'Did you mean {s}?'],
    courriel_domaine: ['Ce domaine ne peut pas recevoir de courriels. Vérifiez l\'adresse.', 'This domain cannot receive email. Check the address.'],
    courriel_invalide: ['Cette adresse courriel n\'existe pas ou ne reçoit pas de courriels. Vérifiez-la.', 'This email address does not exist or cannot receive email. Please check it.'],
    nom_vide: ['Indiquez votre prénom.', 'Enter your first name.'],
    nom_chiffres: ['Le nom ne peut pas contenir de chiffres.', 'The name cannot contain numbers.'],
    nom_courriel: ['Le champ nom contient une adresse courriel. Entrez seulement votre nom.', 'The name field contains an email address. Enter your name only.'],
    nom_test: ['Entrez votre vrai nom.', 'Enter your real name.'],
    nom_format: ['Vérifiez votre nom.', 'Check your name.'],
    message_test: ['Décrivez votre vraie situation en quelques mots.', 'Describe your actual situation in a few words.'],
    trop_rapide: ['Un instant : relisez vos réponses, puis envoyez de nouveau.', 'One moment: review your answers, then send again.'],
    trop_essais: ['Trop de tentatives. Réessayez dans quelques minutes.', 'Too many attempts. Please try again in a few minutes.'],
    captcha: ['La vérification anti-robot a échoué. Rechargez la page et réessayez.', 'The anti-bot check failed. Reload the page and try again.'],
    rejete: ['Ces coordonnées ne peuvent pas être acceptées. Vérifiez votre nom, votre courriel et votre numéro.', 'These details cannot be accepted. Check your name, email and phone number.'],
    tel_voip: ['Ce numéro est un numéro Internet (VoIP) qui ne reçoit pas les codes. Entrez votre numéro de cellulaire.', 'This is an internet (VoIP) number that cannot receive codes. Enter your mobile number.'],
    tel_inactif: ['Ce numéro n\'est pas en service. Vérifiez-le.', 'This number is not in service. Please check it.']
  };
  function msg(code, lang, vars) {
    var m = MSG[code] || MSG.rejete, s = m[lang === 'en' ? 1 : 0];
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }

  /* ── Outils ── */
  function norm(s) { return String(s == null ? '' : s).trim(); }
  function strip(s) { return s.normalize ? s.normalize('NFD').replace(/[̀-ͯ]/g, '') : s; }
  // Distance d'édition avec transpositions (gmial → gmail = 1)
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 3;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) {
      for (j = 1; j <= b.length; j++) {
        var c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[a.length][b.length];
  }
  function vowelRatio(s) { var l = s.replace(/[^a-zàâäéèêëîïôöùûüÿæœ]/gi, ''); return l.length ? (l.match(VOWELS) || []).length / l.length : 1; }
  function consonantRun(s, n) { return new RegExp('[bcdfghjklmnpqrstvwxz]{' + n + ',}', 'i').test(strip(s)); }
  function add(r, code, pts, block, field, vars) {
    r.reasons.push(code);
    r.score += pts || 0;
    if (block && !r.block) { r.block = { code: code, field: field, vars: vars || null }; }
  }
  function result(field) { return { ok: true, field: field, score: 0, reasons: [], block: null }; }
  function done(r) { r.ok = !r.block; return r; }

  /* ═════════════ TÉLÉPHONE ═════════════
     Renvoie { ok, e164, national, display, area, exchange, province, score, reasons, block } */
  function phone(raw, opts) {
    opts = opts || {};
    var r = result('telephone'), s = norm(raw);
    if (!s) { if (opts.optional) return r; add(r, 'tel_vide', 0, true, 'telephone'); return done(r); }
    var intl = /^\s*(\+|00)/.test(s);
    var d = s.replace(/\D/g, '');
    if (/^00/.test(s.trim())) d = d.slice(2);
    if (intl && d[0] !== '1') { add(r, 'tel_hors_canada', 20, true, 'telephone'); return done(r); }
    if (d.length === 11 && d[0] === '1') d = d.slice(1);
    if (d.length !== 10) { add(r, 'tel_longueur', 40, true, 'telephone'); return done(r); }
    var a = d.slice(0, 3), x = d.slice(3, 6), sub = d.slice(6);
    r.area = a; r.exchange = x; r.national = d; r.e164 = '+1' + d;
    r.display = '(' + a + ') ' + x + '-' + sub;

    // Motifs de faux numéros : évalués en premier (444-444-4444 est d'abord un faux, puis un indicatif inexistant)
    var motif = false;
    if (TEST_NUMBERS.indexOf(d) >= 0) { add(r, 'tel_numero_test', 50); motif = true; }
    if (/^(\d)\1{9}$/.test(d)) { add(r, 'tel_tous_identiques', 50); motif = true; }
    else if (/(\d)\1{6,}/.test(d)) { add(r, 'tel_chiffres_repetes', 40); motif = true; }
    if (/0123456|1234567|2345678|3456789|4567890|9876543|8765432|7654321|6543210/.test(d)) { add(r, 'tel_sequence', 40); motif = true; }
    if (/(\d\d)\1{3,}/.test(d)) { add(r, 'tel_paires_repetees', 40); motif = true; }
    if (/(\d{3})\1\1/.test(d) || /^(\d{3})\1\1\d$/.test(d)) { add(r, 'tel_triplets_repetes', 40); motif = true; }
    if ((d.match(/0/g) || []).length > 6) { add(r, 'tel_trop_de_zeros', 40); motif = true; }
    if (/444444/.test(d)) { add(r, 'tel_444', 30); motif = true; }

    // Structure NANP
    if (/^[01]/.test(a)) add(r, 'tel_indicatif_0_1', 50, true, 'telephone', { a: a });
    else if (/^[2-9]11$/.test(a)) add(r, 'tel_indicatif_n11', 50, true, 'telephone', { a: a });
    else if (NON_PERSONNEL.test(a)) add(r, 'tel_sans_frais', 30, true, 'telephone');
    else if (a === '444' || a === '555') add(r, 'tel_indicatif_' + a, 50, true, 'telephone', { a: a });
    else if (!AREA_PROV[a] || !ZONE[AREA_PROV[a]]) add(r, 'tel_hors_zone', 50, true, 'telephone', { a: a });
    else r.province = AREA_PROV[a];
    if (/^[01]/.test(x)) add(r, 'tel_central_0_1', 50, true, 'telephone');
    else if (/^[2-9]11$/.test(x)) add(r, 'tel_central_n11', 50, true, 'telephone');
    else if (x === '958' || x === '959') add(r, 'tel_central_test', 50, true, 'telephone');
    if (x === '555' && /^01\d\d$/.test(sub)) add(r, 'tel_fictif_555', 80, true, 'telephone');
    else if (x === '555') add(r, 'tel_555', 20);
    if (motif && !r.block) r.block = { code: 'tel_motif', field: 'telephone' };
    // Signaux faibles
    if (d === d.split('').reverse().join('')) add(r, 'tel_palindrome', 20);
    if (a === x) add(r, 'tel_indicatif_egal_central', 10);
    if (/^(\d)\1{3}$/.test(sub)) add(r, 'tel_fin_repetee', 10);
    return done(r);
  }
  // Code affiché pour un blocage téléphone (regroupe les codes internes)
  function phoneMsgCode(code) {
    if (/^tel_indicatif/.test(code)) return 'tel_indicatif';
    if (/^tel_central/.test(code)) return 'tel_central';
    if (code === 'tel_fictif_555') return 'tel_fictif';
    return MSG[code] ? code : 'tel_motif';
  }

  /* ═════════════ COURRIEL ═════════════
     opts.acceptTypo = domaine dont la suggestion a déjà été refusée par la personne (on accepte, +30)
     opts.disposable = fonction(domaine) → true (liste complète côté serveur) */
  function email(raw, opts) {
    opts = opts || {};
    var r = result('courriel'), s = norm(raw).toLowerCase();
    if (!s) { if (opts.optional) return r; add(r, 'courriel_vide', 0, true, 'courriel'); return done(r); }
    r.value = s;
    var at = s.lastIndexOf('@');
    var local = at > 0 ? s.slice(0, at) : '', domain = at > 0 ? s.slice(at + 1) : '';
    r.local = local; r.domain = domain;
    // Syntaxe (RFC 5322 simplifiée, adresses réelles)
    var bad = !local || !domain || s.length > 254 || local.length > 64 || domain.length > 253 || /\s/.test(s) ||
      s.indexOf('@') !== at || /\.\./.test(s) || /^\.|\.$/.test(local) || /^[.-]|[.-]$/.test(domain) ||
      !/^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+$/.test(local) || !/^[a-z0-9.-]+\.[a-z]{2,24}$/.test(domain);
    if (/^\[?\d{1,3}(\.\d{1,3}){3}\]?$/.test(domain)) { add(r, 'courriel_ip', 50, true, 'courriel'); return done(r); }
    if (bad) { add(r, 'courriel_format', 50, true, 'courriel'); return done(r); }
    var tld = domain.slice(domain.lastIndexOf('.') + 1), base = domain.slice(0, domain.lastIndexOf('.'));
    if (BAD_TLD.test(tld) || /^(example|test)\.(com|org|net|ca)$/.test(domain)) { add(r, 'courriel_domaine_reserve', 50, true, 'courriel'); return done(r); }

    // Préfixes bidons : test@gmail.com, test123@, t.e.s.t@, fake_1@
    var core = local.replace(/\+.*$/, '').replace(/[._\-]/g, '');
    var letters = core.replace(/\d+$/, '');
    // Commence par un mot bidon suivi d'un séparateur ou de chiffres : test.jean@, test_1@, fake-email@, asdf123@
    // (« testard.paul@ » reste accepté : un vrai nom de famille)
    var startsFake = /^(test|tests|testing|fake|faux|asdf|qwer|azer|zxcv|spam|junk|trash|temp|dummy|sample|example|exemple|nobody|noreply|no-reply|donotreply)([._\-+0-9]|$)/.test(local);
    if (startsFake || FAKE_LOCAL_SET[core] || FAKE_LOCAL_SET[letters] || FAKE_LOCAL_RX.test(core) || /^(.)\1{3,}$/.test(core) ||
        /^(test|fake|asdf|qwerty|azerty)+\d*$/.test(core)) {
      add(r, 'courriel_prefixe_test', 50, true, 'courriel', { e: s });
    }
    // Domaine jetable
    var disp = DISPOSABLE_SET[domain] || (opts.disposable && opts.disposable(domain));
    if (!disp) { var parts = domain.split('.'); for (var i = 1; i < parts.length - 1; i++) if (DISPOSABLE_SET[parts.slice(i).join('.')]) disp = true; }
    if (disp) add(r, 'courriel_jetable', 50, true, 'courriel');
    // Fautes de frappe : gmai.com, gmial.com, hotmail.con, yahoo.cm …
    if (!KNOWN_SET[domain] && !disp) {
      var sug = null;
      if (TYPO_TLD[tld] && KNOWN_SET[base + '.' + TYPO_TLD[tld]]) sug = base + '.' + TYPO_TLD[tld];
      if (!sug) {
        var best = 3;
        KNOWN_DOMAINS.forEach(function (k) {
          var dist = lev(domain, k), max = k.length >= 9 ? 2 : 1;
          if (dist > 0 && dist <= max && dist < best) { best = dist; sug = k; }
        });
      }
      if (sug) {
        r.suggestion = local + '@' + sug;
        if (opts.acceptTypo === domain) add(r, 'courriel_typo_maintenu', 30);
        else add(r, 'courriel_typo', 30, true, 'courriel', { s: local + '@' + sug });
      }
    }
    // Terminaison inhabituelle (.xyz, .top, .ru…) : refusée, sauf si une suggestion de faute vient d'être faite
    if (!r.suggestion && !disp && !OK_TLD.test(tld)) add(r, 'courriel_suspect', 50, true, 'courriel');
    // Signaux de charabia (points seulement : un vrai courriel peut être bizarre)
    var alpha = core.replace(/[^a-z]/g, '');
    if (WALKS.test(core)) add(r, 'courriel_clavier', 20);
    if (alpha.length >= 5) {
      var vr = vowelRatio(alpha);
      if (vr < 0.2 || vr > 0.8) add(r, 'courriel_voyelles', 30);
      else if (consonantRun(alpha, 5)) add(r, 'courriel_consonnes', 30);
    } else if (alpha.length >= 4 && !(alpha.match(VOWELS) || []).length && !/\d/.test(core)) add(r, 'courriel_voyelles', 30);
    if (/([a-z]\d){3,}/.test(core)) add(r, 'courriel_aleatoire', 20);
    if (ROLE_SET[core] || ROLE_SET[letters]) add(r, 'courriel_role', 20);
    return done(r);
  }

  /* ═════════════ NOM ═════════════ */
  function name(raw, opts) {
    opts = opts || {};
    var field = opts.field || 'prenom', r = result(field), s = norm(raw);
    if (!s) { if (opts.optional) return r; add(r, 'nom_vide', 0, true, field); return done(r); }
    var low = s.toLowerCase().replace(/\s+/g, ' ');
    if (/@/.test(s)) add(r, 'nom_courriel', 30, true, field);
    else if (/\d/.test(s)) add(r, 'nom_chiffres', 20, true, field);
    else if (FAKE_NAME_SET[low] || FAKE_NAME_SET[strip(low)]) add(r, 'nom_test', 30, true, field);
    else if (s.length > 60 || /[<>{}\[\]\\\/=_|#$%^*~`"]/.test(s) || /https?:|www\./i.test(s)) add(r, 'nom_format', 20, true, field);
    else if (/([a-zà-ÿ])\1{2,}/i.test(s)) add(r, 'nom_repete', 20, true, field);
    else if (WALKS.test(strip(low).replace(/[\s'-]/g, ''))) add(r, 'nom_clavier', 20, true, field);
    else {
      var words = low.split(/[\s'-]+/).filter(Boolean);
      words.forEach(function (w) {
        if (w.length >= 4 && !(w.match(VOWELS) || []).length && r.reasons.indexOf('nom_charabia') < 0) add(r, 'nom_charabia', 20, true, field);
      });
      if (!r.block) {
        var letters = low.replace(/[^a-zà-ÿ]/g, '');
        if (letters.length >= 5 && (vowelRatio(letters) < 0.2 || vowelRatio(letters) > 0.85)) add(r, 'nom_voyelles', 20);
        else if (consonantRun(letters, 5)) add(r, 'nom_consonnes', 15);
      }
    }
    if (r.block) r.block.code = r.block.code === 'nom_courriel' || r.block.code === 'nom_chiffres' ? r.block.code : (r.block.code === 'nom_test' ? 'nom_test' : 'nom_format');
    return done(r);
  }

  /* ═════════════ MESSAGE ═════════════ */
  function message(raw) {
    var r = result('message'), s = norm(raw);
    if (!s) return r;
    if (MSG_FAKE.test(s) && s.length < 80) add(r, 'message_test', 10, true, 'message');
    else if (MSG_FAKE.test(s)) add(r, 'message_test', 10);
    if (s.length < 10) add(r, 'message_court', 0);
    if (MSG_SPAM.test(s)) add(r, 'message_spam', 20);
    if ((s.match(/https?:\/\//g) || []).length >= 2) add(r, 'message_liens', 20);
    var letters = s.replace(/[^a-zà-ÿ]/gi, '');
    if (letters.length >= 12 && vowelRatio(letters) < 0.15) add(r, 'message_charabia', 20, true, 'message');
    if (letters.length >= 20 && s === s.toUpperCase()) add(r, 'message_majuscules', 5);
    return done(r);
  }

  /* ═════════════ COMPORTEMENT ═════════════
     b = { hp: valeur du pot de miel, elapsed_ms, focus, keys, pastes, fields } */
  function behavior(b) {
    var r = result(null);
    b = b || {};
    if (b.hp) { add(r, 'pot_de_miel', 100); r.silent = true; return done(r); }
    if (typeof b.elapsed_ms === 'number') {
      // Moins de 3 s depuis l'ouverture de la page : aucun humain ne lit et remplit aussi vite. On bloque
      // avec un message neutre ; une vraie personne n'a qu'à renvoyer (le délai sera alors dépassé).
      if (b.elapsed_ms < 3000) add(r, 'envoi_moins_3s', 30, true, null);
      else if (b.elapsed_ms > 30 * 60 * 1000) add(r, 'formulaire_ouvert_30min', 0);
    }
    if (b.fields && !b.focus && !b.keys) add(r, 'aucune_interaction', 10);
    else if (b.fields && b.pastes >= b.fields && !b.keys) add(r, 'tout_colle', 10);
    return done(r);
  }

  /* ═════════════ ÉVALUATION COMPLÈTE ═════════════
     lead = { prenom, nom, courriel, telephone, message, hp, elapsed_ms, signals, phoneOptional, nomOptional,
              emailOptional, acceptTypo }
     → { score, action, reasons, blocks[], phone, email } */
  function assess(lead, opts) {
    lead = lead || {}; opts = opts || {};
    var parts = [], blocks = [];
    var bh = behavior({ hp: lead.hp, elapsed_ms: lead.elapsed_ms, focus: lead.signals && lead.signals.focus,
      keys: lead.signals && lead.signals.keys, pastes: lead.signals && lead.signals.pastes, fields: lead.signals && lead.signals.fields });
    if (bh.silent) return { score: 100, action: 'SILENT', reasons: bh.reasons, blocks: [], phone: null, email: null };
    var p = lead.telephone !== undefined || !lead.phoneOptional ? phone(lead.telephone, { optional: lead.phoneOptional }) : result('telephone');
    var e = email(lead.courriel, { optional: lead.emailOptional, acceptTypo: lead.acceptTypo, disposable: opts.disposable });
    var n1 = lead.prenom !== undefined ? name(lead.prenom, { field: 'prenom', optional: lead.prenomOptional }) : result('prenom');
    var n2 = lead.nom ? name(lead.nom, { field: 'nom', optional: true }) : result('nom');
    var m = message(lead.message);
    parts.push(n1, n2, e, p, m, bh);
    var score = 0, reasons = [];
    parts.forEach(function (x) {
      score += x.score; reasons = reasons.concat(x.reasons);
      if (x.block) blocks.push(x.block);
    });
    // Combo : faux numéro + faux courriel (444 + test@gmail.com)
    if (p.block && e.block) { score += 20; reasons.push('combo_tel_courriel'); }
    return { score: Math.min(100, score), action: action(score, blocks.length > 0), reasons: reasons, blocks: blocks, phone: p, email: e };
  }
  function action(score, blocked) {
    if (blocked || score >= 70) return 'FAKE';
    if (score >= 30) return 'SUSPICIOUS';
    return 'CLEAN';
  }
  // Message à afficher pour un blocage
  function blockMessage(block, lang) {
    if (!block) return '';
    var code = block.field === 'telephone' ? phoneMsgCode(block.code) : block.code;
    if (code === 'courriel_prefixe_test') code = 'courriel_test';
    if (code === 'envoi_moins_3s') code = 'trop_rapide';
    if (code === 'courriel_ip' || code === 'courriel_domaine_reserve') code = 'courriel_format';
    if (/^nom_/.test(code) && !MSG[code]) code = 'nom_format';
    if (/^message_/.test(code) && !MSG[code]) code = 'message_test';
    return msg(code, lang, block.vars);
  }

  /* ═════════════ NAVIGATEUR : pot de miel + signaux ═════════════
     LeadGuard.watch(form) ajoute un champ caché « website » (pot de miel) et mesure le temps de
     remplissage, les focus, les frappes et les collages. → { signals(), hp(), reset() } */
  var pageStart = Date.now();
  function watch(form) {
    if (!form || typeof document === 'undefined') return null;
    if (form.__lg) return form.__lg;
    var hpName = 'website';
    var hp = form.querySelector('input[name="' + hpName + '"]');
    if (!hp) {
      var wrap = document.createElement('div');
      wrap.setAttribute('aria-hidden', 'true');
      wrap.style.cssText = 'position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden';
      wrap.innerHTML = '<label>Site web<input type="text" name="' + hpName + '" tabindex="-1" autocomplete="off"></label>';
      form.appendChild(wrap);
      hp = wrap.querySelector('input');
    }
    var s = { start: pageStart, first: 0, focus: 0, keys: 0, pastes: 0 };
    form.addEventListener('focusin', function (e) { if (e.target.name === hpName) return; s.focus++; if (!s.first) s.first = Date.now(); });
    form.addEventListener('keydown', function () { s.keys++; });
    form.addEventListener('paste', function () { s.pastes++; });
    var api = {
      hp: function () { return hp.value; },
      signals: function () {
        var fields = form.querySelectorAll('input[type=text],input[type=email],input[type=tel],textarea').length - 1;
        return { elapsed_ms: Date.now() - s.start, fill_ms: s.first ? Date.now() - s.first : 0, focus: s.focus, keys: s.keys, pastes: s.pastes, fields: Math.max(0, fields) };
      },
      reset: function () { s.start = Date.now(); s.first = 0; s.focus = 0; s.keys = 0; s.pastes = 0; }
    };
    form.__lg = api;
    return api;
  }

  return {
    version: '2.0.0',
    phone: phone, email: email, name: name, message: message, behavior: behavior,
    assess: assess, action: action, msg: msg, blockMessage: blockMessage, watch: watch,
    CA_AREA: CA_AREA, AREA_PROV: AREA_PROV, DISPOSABLE: DISPOSABLE, KNOWN_DOMAINS: KNOWN_DOMAINS
  };
});
