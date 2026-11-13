/* ==========================================================================
   Apps Script « Leads W Héritage » : réception des leads + système anti-faux leads + relances
   À coller dans le projet Apps Script relié à la feuille (Extensions > Apps Script).
   Ce fichier n'est pas déployé sur le site (tools/ est exclu par .vercelignore).

   INSTALLATION (une fois)
   1. Coller CE fichier sous le code existant (remplace l'ancienne version de appendDiagnostic_).
   2. Créer un 2e fichier « LeadGuard.gs » et y coller TEL QUEL le contenu de assets/lead-guard.js
      (mêmes règles que le site : le script revérifie chaque lead, un robot qui écrit directement ici est filtré).
   3. Dans doPost, APRÈS la vérification du TOKEN et le JSON.parse existants, remplacer l'ancienne ligne
      « if (data.source === 'diagnostic' ...) » par :

        var routed = routeLead_(data); if (routed) return routed;

      (« data » = le nom de la variable qui contient le JSON reçu dans le script actuel.)
      routeLead_ traite diagnostic, diagnostic_particulier, contact et guide_accueil ; pour « guide »
      (/strategie-societe) il ajoute la ligne au pipeline « Leads » puis laisse le code existant continuer.
   4. Paramètres du projet (roue dentée) > Propriétés du script :
        LEAD_PROOF_SECRET = la même valeur que dans Vercel (vérifie les preuves signées du serveur)
        NOTIF_EMAIL       = adresse des rapports (défaut : walid.harchaoui@agc.ia.ca)
        CALENDRIER        = nom de l'agenda des rappels (défaut : « Callbacks », créé au besoin)
        RAPPEL_PROSPECT   = 1 pour écrire au prospect qui n'a pas confirmé son numéro (défaut : 0)
   5. Exécuter une fois installTriggers() (menu Exécuter), accepter les autorisations Agenda + Gmail.
   6. Déployer > Gérer les déploiements > crayon > Version : « Nouvelle version » > Déployer.
      Garder le MÊME déploiement : l'URL /exec ne change pas, site.js n'a rien à modifier.

   ONGLETS (créés au premier lead, avec leurs en-têtes)
   « Diagnostic » / « Diagnostic particuliers » : archive complète, une ligne par lead (mise à jour par lead_id).
   « Leads »       : pipeline de suivi (Business OS) : statut, dernier contact, prochaine action, rappel, vérification.
   « Quarantaine » : faux probables et numéros jamais confirmés. Rien n'y crée de rappel.
   « Blocklist »   : courriels / téléphones refusés automatiquement ensuite (ajoutez-en à la main au besoin).
   Loi 25 : aucun code SMS n'est stocké (seulement vérifié oui/non + date) ; l'IP est effacée après 30 jours.
   ========================================================================== */

var CFG_ = (function () {
  var p = PropertiesService.getScriptProperties();
  return {
    secret: p.getProperty('LEAD_PROOF_SECRET') || '',
    email: p.getProperty('NOTIF_EMAIL') || 'walid.harchaoui@agc.ia.ca',
    calendrier: p.getProperty('CALENDRIER') || 'Callbacks',
    rappelProspect: p.getProperty('RAPPEL_PROSPECT') === '1',
    tz: 'America/Toronto'
  };
})();

var DIAG_COLUMNS = [
  'date', 'prenom', 'nom', 'courriel', 'telephone',
  'qualifie', 'enjeu_principal', 'niveau_revenu', 'niveau_succession', 'niveau_liquidites',
  'micro_oui', 'incorpore', 'province', 'secteur', 'role', 'surplus', 'placements', 'dependants',
  'projet', 'besoin_5ans', 'assurance_societe', 'preoccupation',
  'consentement_diagnostic_date', 'consentement_diagnostic_version', 'consentement_diagnostic_texte',
  'consentement_marketing_date', 'consentement_marketing_version', 'consentement_marketing_texte',
  'niche', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid', 'langue', 'recu_le'
];
var DIAG_COLUMNS_PARTICULIER = [
  'date', 'prenom', 'nom', 'courriel', 'telephone',
  'qualifie', 'enjeu_principal', 'niveau_protection_revenu', 'niveau_famille', 'niveau_patrimoine',
  'micro_oui', 'age', 'province', 'famille', 'emploi', 'dettes', 'invalidite', 'assurance_vie',
  'epargne', 'comptes', 'heritage', 'preoccupation',
  'consentement_diagnostic_date', 'consentement_diagnostic_version', 'consentement_diagnostic_texte',
  'consentement_marketing_date', 'consentement_marketing_version', 'consentement_marketing_texte',
  'niche', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid', 'langue', 'recu_le'
];
// Colonnes ajoutées à la fin des onglets Diagnostic (anti-faux leads). Ajoutées automatiquement si absentes.
var RISK_COLUMNS = ['lead_id', 'risque_score', 'risque_action', 'risque_raisons', 'preuve_valide', 'otp_statut', 'otp_verifie_le',
  'operateur', 'type_ligne', 'consentement_sms_date', 'consentement_sms_version', 'consentement_sms_texte', 'ip', 'pays_ip', 'mis_a_jour_le'];

var LEADS_COLUMNS = ['Nom', 'Téléphone', 'Courriel', 'Source', 'Besoin', 'Date entrée', 'Dernier contact', 'Statut', 'Priorité',
  'Prochaine action', 'Heure rappel', 'OTP vérifié', 'OTP horodatage', 'Opérateur', 'Type de ligne', 'Risque', 'Raisons', 'Lead ID',
  'Rappel créé', 'Activité', 'IP', 'Taille client', 'Date gagné', 'Actifs ramenés ($)', 'Dernière revue', 'Prochaine revue semestrielle'];
