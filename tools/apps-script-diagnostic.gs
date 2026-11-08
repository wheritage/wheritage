/* ==========================================================================
   Apps Script « Leads W Héritage » : ajout des leads du /diagnostic
   À coller dans le projet Apps Script relié à la feuille (Extensions > Apps Script).
   Ce fichier n'est pas déployé sur le site (tools/ est exclu par .vercelignore).

   1. Coller la fonction appendDiagnostic_ (et DIAG_COLUMNS) sous le code existant.
   2. Dans doPost, APRÈS la vérification du TOKEN et le JSON.parse existants, ajouter :

        if (data.source === 'diagnostic' || data.source === 'diagnostic_particulier') { appendDiagnostic_(data); return ContentService.createTextOutput('ok'); }

      (« data » = le nom de la variable qui contient le JSON reçu dans le script actuel.)
   3. Déployer > Gérer les déploiements > crayon > Version : « Nouvelle version » > Déployer.
      Garder le MÊME déploiement : l'URL /exec ne change pas, site.js n'a rien à modifier.

   Entrepreneurs → onglet « Diagnostic » ; particuliers → onglet « Diagnostic particuliers ».
   Chaque onglet est créé au premier lead avec ses en-têtes. « langue » = fr ou en (version du quiz vue).
   Si l'onglet « Diagnostic » existe déjà sans la colonne « langue », insérer une colonne « langue »
   juste avant « recu_le » (ou supprimer l'onglet de test : il sera recréé).
   Décision (a) du plan : les fourchettes (surplus, placements) restent dans la feuille seulement ;
   le futur CRM ne recevra que les niveaux.
   ========================================================================== */

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

function appendDiagnostic_(d) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var perso = d.source === 'diagnostic_particulier';
    var name = perso ? 'Diagnostic particuliers' : 'Diagnostic';
    var cols = perso ? DIAG_COLUMNS_PARTICULIER : DIAG_COLUMNS;
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) { sh.appendRow(cols); sh.setFrozenRows(1); }

    var niv = d.niveaux || {};
    var c1 = d.consentement_diagnostic || {};
    var c2 = d.consentement_marketing || {};
    var flat = {
      niveau_revenu: niv.revenu, niveau_succession: niv.succession, niveau_liquidites: niv.liquidites,
      niveau_protection_revenu: niv.protection_revenu, niveau_famille: niv.famille, niveau_patrimoine: niv.patrimoine,
      consentement_diagnostic_date: c1.date, consentement_diagnostic_version: c1.version, consentement_diagnostic_texte: c1.texte,
      consentement_marketing_date: c2.date || '', consentement_marketing_version: c2.version || '', consentement_marketing_texte: c2.texte || '',
      recu_le: new Date().toISOString()
    };
    var row = cols.map(function (k) {
      var v = k in flat ? flat[k] : d[k];
      if (v === undefined || v === null) return '';
      // Empêche une cellule de commencer par = + - @ (injection de formule)
      v = String(v).slice(0, 500);
      return /^[=+\-@]/.test(v) ? "'" + v : v;
    });
    sh.appendRow(row);
  } finally {
    lock.releaseLock();
  }
}