// Objectifs 2026 (business-os/MEMORY.md) : utilisés par le rapport du vendredi et le rappel mensuel des revues
var CIBLES = { appelsSemaine: 20, nouveauxClientsMois: 10 };
var TAILLES = ['Gros', 'Moyen', 'Petit'];
var JOURNAL_COLUMNS = ['Date', 'Nom', 'Téléphone', 'Statut au moment de l\'appel', 'Client ?', 'Lead ID'];
var QUAR_COLUMNS = LEADS_COLUMNS.concat(['Raison quarantaine', 'Mis en quarantaine le']);
var BLOCK_COLUMNS = ['Type', 'Valeur', 'Raison', 'Ajouté le'];
var STATUTS = ['Nouveau', 'En attente vérif', 'À vérifier', 'Contacté', 'Découverte', 'Proposition', 'Fermé', 'Gagné', 'Perdu'];
var FERMES = { 'Fermé': 1, 'Gagné': 1, 'Perdu': 1 };

/* ═════════════ ROUTAGE (appelé par doPost) ═════════════ */
function routeLead_(d) {
  var src = d && d.source;
  if (!src) return null;
  var known = { diagnostic: 1, diagnostic_particulier: 1, contact: 1, guide_accueil: 1, guide: 1 };
  if (!known[src]) return null;
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var verdict = judge_(d);
    if (verdict.silent) return ok_();
    if (src === 'diagnostic' || src === 'diagnostic_particulier') appendDiagnostic_(d, verdict);
    pipeline_(d, verdict);
  } finally {
    lock.releaseLock();
  }
  return src === 'guide' ? null : ok_();
}
function ok_() { return ContentService.createTextOutput('ok'); }

/* ═════════════ JUGEMENT : revérifie tout côté feuille ═════════════
   → { score, action, reasons, otp ('verifie'|'en_attente'|'non_verifie'|'indisponible'|'non_requis'), preuve, quarantaine, silent } */
function judge_(d) {
  var v = { score: Number(d.risque_score) || 0, action: d.risque_action || '', reasons: String(d.risque_raisons || '').split(' ').filter(String),
    otp: d.otp_statut || 'non_requis', preuve: 'non configurée', quarantaine: '', silent: false };
  if (d.website || d.hp) { v.silent = true; return v; } // pot de miel

  // 1. Mêmes règles que le site (si LeadGuard.gs est présent)
  if (typeof LeadGuard !== 'undefined') {
    var a = LeadGuard.assess({ prenom: d.prenom, nom: d.nom, courriel: d.courriel, telephone: d.telephone || undefined,
      phoneOptional: !d.telephone, prenomOptional: !d.prenom, acceptTypo: (String(d.courriel || '').split('@')[1] || '') });
    a.reasons.forEach(function (r) { if (v.reasons.indexOf(r) < 0) v.reasons.push(r); });
    if (a.blocks.length) { v.score = Math.max(v.score, 100); v.quarantaine = 'règle ' + a.blocks[0].code; }
    else v.score = Math.max(v.score, a.score);
  }
  // 2. Liste de blocage
  var bl = blocklisted_(d.courriel, d.telephone);
  if (bl) { v.score = 100; v.quarantaine = 'blocklist : ' + bl; }

  // 3. Preuves signées (score serveur et vérification SMS)
  if (CFG_.secret) {
    var pr = d.preuve_risque ? proof_(d.preuve_risque) : null;
    var po = d.preuve_otp ? proof_(d.preuve_otp) : null;
    var telE = e164_(d.telephone);
    if (v.otp === 'verifie') {
      var good = po && po.otp === 'verifie' && po.tel === telE && (!d.lead_id || po.id === d.lead_id) && Date.now() - po.t < 6 * 3600 * 1000;
      v.preuve = good ? 'oui' : 'NON (vérification SMS non prouvée)';
      if (!good) { v.otp = 'non_verifie'; v.score += 30; v.reasons.push('preuve_otp_invalide'); }
    } else if (pr) {
      v.preuve = pr.tel === telE || !telE ? 'oui' : 'NON';
      if (pr.score > v.score) v.score = pr.score;
    } else if (d.risque_score !== undefined && d.risque_score !== '') {
      v.preuve = 'absente'; v.score += 10; v.reasons.push('sans_preuve_serveur');
    }
  }
  // 4. Vitesse : même courriel ou téléphone plus de 2 fois par heure (mises à jour du même lead exclues)
  var c = CacheService.getScriptCache();
  [d.courriel && 'em:' + String(d.courriel).toLowerCase(), d.telephone && 'tel:' + e164_(d.telephone)].filter(String).forEach(function (k) {
    var seen = JSON.parse(c.get(k) || '[]');
    var id = d.lead_id || String(Math.random());
    if (seen.indexOf(id) < 0) seen.push(id);
    c.put(k, JSON.stringify(seen), 3600);
    if (seen.length > 2 && v.reasons.indexOf('limite_debit_feuille') < 0) { v.score += 20; v.reasons.push('limite_debit_feuille'); }
  });
  v.score = Math.min(100, v.score);
  v.action = v.score >= 70 ? 'FAKE' : v.score >= 30 ? 'SUSPICIOUS' : 'CLEAN';
  if (!v.quarantaine && v.action === 'FAKE') v.quarantaine = 'pointage ' + v.score + '/100';
  return v;
}

/* ═════════════ ARCHIVE DIAGNOSTIC (mise à jour par lead_id) ═════════════ */
function appendDiagnostic_(d, v) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var perso = d.source === 'diagnostic_particulier';
  var name = perso ? 'Diagnostic particuliers' : 'Diagnostic';
  var cols = (perso ? DIAG_COLUMNS_PARTICULIER : DIAG_COLUMNS).concat(RISK_COLUMNS);
  var sh = sheet_(name, cols);
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  // Anciennes feuilles : ajouter les colonnes manquantes à la fin
  cols.forEach(function (k) { if (head.indexOf(k) < 0) { sh.getRange(1, head.length + 1).setValue(k); head.push(k); } });

  var niv = d.niveaux || {}, c1 = d.consentement_diagnostic || {}, c2 = d.consentement_marketing || {}, cs = d.consentement_sms || {};
  var flat = {
    niveau_revenu: niv.revenu, niveau_succession: niv.succession, niveau_liquidites: niv.liquidites,
    niveau_protection_revenu: niv.protection_revenu, niveau_famille: niv.famille, niveau_patrimoine: niv.patrimoine,
    consentement_diagnostic_date: c1.date, consentement_diagnostic_version: c1.version, consentement_diagnostic_texte: c1.texte,
    consentement_marketing_date: c2.date || '', consentement_marketing_version: c2.version || '', consentement_marketing_texte: c2.texte || '',
    consentement_sms_date: cs.date || '', consentement_sms_version: cs.version || '', consentement_sms_texte: cs.texte || '',
    risque_score: v.score, risque_action: v.action, risque_raisons: v.reasons.join(' '), preuve_valide: v.preuve, otp_statut: v.otp,
    recu_le: new Date().toISOString(), mis_a_jour_le: new Date().toISOString()
  };
  var row = head.map(function (k) { return cell_(k in flat ? flat[k] : d[k]); });
  var r = d.lead_id ? findRow_(sh, head.indexOf('lead_id') + 1, d.lead_id) : 0;
  if (r) {
    // Mise à jour (ex. « en attente » → « vérifié ») : on garde la date de réception d'origine
    var keep = head.indexOf('recu_le');
    if (keep >= 0) row[keep] = sh.getRange(r, keep + 1).getValue();
    sh.getRange(r, 1, 1, row.length).setValues([row]);
  } else sh.appendRow(row);
}

/* ═════════════ PIPELINE « Leads » / QUARANTAINE ═════════════ */
function pipeline_(d, v) {
  var now = new Date();
  var nom = ((d.prenom || '') + ' ' + (d.nom || '')).trim() || String(d.courriel || '').split('@')[0];
  var besoin = d.enjeu_principal || d.sujet || (d.source === 'guide' || d.source === 'guide_accueil' ? 'Guide' : '');
  var statut = v.otp === 'en_attente' ? 'En attente vérif' : (v.action === 'SUSPICIOUS' || v.otp === 'non_verifie') ? 'À vérifier' : 'Nouveau';
  var hot = !!d.telephone && (v.otp === 'verifie' || (v.action === 'CLEAN' && v.otp !== 'en_attente')) && d.qualifie !== false;
  var rec = {
    'Nom': nom, 'Téléphone': d.telephone || '', 'Courriel': d.courriel || '', 'Source': d.source + (d.utm_source ? ' · ' + d.utm_source : ''),
    'Besoin': besoin, 'Date entrée': now, 'Dernier contact': '', 'Statut': statut, 'Priorité': hot ? 'Hot' : 'Warm',
    'Prochaine action': '', 'Heure rappel': '', 'OTP vérifié': v.otp === 'verifie', 'OTP horodatage': d.otp_verifie_le ? new Date(d.otp_verifie_le) : '',
    'Opérateur': d.operateur || '', 'Type de ligne': d.type_ligne || '', 'Risque': v.score, 'Raisons': v.reasons.join(' '), 'Lead ID': d.lead_id || '',
    'Rappel créé': '', 'Activité': fmt_(now) + ' · ' + d.source, 'IP': d.ip || ''
  };

  // Faux probable : quarantaine (+ blocklist si certain), jamais de rappel
  if (v.quarantaine) {
    removeFromLeads_(d.lead_id);
    rec['Statut'] = 'Quarantaine';
    quarantine_(rec, v.quarantaine);
    if (v.score >= 100 && !/^blocklist/.test(v.quarantaine)) {
      if (d.courriel && v.reasons.some(function (r) { return /^courriel_/.test(r); })) block_('courriel', d.courriel, v.quarantaine);
      if (d.telephone && v.reasons.some(function (r) { return /^tel_/.test(r); })) block_('telephone', e164_(d.telephone), v.quarantaine);
    }
    return;
  }

  // Vérifié après être passé en quarantaine (code entré après 5 min) : il en sort
  if (v.otp === 'verifie') removeRow_('Quarantaine', d.lead_id);
  var sh = sheet_('Leads', LEADS_COLUMNS);
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  // Même lead mis à jour (vérification SMS) : on met à jour la ligne
  var r = d.lead_id ? findRow_(sh, head.indexOf('Lead ID') + 1, d.lead_id) : 0;
  if (!r) {
    // Doublon sur 30 jours (même courriel ou téléphone) : on ajoute l'activité au lead existant, pas de nouvelle ligne
    var dup = findDuplicate_(sh, head, d.courriel, d.telephone, 30);
    if (dup) {
      var act = head.indexOf('Activité') + 1;
      sh.getRange(dup, act).setValue(String(sh.getRange(dup, act).getValue()) + '\n' + fmt_(now) + ' · à nouveau via ' + d.source + (besoin ? ' (' + besoin + ')' : ''));
      if (v.otp === 'verifie') { sh.getRange(dup, head.indexOf('OTP vérifié') + 1).setValue(true); sh.getRange(dup, head.indexOf('OTP horodatage') + 1).setValue(rec['OTP horodatage']); }
      return;
    }
  }
  if (r) {
    var cur = sh.getRange(r, 1, 1, head.length).getValues()[0];
    rec['Date entrée'] = cur[head.indexOf('Date entrée')] || now;
    rec['Activité'] = String(cur[head.indexOf('Activité')] || '') + '\n' + fmt_(now) + ' · ' + (v.otp === 'verifie' ? 'numéro vérifié par code' : 'mise à jour (' + v.otp + ')');
    rec['Rappel créé'] = cur[head.indexOf('Rappel créé')] || '';
    sh.getRange(r, 1, 1, head.length).setValues([head.map(function (k) { return k in rec ? rec[k] : ''; })]);
  } else {
    sh.appendRow(head.map(function (k) { return k in rec ? rec[k] : ''; }));
    r = sh.getLastRow();
  }
  colorRow_(sh, r, statut);
  // Rappel dans l'agenda : seulement pour un lead vérifié (ou propre quand la vérification SMS n'est pas active)
  if (d.telephone && !rec['Rappel créé'] && (v.otp === 'verifie' || (v.otp !== 'en_attente' && v.otp !== 'non_verifie' && v.action === 'CLEAN'))) {
    var when = callbackSlot_(new Date(now.getTime() + (hot ? 2 : 24) * 3600 * 1000));
    var ev = callbackEvent_('CALLBACK: ' + nom + (v.otp === 'verifie' ? ' - VÉRIFIÉ' : ''), when, rec, d);
    if (ev) {
      sh.getRange(r, head.indexOf('Rappel créé') + 1).setValue(fmt_(when));
      sh.getRange(r, head.indexOf('Heure rappel') + 1).setValue(when);
      sh.getRange(r, head.indexOf('Prochaine action') + 1).setValue('Rappeler (' + (hot ? 'Hot, 2 h' : 'Warm, 24 h') + ')');
    }
  }
}

/* ═════════════ DÉCLENCHEURS ═════════════ */
function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['quarantinePending', 'callbackCheck', 'followUpPlan', 'rapportQuotidien', 'rapportHebdo', 'anonymiserIp', 'onEditLeads', 'revuesDuMois'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('quarantinePending').timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger('callbackCheck').timeBased().atHour(9).everyDays(1).inTimezone(CFG_.tz).create();
  ScriptApp.newTrigger('followUpPlan').timeBased().atHour(16).nearMinute(30).everyDays(1).inTimezone(CFG_.tz).create();
  ScriptApp.newTrigger('rapportQuotidien').timeBased().atHour(18).everyDays(1).inTimezone(CFG_.tz).create();
  ScriptApp.newTrigger('rapportHebdo').timeBased().onWeekDay(ScriptApp.WeekDay.FRIDAY).atHour(15).inTimezone(CFG_.tz).create();
  ScriptApp.newTrigger('anonymiserIp').timeBased().atHour(3).everyDays(1).inTimezone(CFG_.tz).create();
  ScriptApp.newTrigger('onEditLeads').forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet()).onEdit().create();
  ScriptApp.newTrigger('revuesDuMois').timeBased().onMonthDay(1).atHour(8).inTimezone(CFG_.tz).create();
  sheet_('Leads', LEADS_COLUMNS); sheet_('Quarantaine', QUAR_COLUMNS); sheet_('Blocklist', BLOCK_COLUMNS); sheet_('Journal appels', JOURNAL_COLUMNS);
  calendar_();
}

/* Toutes les 5 min : un lead « En attente vérif » depuis plus de 5 minutes passe en quarantaine.
   Un numéro inventé (444…) ne reçoit jamais le code : il n'atteint donc jamais l'agenda. */
function quarantinePending() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  if (!sh || sh.getLastRow() < 2) return;
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    var data = sh.getDataRange().getValues(), head = data[0], now = Date.now();
    var iS = head.indexOf('Statut'), iD = head.indexOf('Date entrée');
    for (var r = data.length - 1; r >= 1; r--) {
      if (data[r][iS] !== 'En attente vérif') continue;
      var t = data[r][iD] instanceof Date ? data[r][iD].getTime() : Date.parse(data[r][iD]);
      if (!t || now - t < 5 * 60 * 1000) continue;
      var rec = {}; head.forEach(function (k, i) { rec[k] = data[r][i]; });
      rec['Statut'] = 'Quarantaine';
      quarantine_(rec, 'numéro non confirmé après 5 min');
      sh.deleteRow(r + 1);
      if (CFG_.rappelProspect && rec['Courriel']) remindProspect_(rec);
    }
  } finally { lock.releaseLock(); }
}

/* 9 h : leads ouverts sans contact depuis 3 jours (ou jamais contactés après 24 h) → rappel à 10 h le prochain
   jour ouvrable, avec un script d'appel. Retard de plus de 7 jours : ligne en rouge. */
function callbackCheck() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  if (!sh || sh.getLastRow() < 2) return;
  var data = sh.getDataRange().getValues(), head = data[0], now = new Date(), day = 86400000;
  var I = function (k) { return head.indexOf(k); };
  for (var r = 1; r < data.length; r++) {
    var row = data[r], statut = row[I('Statut')];
    if (FERMES[statut] || statut === 'En attente vérif' || statut === 'Quarantaine') continue;
    var last = row[I('Dernier contact')] || row[I('Date entrée')];
    var lastT = last instanceof Date ? last.getTime() : Date.parse(last);
    if (!lastT) continue;
    var age = (now.getTime() - lastT) / day;
    var threshold = row[I('Dernier contact')] ? 3 : 1;
    if (age < threshold) continue;
    var next = row[I('Heure rappel')];
    var nextT = next instanceof Date ? next.getTime() : 0;
    if (nextT > now.getTime()) continue; // un rappel est déjà prévu
    var when = nextBusinessDayAt_(now, 10, 0);
    var rec = {}; head.forEach(function (k, i) { rec[k] = row[i]; });
    var reason = row[I('Dernier contact')] ? 'aucun contact depuis ' + Math.floor(age) + ' j' : 'jamais rappelé';
    if (callbackEvent_('CALLBACK: ' + rec['Nom'] + ' - ' + reason, when, rec, null)) {
      sh.getRange(r + 1, I('Heure rappel') + 1).setValue(when);
      sh.getRange(r + 1, I('Prochaine action') + 1).setValue('Rappeler : ' + reason);
    }
    if (age > 7) sh.getRange(r + 1, 1, 1, head.length).setBackground('#f4cccc');
  }
}

/* 16 h 30 : leads contactés aujourd'hui → prochaine relance dans 3 jours ouvrables. */
function followUpPlan() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  if (!sh || sh.getLastRow() < 2) return;
  var data = sh.getDataRange().getValues(), head = data[0], today = fmtDay_(new Date());
  var iC = head.indexOf('Dernier contact'), iN = head.indexOf('Prochaine action'), iH = head.indexOf('Heure rappel'), iS = head.indexOf('Statut');
  for (var r = 1; r < data.length; r++) {
    if (!(data[r][iC] instanceof Date) || fmtDay_(data[r][iC]) !== today || FERMES[data[r][iS]]) continue;
    var when = new Date(); for (var n = 0; n < 3;) { when = nextBusinessDayAt_(when, 10, 0); n++; }
    sh.getRange(r + 1, iH + 1).setValue(when);
    sh.getRange(r + 1, iN + 1).setValue('Relance ' + fmtDay_(when));
  }
}

/* 18 h : rapport du jour par courriel (nouveaux leads, quarantaine avec raisons, rappels en retard). */
function rapportQuotidien() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), today = fmtDay_(new Date()), L = [];
  var leads = rows_(ss.getSheetByName('Leads')), quar = rows_(ss.getSheetByName('Quarantaine'));
  var newToday = leads.filter(function (x) { return x['Date entrée'] instanceof Date && fmtDay_(x['Date entrée']) === today; });
  var qToday = quar.filter(function (x) { return x['Mis en quarantaine le'] instanceof Date && fmtDay_(x['Mis en quarantaine le']) === today; });
  var late = leads.filter(function (x) { var h = x['Heure rappel']; return !FERMES[x['Statut']] && h instanceof Date && h.getTime() < Date.now() - 86400000; });
  L.push('LEADS DU ' + today + ' : ' + newToday.length + ' (' + newToday.filter(function (x) { return x['OTP vérifié'] === true; }).length + ' vérifiés par code)');
  newToday.forEach(function (x) { L.push('• ' + x['Nom'] + ' · ' + x['Téléphone'] + ' · ' + x['Besoin'] + ' · ' + x['Statut'] + (x['OTP vérifié'] === true ? ' · ✓ vérifié' : '') + ' · risque ' + x['Risque']); });
  L.push(''); L.push('QUARANTAINE AUJOURD\'HUI : ' + qToday.length);
  qToday.forEach(function (x) { L.push('• ' + x['Nom'] + ' · ' + x['Téléphone'] + ' · ' + x['Courriel'] + ' → ' + x['Raison quarantaine']); });
  L.push(''); L.push('RAPPELS EN RETARD : ' + late.length);
  late.forEach(function (x) { L.push('• ' + x['Nom'] + ' · ' + x['Téléphone'] + ' · prévu ' + fmt_(x['Heure rappel'])); });
  L.push(''); L.push('Feuille : ' + ss.getUrl());
  if (!newToday.length && !qToday.length && !late.length) return;
  MailApp.sendEmail(CFG_.email, 'W Héritage · rapport leads du ' + today, L.join('\n'));
}

/* ═════════════ OBJECTIFS 2026 : appels, revues semestrielles, placements ═════════════
   Quand vous modifiez l'onglet Leads à la main :
   - « Dernier contact » rempli → une ligne dans « Journal appels » (c'est ce qui compte vos 20 appels / semaine)
   - « Statut » = Gagné → « Date gagné » = aujourd'hui et « Prochaine revue semestrielle » = dans 6 mois (si vides)
   - « Dernière revue » remplie → « Prochaine revue semestrielle » = 6 mois plus tard
   Déclencheur installable (installTriggers), pas un simple onEdit : il peut écrire dans les autres onglets. */
function onEditLeads(e) {
  if (!e || !e.range) return;
  var sh = e.range.getSheet();
  if (sh.getName() !== 'Leads' || e.range.getRow() < 2) return;
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var col = head[e.range.getColumn() - 1], r = e.range.getRow(), I = function (k) { return head.indexOf(k) + 1; };
  var get = function (k) { return I(k) ? sh.getRange(r, I(k)).getValue() : ''; };
  var set = function (k, v) { if (I(k)) sh.getRange(r, I(k)).setValue(v); };
  var today = new Date();
  if (col === 'Dernier contact' && e.value) {
    var j = sheet_('Journal appels', JOURNAL_COLUMNS);
    j.appendRow([get('Dernier contact') || today, get('Nom'), get('Téléphone'), get('Statut'), get('Statut') === 'Gagné' ? 'oui' : 'non', get('Lead ID')]);
    set('Activité', String(get('Activité') || '') + '\n' + fmt_(today) + ' · appel');
  }
  if (col === 'Statut' && e.value === 'Gagné') {
    if (!get('Date gagné')) set('Date gagné', today);
    if (!get('Prochaine revue semestrielle')) set('Prochaine revue semestrielle', addMonths_(today, 6));
  }
  if (col === 'Dernière revue' && get('Dernière revue') instanceof Date) set('Prochaine revue semestrielle', addMonths_(get('Dernière revue'), 6));
}
function addMonths_(d, n) { var x = new Date(d.getTime()); x.setMonth(x.getMonth() + n); return x; }

/* 1er du mois, 8 h : clients dont la revue semestrielle tombe ce mois-ci (ou est en retard), par courriel,
   avec les 3 buts de chaque revue : une vente de plus, leurs placements, des références. */
function revuesDuMois() {
  var leads = rows_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads'));
  var now = new Date(), fin = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  var dues = leads.filter(function (x) { var d = x['Prochaine revue semestrielle']; return x['Statut'] === 'Gagné' && d instanceof Date && d < fin; })
    .sort(function (a, b) { return a['Prochaine revue semestrielle'] - b['Prochaine revue semestrielle']; });
  if (!dues.length) return;
  var L = ['REVUES SEMESTRIELLES À FAIRE EN ' + Utilities.formatDate(now, CFG_.tz, 'MM/yyyy') + ' : ' + dues.length, '',
    'Pour chaque revue : 1) un besoin non couvert (vente) 2) les placements détenus ailleurs (transfert) 3) deux noms (références).', ''];
  dues.forEach(function (x) {
    var d = x['Prochaine revue semestrielle'], late = d < now;
    L.push('• ' + x['Nom'] + ' · ' + x['Téléphone'] + ' · ' + (x['Taille client'] || 'taille ?') + ' · prévue ' + fmtDay_(d) + (late ? ' (EN RETARD)' : ''));
  });
  L.push(''); L.push('Une fois la revue faite, inscrivez la date dans « Dernière revue » : la suivante se planifie seule (6 mois).');
  L.push('Feuille : ' + SpreadsheetApp.getActiveSpreadsheet().getUrl());
  MailApp.sendEmail(CFG_.email, 'W Héritage · ' + dues.length + ' revue(s) semestrielle(s) ce mois-ci', L.join('\n'));
}

/* Vendredi 15 h : tableau de bord des objectifs + leads de la semaine vs semaine précédente (écarts > 10 % signalés). */
function rapportHebdo() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), week = 7 * 86400000, now = Date.now(), today = new Date();
  var leads = rows_(ss.getSheetByName('Leads')), all = leads.concat(rows_(ss.getSheetByName('Quarantaine')));
  var journal = rows_(ss.getSheetByName('Journal appels'));
  var t = function (v) { return v instanceof Date ? v.getTime() : (Date.parse(v) || 0); };
  var lundi = new Date(today.getTime()); lundi.setHours(0, 0, 0, 0); lundi.setDate(lundi.getDate() - ((lundi.getDay() + 6) % 7));
  var mois = new Date(today.getFullYear(), today.getMonth(), 1);
  var L = ['OBJECTIFS · semaine du ' + fmtDay_(lundi), ''];

  // 1. Appels qualifiés (cible 20 / semaine)
  var appels = journal.filter(function (x) { return t(x['Date']) >= lundi.getTime(); });
  var noms = {}; appels.forEach(function (x) { noms[x['Nom'] + '|' + x['Téléphone']] = 1; });
  var nb = Object.keys(noms).length, clientsAppeles = appels.filter(function (x) { return x['Client ?'] === 'oui'; }).length;
  L.push((nb >= CIBLES.appelsSemaine ? '✓ ' : '✗ ') + 'Personnes appelées : ' + nb + ' / ' + CIBLES.appelsSemaine + ' (dont ' + clientsAppeles + ' appels à des clients)');
  var ouverts = leads.filter(function (x) { return !FERMES[x['Statut']] && x['Statut'] !== 'En attente vérif'; }).length;
  L.push('  Pipeline ouvert à appeler : ' + ouverts + (ouverts < CIBLES.appelsSemaine ? '  ⚑ moins que la cible : ajoutez des références et des centres d\'influence (plan de prospection)' : ''));

  // 2. Nouveaux clients du mois (cible 10), par taille
  var gagnes = leads.filter(function (x) { return x['Statut'] === 'Gagné' && t(x['Date gagné']) >= mois.getTime(); });
  var parTaille = {}; gagnes.forEach(function (x) { var k = x['Taille client'] || 'non précisé'; parTaille[k] = (parTaille[k] || 0) + 1; });
  L.push((gagnes.length >= CIBLES.nouveauxClientsMois ? '✓ ' : '· ') + 'Nouveaux clients ce mois-ci : ' + gagnes.length + ' / ' + CIBLES.nouveauxClientsMois +
    (gagnes.length ? ' (' + Object.keys(parTaille).map(function (k) { return k + ' ' + parTaille[k]; }).join(', ') + ')' : ''));

  // 3. Placements ramenés (mois en cours)
  var actifs = leads.filter(function (x) { return t(x['Date gagné']) >= mois.getTime() || t(x['Dernière revue']) >= mois.getTime(); })
    .reduce(function (s, x) { return s + (Number(x['Actifs ramenés ($)']) || 0); }, 0);
  L.push('Placements ramenés ce mois-ci (clients gagnés ou revus ce mois) : ' + actifs.toLocaleString('fr-CA') + ' $');

  // 4. Revues semestrielles
  var enRetard = leads.filter(function (x) { return x['Statut'] === 'Gagné' && x['Prochaine revue semestrielle'] instanceof Date && x['Prochaine revue semestrielle'] < today; }).length;
  var faites = leads.filter(function (x) { return t(x['Dernière revue']) >= lundi.getTime(); }).length;
  L.push('Revues semestrielles : ' + faites + ' faite(s) cette semaine, ' + enRetard + ' en retard');

  // 5. Leads du site : semaine vs semaine précédente
  var inWin = function (x, a, b) { var v = t(x['Date entrée']); return v >= a && v < b; };
  var stats = function (a, b) {
    var w = all.filter(function (x) { return inWin(x, a, b); });
    return { leads: w.length, verifies: w.filter(function (x) { return x['OTP vérifié'] === true; }).length,
      quarantaine: w.filter(function (x) { return x['Statut'] === 'Quarantaine'; }).length, hot: w.filter(function (x) { return x['Priorité'] === 'Hot'; }).length };
  };
  var cur = stats(now - week, now), prev = stats(now - 2 * week, now - week);
  L.push(''); L.push('LEADS ENTRANTS (7 derniers jours vs 7 jours précédents)');
  Object.keys(cur).forEach(function (k) {
    var d = prev[k] ? Math.round((cur[k] - prev[k]) / prev[k] * 100) : (cur[k] ? 100 : 0);
    L.push(k + ' : ' + cur[k] + ' (avant : ' + prev[k] + (Math.abs(d) > 10 ? ', ⚑ ' + (d > 0 ? '+' : '') + d + ' %' : '') + ')');
  });
  L.push(''); L.push('Feuille : ' + ss.getUrl());
  MailApp.sendEmail(CFG_.email, 'W Héritage · objectifs de la semaine : ' + nb + '/' + CIBLES.appelsSemaine + ' appels, ' + gagnes.length + '/' + CIBLES.nouveauxClientsMois + ' clients ce mois', L.join('\n'));
}

/* 3 h : Loi 25, l'adresse IP (preuve du consentement LCAP) est effacée après 30 jours. */
function anonymiserIp() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), limit = Date.now() - 30 * 86400000;
  [['Leads', 'IP', 'Date entrée'], ['Quarantaine', 'IP', 'Date entrée'], ['Diagnostic', 'ip', 'recu_le'], ['Diagnostic particuliers', 'ip', 'recu_le']].forEach(function (s) {
    var sh = ss.getSheetByName(s[0]); if (!sh || sh.getLastRow() < 2) return;
    var data = sh.getDataRange().getValues(), iIp = data[0].indexOf(s[1]), iD = data[0].indexOf(s[2]);
    if (iIp < 0 || iD < 0) return;
    for (var r = 1; r < data.length; r++) {
      var t = data[r][iD] instanceof Date ? data[r][iD].getTime() : Date.parse(data[r][iD]);
      if (data[r][iIp] && t && t < limit) sh.getRange(r + 1, iIp + 1).setValue('');
    }
  });
}

/* ═════════════ OUTILS ═════════════ */
function sheet_(name, cols) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(cols); sh.setFrozenRows(1); sh.getRange(1, 1, 1, cols.length).setFontWeight('bold');
    if (name === 'Leads') leadsFormat_(sh, cols);
  } else {
    // Feuille existante : ajouter à la fin les colonnes qui manquent (ex. suivi des placements et des revues)
    var head = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0], added = false;
    cols.forEach(function (k) { if (head.indexOf(k) < 0) { head.push(k); sh.getRange(1, head.length).setValue(k).setFontWeight('bold'); added = true; } });
    if (added && name === 'Leads') leadsFormat_(sh, head);
  }
  return sh;
}
function leadsFormat_(sh, cols) {
  var list = function (vals) { return SpreadsheetApp.newDataValidation().requireValueInList(vals, true).setAllowInvalid(false).build(); };
  sh.getRange(2, cols.indexOf('Statut') + 1, 999, 1).setDataValidation(list(STATUTS));
  sh.getRange(2, cols.indexOf('OTP vérifié') + 1, 999, 1).insertCheckboxes();
  if (cols.indexOf('Taille client') >= 0) sh.getRange(2, cols.indexOf('Taille client') + 1, 999, 1).setDataValidation(list(TAILLES));
  ['Date gagné', 'Dernière revue', 'Prochaine revue semestrielle'].forEach(function (k) {
    if (cols.indexOf(k) >= 0) sh.getRange(2, cols.indexOf(k) + 1, 999, 1).setNumberFormat('yyyy-mm-dd');
  });
  if (cols.indexOf('Actifs ramenés ($)') >= 0) sh.getRange(2, cols.indexOf('Actifs ramenés ($)') + 1, 999, 1).setNumberFormat('#,##0 $');
}
function rows_(sh) {
  if (!sh || sh.getLastRow() < 2) return [];
  var data = sh.getDataRange().getValues(), head = data[0];
  return data.slice(1).map(function (r) { var o = {}; head.forEach(function (k, i) { o[k] = r[i]; }); return o; });
}
function findRow_(sh, col, val) {
  if (!col || !val || sh.getLastRow() < 2) return 0;
  var vals = sh.getRange(2, col, sh.getLastRow() - 1, 1).getValues();
  for (var i = vals.length - 1; i >= 0; i--) if (String(vals[i][0]) === String(val)) return i + 2;
  return 0;
}
function findDuplicate_(sh, head, email, tel, days) {
  if (sh.getLastRow() < 2) return 0;
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, head.length).getValues(), lim = Date.now() - days * 86400000;
  var iE = head.indexOf('Courriel'), iT = head.indexOf('Téléphone'), iD = head.indexOf('Date entrée');
  var em = String(email || '').toLowerCase(), te = e164_(tel);
  for (var i = data.length - 1; i >= 0; i--) {
    var t = data[i][iD] instanceof Date ? data[i][iD].getTime() : 0;
    if (t < lim) continue;
    if ((em && String(data[i][iE]).toLowerCase() === em) || (te && e164_(data[i][iT]) === te)) return i + 2;
  }
  return 0;
}
function removeFromLeads_(id) { removeRow_('Leads', id); }
function removeRow_(name, id) {
  if (!id) return;
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name); if (!sh || sh.getLastRow() < 2) return;
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var r = findRow_(sh, head.indexOf('Lead ID') + 1, id); if (r) sh.deleteRow(r);
}
function quarantine_(rec, raison) {
  var sh = sheet_('Quarantaine', QUAR_COLUMNS);
  rec['Raison quarantaine'] = raison; rec['Mis en quarantaine le'] = new Date();
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var r = rec['Lead ID'] ? findRow_(sh, head.indexOf('Lead ID') + 1, rec['Lead ID']) : 0;
  var row = head.map(function (k) { return k in rec ? cell_(rec[k]) : ''; });
  if (r) sh.getRange(r, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
}
function block_(type, val, raison) {
  if (!val || blocklisted_(type === 'courriel' ? val : '', type === 'telephone' ? val : '')) return;
  sheet_('Blocklist', BLOCK_COLUMNS).appendRow([type, String(val).toLowerCase(), raison, new Date()]);
}
function blocklisted_(email, tel) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Blocklist');
  if (!sh || sh.getLastRow() < 2) return '';
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues(), em = String(email || '').toLowerCase(), te = e164_(tel);
  var dom = em.split('@')[1] || '';
  for (var i = 0; i < data.length; i++) {
    var t = String(data[i][0]).toLowerCase(), v = String(data[i][1]).toLowerCase().trim();
    if (!v) continue;
    if (t === 'courriel' && em && (v === em || v === '@' + dom || v === dom)) return 'courriel ' + v;
    if (t === 'telephone' && te && e164_(v) === te) return 'téléphone ' + v;
  }
  return '';
}
function e164_(tel) {
  var d = String(tel || '').replace(/\D/g, '');
  if (d.length === 11 && d[0] === '1') d = d.slice(1);
  return d.length === 10 ? '+1' + d : '';
}
function proof_(token) {
  try {
    var parts = String(token).split('.'); if (parts.length !== 2) return null;
    var sig = Utilities.computeHmacSha256Signature(parts[0], CFG_.secret).map(function (b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
    if (sig !== parts[1]) return null;
    var b64 = parts[0]; while (b64.length % 4) b64 += '=';
    return JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(b64)).getDataAsString());
  } catch (e) { return null; }
}
function cell_(v) {
  if (v === undefined || v === null) return '';
  if (v instanceof Date || typeof v === 'number' || typeof v === 'boolean') return v;
  if (typeof v === 'object') v = JSON.stringify(v);
  v = String(v).slice(0, 500);
  return /^[=+\-@]/.test(v) ? "'" + v : v; // empêche une cellule de commencer par une formule
}
function colorRow_(sh, r, statut) {
  var c = statut === 'À vérifier' ? '#fff2cc' : statut === 'En attente vérif' ? '#efefef' : null;
  sh.getRange(r, 1, 1, sh.getLastColumn()).setBackground(c);
}
function calendar_() {
  var cals = CalendarApp.getCalendarsByName(CFG_.calendrier);
  return cals.length ? cals[0] : CalendarApp.createCalendar(CFG_.calendrier, { color: CalendarApp.Color.YELLOW });
}
function callbackEvent_(title, when, rec, d) {
  try {
    var desc = ['Téléphone : ' + (rec['Téléphone'] || ''), 'Courriel : ' + (rec['Courriel'] || ''), 'Besoin : ' + (rec['Besoin'] || ''),
      'Source : ' + (rec['Source'] || ''), 'Vérifié par code : ' + (rec['OTP vérifié'] === true ? 'oui' : 'non'), 'Risque : ' + rec['Risque'] + '/100',
      d && d.qualifie !== undefined ? 'Qualifié : ' + d.qualifie : '', '',
      'Script : « Bonjour ' + String(rec['Nom']).split(' ')[0] + ', Walid Harchaoui de W Héritage. Vous avez rempli le diagnostic sur mon site ; je vous appelle pour en faire la revue avec vous, ça prend 15 minutes. C\'est un bon moment ? »',
      '', 'Feuille : ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()].filter(function (x) { return x !== ''; }).join('\n');
    var ev = calendar_().createEvent(title, when, new Date(when.getTime() + 15 * 60000), { description: desc });
    ev.addPopupReminder(10);
    return ev;
  } catch (e) { console.error('Agenda : ' + e.message); return null; }
}
// Prochain créneau ouvrable (lun-ven 9 h-17 h, heure de Montréal)
function callbackSlot_(d) {
  var x = new Date(d.getTime()), h = Number(Utilities.formatDate(x, CFG_.tz, 'H')), wd = Number(Utilities.formatDate(x, CFG_.tz, 'u'));
  if (wd >= 6 || h >= 17) return nextBusinessDayAt_(x, 10, 0);
  if (h < 9) return atTime_(x, 10, 0);
  return x;
}
function nextBusinessDayAt_(from, h, m) {
  var x = new Date(from.getTime());
  do { x = new Date(x.getTime() + 86400000); } while (Number(Utilities.formatDate(x, CFG_.tz, 'u')) >= 6);
  return atTime_(x, h, m);
}
function atTime_(day, h, m) {
  var s = Utilities.formatDate(day, CFG_.tz, 'yyyy-MM-dd') + 'T' + ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':00';
  var off = Utilities.formatDate(day, CFG_.tz, 'XXX');
  return new Date(s + off);
}
function fmt_(d) { return Utilities.formatDate(d instanceof Date ? d : new Date(d), CFG_.tz, 'yyyy-MM-dd HH:mm'); }
function fmtDay_(d) { return Utilities.formatDate(d, CFG_.tz, 'yyyy-MM-dd'); }
function remindProspect_(rec) {
  try {
    MailApp.sendEmail(rec['Courriel'], 'Votre diagnostic W Héritage : confirmez votre numéro',
      'Bonjour ' + String(rec['Nom']).split(' ')[0] + ',\n\nVous avez rempli le diagnostic sur wheritage.vercel.app, mais votre numéro n\'a pas été confirmé. ' +
      'Pour que je puisse vous joindre, répondez simplement à ce courriel avec le meilleur numéro et le meilleur moment pour vous appeler.\n\n' +
      'Si ce n\'était pas vous, ignorez ce message : vos renseignements seront supprimés.\n\nWalid Harchaoui, CSF\nW Héritage · (514) 296-7511',
      { name: 'Walid Harchaoui · W Héritage', replyTo: CFG_.email });
  } catch (e) { console.error('Rappel prospect : ' + e.message); }
}
