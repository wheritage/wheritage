/* ==========================================================================
   W HÉRITAGE · Diagnostic (/diagnostic)
   Quiz en une page : intro → 10 questions → préoccupation → petit oui → coordonnées → résultat.
   TOUT le contenu (questions, points, textes) est dans DIAG ci-dessous : on modifie
   les mots et les points ici, sans toucher à la logique plus bas.
   ========================================================================== */
var DIAG = {
  // Réservation Cal.com (même événement que /strategie-societe tant qu'un événement « revue » n'existe pas)
  calLink: 'wheritage/rencontre-strategique-15min',

  // Une VSL par enjeu : lien YouTube, Vimeo ou .mp4. Vide = « Vidéo bientôt ».
  videos: { revenu: '', succession: '', liquidites: '' },

  // Clé de stockage de la progression (sessionStorage)
  storeKey: 'wh-diagnostic',

  intro: {
    titre: 'Votre société : <em>quels enjeux vous concernent vraiment ?</em>',
    sousTitre: '10 questions, 2 minutes. Vous voyez quels enjeux semblent s\'appliquer à vous, et une courte vidéo qui les explique.',
    meta: '2 minutes · 10 questions',
    bouton: 'Commencer le diagnostic',
    avis: 'Outil éducatif. Aucun conseil personnalisé n\'est donné ici.'
  },

  // [À VALIDER] libellés des questions et seuil de 15 000 $ (repère d'adéquation, jamais une promesse d'admissibilité)
  questions: [
    { id: 'incorpore', q: 'Votre entreprise est-elle incorporée (société par actions) ?',
      o: [['oui', 'Oui'], ['non', 'Non'], ['en_cours', 'C\'est en cours']] },
    { id: 'province', q: 'Dans quelle province est votre société ?',
      o: [['qc', 'Québec'], ['on', 'Ontario'], ['autre', 'Ailleurs au Canada']] },
    { id: 'secteur', q: 'Votre secteur ?',
      o: [['construction', 'Construction et métiers'], ['sante_pro', 'Santé et professionnels incorporés'], ['transport', 'Transport et logistique'],
          ['commerce', 'Restauration et commerce'], ['conseil_ti', 'Services-conseils et TI'], ['autre', 'Autre']] },
    { id: 'role', q: 'Votre rôle dans la société ?',
      o: [['seul', 'Seul actionnaire'], ['associes', 'Actionnaire avec des associés'], ['autre', 'Autre']] },
    { id: 'surplus', q: 'Une fois vos besoins payés, combien votre société garde-t-elle environ par année ?',
      o: [['lt15', 'Moins de 15 000 $'], ['15_50', '15 000 $ à 50 000 $'], ['50_150', '50 000 $ à 150 000 $'], ['gt150', 'Plus de 150 000 $'], ['nsp', 'Je ne sais pas']] },
    { id: 'placements', q: 'Environ combien votre société a-t-elle déjà en placements ?',
      o: [['0', 'Rien ou presque'], ['lt250k', 'Moins de 250 000 $'], ['250k_1m', '250 000 $ à 1 M$'], ['gt1m', 'Plus de 1 M$'], ['nsp', 'Je ne sais pas']] },
    { id: 'dependants', q: 'Quelqu\'un dépend-il de vous ou de la valeur de votre entreprise (famille, associés) ?',
      o: [['oui', 'Oui'], ['non', 'Non']] },
    { id: 'projet', q: 'Avez-vous un projet à financer d\'ici 5 à 10 ans (immeuble, investissement, expansion) ?',
      o: [['oui', 'Oui'], ['peut_etre', 'Peut-être'], ['non', 'Non']] },
    { id: 'besoin_5ans', q: 'Aurez-vous besoin de presque tous les surplus de votre société d\'ici 5 ans ?',
      o: [['oui', 'Oui'], ['non', 'Non'], ['nsp', 'Je ne sais pas']] },
    { id: 'assurance_societe', q: 'Votre société détient-elle déjà une assurance vie sur votre tête ?',
      o: [['oui', 'Oui'], ['non', 'Non'], ['nsp', 'Je ne sais pas']] }
  ],

  // Écran après Q10 : sert seulement à départager les égalités
  preoccupation: { id: 'preoccupation', q: 'Lequel de ces sujets vous préoccupe le plus ?', etiquette: 'Une dernière précision',
    o: [['revenu', 'Ce que mes placements coûtent en impôt'], ['succession', 'Ce qui arrivera à ma famille ou mes associés'],
        ['liquidites', 'Accéder à mon argent pour un projet'], ['nsp', 'Je ne sais pas encore']] },

  // Sorties polies : réponse qui déclenche → texte. Aucun formulaire.
  exits: {
    incorpore: { si: 'non', raison: 'non_incorpore', titre: 'Merci, <em>c\'est clair.</em>',
      texte: 'Les stratégies présentées ici concernent les sociétés par actions. Si vous vous incorporez un jour, refaites le diagnostic. En attendant, ce guide peut vous être utile.' },
    besoin_5ans: { si: 'oui', raison: 'besoin_court_terme', titre: 'Merci, <em>c\'est clair.</em>',
      texte: 'Ces stratégies demandent que l\'argent puisse rester investi à long terme. Si vos surplus servent d\'ici 5 ans, elles ne sont probablement pas pour vous maintenant. Ce guide peut quand même vous être utile.' }
  },
  // [DÉCISION] lien du guide L'Empire Blindé (formulaire existant de la page d'accueil)
  guide: { titre: 'L\'Empire Blindé', texte: 'Les angles morts les plus fréquents chez les entrepreneurs incorporés. Guide gratuit.', lien: '/#guide' },

  // Points par enjeu. [À VALIDER] Un moyen de classer la vidéo la plus pertinente, pas une évaluation fiscale.
  points: {
    revenu: { placements: { '0': 0, lt250k: 1, '250k_1m': 2, gt1m: 4, nsp: 1 }, surplus: { '15_50': 1, '50_150': 2, gt150: 3 } },
    succession: { dependants: { oui: 3 }, role: { associes: 2 }, assurance_societe: { non: 1, nsp: 1 }, placements: { '250k_1m': 1, gt1m: 1 } },
    liquidites: { projet: { oui: 3, peut_etre: 1 }, surplus: { '15_50': 1, '50_150': 2, gt150: 2 }, besoin_5ans: { non: 1 } }
  },
  // 0–2 faible, 3–4 moyenne, 5+ élevée
  seuils: { moyenne: 3, elevee: 5 },
  // Égalité sans préoccupation correspondante : cet ordre
  ordre: ['succession', 'revenu', 'liquidites'],

  petitOui: {
    q: 'Si une structure prévue par la loi pouvait s\'appliquer à votre situation, voudriez-vous la regarder, avec votre comptable ?',
    oui: 'Oui', non: 'Pas pour l\'instant'
  },
  // [DÉCISION] permettre de voir le résultat sans coordonnées quand la réponse est « Pas pour l'instant » (défaut : oui)
  permettreSansCoordonnees: true,

  contact: {
    titre: 'Où vous envoyer <em>votre diagnostic ?</em>',
    texte: 'Votre résultat s\'affiche juste après.',
    bouton: 'Voir mon diagnostic',
    passer: 'Voir mon résultat sans laisser mes coordonnées',
    sousBouton: 'Vos réponses servent uniquement à préparer votre diagnostic. Elles ne sont ni vendues ni partagées.'
  },
  // [À VALIDER] Loi 25 et LCAP. Changer « version » à chaque changement de texte : elle est stockée avec le lead.
  consentements: {
    diagnostic: { version: 'diag-c1-v1', texte: 'J\'accepte que W Héritage utilise mes réponses et mes coordonnées pour m\'envoyer mon diagnostic et me contacter à ce sujet.' },
    marketing: { version: 'diag-c2-v1', texte: 'J\'accepte de recevoir d\'autres contenus éducatifs par courriel ou texto. Je peux me désabonner en tout temps.' }
  },
  politique: '/confidentialite',

  noms: { revenu: 'Revenu passif', succession: 'Succession', liquidites: 'Liquidités' },
  niveaux: { faible: 'Faible', moyenne: 'Moyenne', elevee: 'Élevée' },
  // [À VALIDER] titres affichés dans le lecteur
  titresVideo: {
    revenu: 'Revenu passif : ce que vos placements peuvent coûter à votre entreprise',
    succession: 'Succession : ce qui pourrait arriver à votre société au décès',
    liquidites: 'Liquidités : accéder à l\'argent de votre société'
  },
  // [À VALIDER] textes du résultat. Règles : pas de « sans impôt » seul, « garanti », « rendement », « éliminer l'impôt », « retrait ».
  textes: {
    revenu: {
      elevee: 'Votre société semble avoir des placements importants. Au fédéral, au-delà d\'un certain revenu de placement, le plafond du taux réduit de votre entreprise peut baisser. Ça vaut la peine de regarder ce que vos placements vous coûtent.',
      moyenne: 'Vos placements pourraient grandir assez pour que les règles sur le revenu passif deviennent un enjeu. Mieux vaut le savoir avant.',
      faible: 'Selon vos réponses, cet enjeu semble moins présent pour le moment.'
    },
    succession: {
      elevee: 'Des personnes dépendent de vous ou de votre entreprise. Au décès, l\'impôt et le manque de liquidités peuvent compliquer les choses pour elles. Ça mérite d\'être planifié.',
      moyenne: 'Une partie de votre situation pourrait poser des enjeux de succession. Une vérification avec votre comptable serait utile.',
      faible: 'Selon vos réponses, cet enjeu semble moins présent pour le moment.'
    },
    liquidites: {
      elevee: 'Vous avez un projet en vue et des surplus qui restent dans votre société. Il existe plus d\'une façon d\'accéder à cet argent, chacune avec ses coûts et ses risques.',
      moyenne: 'Si un projet se précise, il peut être utile de connaître vos options pour accéder à l\'argent de votre société, et leurs risques.',
      faible: 'Selon vos réponses, cet enjeu semble moins présent pour le moment.'
    }
  },
  resultat: {
    titre: 'Votre diagnostic',
    ligne: 'Voici les enjeux qui semblent les plus présents selon vos réponses.',
    reserver: 'Réserver la revue de mon diagnostic · 15 min, sans frais',
    methode: 'Ce diagnostic classe les sujets selon vos réponses. Ce n\'est pas une analyse financière ni un conseil personnalisé. Seule une analyse complète, validée par votre comptable, peut confirmer si une stratégie s\'applique.',
    // [À VALIDER] mention exigée : nom du cabinet repris des divulgations du site (conditions#divulgations)
    divulgation: 'À titre éducatif seulement. Walid Harchaoui, conseiller en sécurité financière, rattaché au cabinet Industrielle Alliance, Assurance et services financiers inc. Rémunéré par commission.',
    horsQuebec: 'Les exemples des vidéos utilisent les taux du Québec. Les règles et les taux de votre province diffèrent.'
  }
};

(function () {
  'use strict';
  var root = document.getElementById('diag');
  if (!root) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var Q = DIAG.questions, NQ = Q.length, PROBS = ['revenu', 'succession', 'liquidites'];
  function track(n, p) { if (window.WH && WH.track) WH.track(n, p); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var ARROW = '<svg viewBox="0 0 14 14"><path d="M2 7h10M8 3l4 4-4 4"/></svg>';

  /* ── État, gardé dans sessionStorage pour survivre à un rafraîchissement ── */
  var st = { step: 'intro', answers: {}, micro: null, src: {}, steps: {} };
  function save() { try { sessionStorage.setItem(DIAG.storeKey, JSON.stringify(st)); } catch (e) {} }
  function clear() { try { sessionStorage.removeItem(DIAG.storeKey); } catch (e) {} }
  try { var saved = JSON.parse(sessionStorage.getItem(DIAG.storeKey) || 'null'); if (saved && saved.answers) st = saved; } catch (e) {}
  st.steps = st.steps || {};
  // Provenance : niche, UTM et fbclid de l'arrivée (on garde la première valeur vue)
  (function () {
    var p; try { p = new URLSearchParams(location.search); } catch (e) { return; }
    ['niche', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid'].forEach(function (k) {
      var v = p.get(k); if (v && !st.src[k]) st.src[k] = v.slice(0, 200);
    });
    if (st.src.niche) st.src.niche = st.src.niche.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
  })();
  // Le résultat n'est pas restauré (stockage vidé après l'envoi) ; un état « result » orphelin repart de l'intro
  if (st.step === 'result') st.step = 'intro';

  /* ── Calcul ── */
  function scores(a) {
    var out = {};
    PROBS.forEach(function (p) {
      var pts = 0, rules = DIAG.points[p];
      for (var id in rules) { var v = rules[id][a[id]]; if (v) pts += v; }
      out[p] = pts;
    });
    return out;
  }
  function level(pts) { return pts >= DIAG.seuils.elevee ? 'elevee' : pts >= DIAG.seuils.moyenne ? 'moyenne' : 'faible'; }
  function mainProblem(sc, pre) {
    var max = Math.max.apply(null, PROBS.map(function (p) { return sc[p]; }));
    var tied = PROBS.filter(function (p) { return sc[p] === max; });
    if (tied.length === 1) return tied[0];
    if (tied.indexOf(pre) >= 0) return pre;
    return DIAG.ordre.filter(function (p) { return tied.indexOf(p) >= 0; })[0];
  }
  function ranking(sc, main) {
    return [main].concat(DIAG.ordre.filter(function (p) { return p !== main; }).sort(function (x, y) { return sc[y] - sc[x]; }));
  }
  function qualifie(a) {
    if (a.surplus === 'lt15') return false;
    if (a.incorpore === 'en_cours') return 'a_verifier';
    return true;
  }
  function result() {
    var sc = scores(st.answers), main = mainProblem(sc, st.answers.preoccupation), niv = {};
    PROBS.forEach(function (p) { niv[p] = level(sc[p]); });
    return { scores: sc, niveaux: niv, main: main, order: ranking(sc, main) };
  }
  // Exposé pour les tests (aucune donnée personnelle)
  window.WHDiag = { scores: scores, level: level, mainProblem: mainProblem, qualifie: qualifie };

  /* ── Rendu des écrans ── */
  var stage = document.getElementById('diag-stage');
  var bar = document.getElementById('diag-bar'), barFill = bar.querySelector('i'), live = document.getElementById('diag-live');
  var TOTAL = NQ + 1; // 10 questions + préoccupation

  function progress(i) {
    if (i == null) { bar.hidden = true; return; }
    bar.hidden = false;
    barFill.style.width = ((i + 1) / TOTAL * 100) + '%';
    bar.setAttribute('aria-valuenow', String(i + 1));
    bar.setAttribute('aria-valuetext', i < NQ ? 'Question ' + (i + 1) + ' sur ' + NQ : DIAG.preoccupation.etiquette);
  }

  function optsHtml(id, opts, cur) {
    return '<div class="dg-opts' + (opts.length > 4 ? ' many' : '') + '" role="group" aria-labelledby="dg-h">' + opts.map(function (o) {
      return '<button type="button" class="dg-opt" data-id="' + id + '" data-v="' + esc(o[0]) + '" aria-pressed="' + (cur === o[0]) + '">' + esc(o[1]) + '</button>';
    }).join('') + '</div>';
  }

  function screenHtml(step) {
    if (step === 'intro') {
      return '<p class="eyebrow">' + esc(DIAG.intro.meta) + '</p>' +
        '<h1 id="dg-h" tabindex="-1">' + DIAG.intro.titre + '</h1>' +
        '<p class="dg-lead">' + esc(DIAG.intro.sousTitre) + '</p>' +
        '<button type="button" class="btn btn-gold dg-start" data-act="start">' + esc(DIAG.intro.bouton) + ARROW + '</button>' +
        '<p class="dg-fine">' + esc(DIAG.intro.avis) + '</p>';
    }
    var m;
    if ((m = /^q(\d+)$/.exec(step))) {
      var i = +m[1], q = Q[i];
      return '<p class="dg-count">Question ' + (i + 1) + ' de ' + NQ + '</p>' +
        '<h2 id="dg-h" tabindex="-1">' + esc(q.q) + '</h2>' + optsHtml(q.id, q.o, st.answers[q.id]) + backHtml();
    }
    if (step === 'pre') {
      var p = DIAG.preoccupation;
      return '<p class="dg-count">' + esc(p.etiquette) + '</p><h2 id="dg-h" tabindex="-1">' + esc(p.q) + '</h2>' + optsHtml(p.id, p.o, st.answers[p.id]) + backHtml();
    }
    if (step.indexOf('exit_') === 0) {
      var ex = DIAG.exits[step.slice(5)];
      return '<h2 id="dg-h" tabindex="-1">' + ex.titre + '</h2><p class="dg-lead">' + esc(ex.texte) + '</p>' +
        '<a class="dg-guide" href="' + esc(DIAG.guide.lien) + '"><small>Guide gratuit</small><strong>' + esc(DIAG.guide.titre) + '</strong><span>' + esc(DIAG.guide.texte) + '</span></a>' +
        '<button type="button" class="dg-back" data-act="back">Modifier ma réponse</button>';
    }
    if (step === 'micro') {
      return '<h2 id="dg-h" tabindex="-1">' + esc(DIAG.petitOui.q) + '</h2>' +
        '<div class="dg-opts" role="group" aria-labelledby="dg-h">' +
        '<button type="button" class="dg-opt" data-act="micro" data-v="oui" aria-pressed="' + (st.micro === true) + '">' + esc(DIAG.petitOui.oui) + '</button>' +
        '<button type="button" class="dg-opt" data-act="micro" data-v="non" aria-pressed="' + (st.micro === false) + '">' + esc(DIAG.petitOui.non) + '</button></div>' + backHtml();
    }
    if (step === 'contact') return contactHtml();
    return '';
  }
  function backHtml() { return '<button type="button" class="dg-back" data-act="back">Question précédente</button>'; }

  function contactHtml() {
    var c = DIAG.contact, k = DIAG.consentements, v = st.contact || {};
    var skip = DIAG.permettreSansCoordonnees && st.micro === false;
    return '<h2 id="dg-h" tabindex="-1">' + c.titre + '</h2><p class="dg-lead">' + esc(c.texte) + '</p>' +
      '<form class="dg-form" id="dg-form" novalidate>' +
        '<div class="dg-fields">' +
          field('prenom', 'Prénom', 'text', 'given-name', true, v.prenom) +
          field('nom', 'Nom', 'text', 'family-name', false, v.nom) +
          field('courriel', 'Courriel', 'email', 'email', true, v.courriel) +
          field('telephone', 'Téléphone', 'tel', 'tel', true, v.telephone) +
        '</div>' +
        '<label class="dg-check"><input type="checkbox" name="c1" required><span>' + esc(k.diagnostic.texte) + ' <a href="' + esc(DIAG.politique) + '" target="_blank" rel="noopener">Politique de confidentialité</a></span></label>' +
        '<label class="dg-check"><input type="checkbox" name="c2"><span>' + esc(k.marketing.texte) + '</span></label>' +
        '<p class="dg-err" id="dg-err" role="alert"></p>' +
        '<button type="submit" class="btn btn-gold">' + esc(c.bouton) + ARROW + '</button>' +
        '<p class="dg-fine">' + esc(c.sousBouton) + '</p>' +
      '</form>' +
      (skip ? '<button type="button" class="dg-skip" data-act="skip">' + esc(c.passer) + '</button>' : '') +
      backHtml();
  }
  function field(name, label, type, ac, req, val) {
    return '<label class="dg-field"><span>' + label + (req ? '' : ' <i>(facultatif)</i>') + '</span>' +
      '<input type="' + type + '" name="' + name + '" autocomplete="' + ac + '"' + (req ? ' required aria-required="true"' : '') +
      (type === 'tel' ? ' inputmode="tel" placeholder="514 555-1234"' : '') + ' value="' + esc(val || '') + '"></label>';
  }

  function stepIndex(step) {
    var m = /^q(\d+)$/.exec(step);
    if (m) return +m[1];
    if (step === 'pre') return NQ;
    return null;
  }

  var animating = null;
  function go(step, opts) {
    opts = opts || {};
    st.step = step;
    if (step !== 'result') save(); // après l'envoi, plus rien n'est gardé
    var html = step === 'result' ? resultHtml() : screenHtml(step);
    root.setAttribute('data-step', step.replace(/\d+$/, ''));
    progress(stepIndex(step));
    var swap = function () {
      stage.innerHTML = html;
      if (step === 'result') bindResult();
      stage.classList.remove('out');
      var h = document.getElementById('dg-h');
      if (h && !opts.noFocus) h.focus({ preventScroll: true });
      var top = root.getBoundingClientRect().top;
      if (top < 0) { if (window.WH && WH.lenis) WH.lenis.scrollTo(root, { offset: -90, immediate: reduce }); else root.scrollIntoView(); }
      if (stepIndex(step) != null) live.textContent = bar.getAttribute('aria-valuetext');
    };
    clearTimeout(animating);
    if (reduce || opts.instant) swap();
    else { stage.classList.add('out'); animating = setTimeout(swap, 180); }
  }

  /* ── Navigation ── */
  function next(fromStep) {
    var i = stepIndex(fromStep);
    if (i != null && i < NQ) {
      var q = Q[i], ex = DIAG.exits[q.id];
      if (ex && st.answers[q.id] === ex.si) { track('diagnostic_exit', { reason: ex.raison }); return go('exit_' + q.id); }
      return go(i + 1 < NQ ? 'q' + (i + 1) : 'pre');
    }
    if (fromStep === 'pre') return go('micro');
    if (fromStep === 'micro') return go('contact');
  }
  function prev() {
    var s = st.step, m;
    if (s.indexOf('exit_') === 0) { var id = s.slice(5); return go('q' + Q.map(function (q) { return q.id; }).indexOf(id)); }
    if ((m = /^q(\d+)$/.exec(s))) return go(+m[1] > 0 ? 'q' + (+m[1] - 1) : 'intro');
    if (s === 'pre') return go('q' + (NQ - 1));
    if (s === 'micro') return go('pre');
    if (s === 'contact') { keepContact(); return go('micro'); }
  }

  stage.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'start') { track('diagnostic_start'); return go('q0'); }
    if (act === 'back') return prev();
    if (act === 'skip') { st.contact = null; return showResult(false); }
    if (act === 'micro') {
      st.micro = b.getAttribute('data-v') === 'oui';
      markPressed(b);
      track('micro_oui', { answer: st.micro ? 'oui' : 'non' });
      return later(function () { next('micro'); });
    }
    if (b.classList.contains('dg-opt')) {
      var id = b.getAttribute('data-id'), from = st.step;
      st.answers[id] = b.getAttribute('data-v');
      markPressed(b); save();
      var i = stepIndex(from);
      if (i != null && !st.steps[i]) { st.steps[i] = 1; track('diagnostic_step', { step: i + 1 }); }
      later(function () { if (st.step === from) next(from); });
    }
  });
  function markPressed(b) { b.parentNode.querySelectorAll('.dg-opt').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); }
  // Petit délai : on voit la sélection en or avant de passer à la suite
  function later(fn) { setTimeout(fn, reduce ? 0 : 260); }

  /* ── Coordonnées ── */
  function keepContact() {
    var f = document.getElementById('dg-form'); if (!f) return;
    st.contact = { prenom: f.prenom.value.trim(), nom: f.nom.value.trim(), courriel: f.courriel.value.trim(), telephone: f.telephone.value.trim() };
    save();
  }
  function phoneCa(v) {
    var d = v.replace(/\D/g, '');
    if (d.length === 11 && d[0] === '1') d = d.slice(1);
    if (d.length !== 10 || /^[01]/.test(d) || /^.{3}[01]/.test(d)) return null;
    return d.slice(0, 3) + ' ' + d.slice(3, 6) + '-' + d.slice(6);
  }
  stage.addEventListener('submit', function (e) {
    if (e.target.id !== 'dg-form') return;
    e.preventDefault();
    var f = e.target, err = document.getElementById('dg-err'), bad = null, msg = '';
    [].forEach.call(f.querySelectorAll('[aria-invalid]'), function (x) { x.removeAttribute('aria-invalid'); });
    var tel = phoneCa(f.telephone.value);
    if (!f.prenom.value.trim()) { bad = f.prenom; msg = 'Indiquez votre prénom.'; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.courriel.value.trim())) { bad = f.courriel; msg = 'Vérifiez votre adresse courriel.'; }
    else if (!tel) { bad = f.telephone; msg = 'Entrez un numéro canadien à 10 chiffres, par exemple 514 555-1234.'; }
    else if (!f.c1.checked) { bad = f.c1; msg = 'Cochez la première case pour recevoir votre diagnostic.'; }
    if (bad) { err.textContent = msg; bad.setAttribute('aria-invalid', 'true'); bad.focus(); return; }
    f.telephone.value = tel;
    keepContact();
    var now = new Date().toISOString(), k = DIAG.consentements;
    st.consent = {
      diagnostic: { date: now, version: k.diagnostic.version, texte: k.diagnostic.texte },
      marketing: f.c2.checked ? { date: now, version: k.marketing.version, texte: k.marketing.texte } : null
    };
    showResult(true);
  });

  function showResult(withContact) {
    var r = result();
    st.result = r;
    if (withContact) {
      var payload = buildPayload(r);
      sendLead(payload);
      track('diagnostic_lead', { enjeu_principal: r.main, qualifie: String(payload.qualifie) });
    }
    st.prenom = withContact && st.contact ? st.contact.prenom : '';
    var keep = { contact: withContact ? st.contact : null, prenom: st.prenom, result: r, answers: st.answers };
    clear(); // progression effacée après l'envoi ; le résultat reste à l'écran
    st = { step: 'result', answers: keep.answers, micro: st.micro, src: st.src, steps: st.steps, contact: keep.contact, prenom: keep.prenom, result: r };
    go('result');
  }

  /* ── Envoi du lead : UNE fonction à re-pointer vers le futur CRM ──
     Apps Script (feuille « Leads W Héritage »). text/plain évite la requête préalable CORS.
     Une seule nouvelle tentative ; le résultat ne l'attend jamais. */
  function buildPayload(r) {
    var a = st.answers, c = st.contact || {}, s = st.src || {};
    return {
      source: 'diagnostic', date: new Date().toISOString(),
      prenom: c.prenom || '', nom: c.nom || '', courriel: c.courriel || '', telephone: c.telephone || '',
      province: a.province || '', secteur: a.secteur || '', role: a.role || '',
      surplus: a.surplus || '', placements: a.placements || '', dependants: a.dependants || '', projet: a.projet || '',
      besoin_5ans: a.besoin_5ans || '', assurance_societe: a.assurance_societe || '', preoccupation: a.preoccupation || '',
      incorpore: a.incorpore || '',
      niveaux: r.niveaux, enjeu_principal: r.main, qualifie: qualifie(a), micro_oui: st.micro === true,
      consentement_diagnostic: st.consent && st.consent.diagnostic, consentement_marketing: st.consent ? st.consent.marketing : null,
      niche: s.niche || '', utm_source: s.utm_source || '', utm_medium: s.utm_medium || '', utm_campaign: s.utm_campaign || '',
      utm_content: s.utm_content || '', fbclid: s.fbclid || ''
    };
  }
  function sendLead(payload) {
    var cfg = (window.WH && WH.config) || {};
    if (!cfg.leadsUrl) return;
    var url = cfg.leadsUrl + (cfg.leadsToken ? '?k=' + encodeURIComponent(cfg.leadsToken) : '');
    var body = JSON.stringify(payload);
    function attempt() {
      return fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body });
    }
    attempt().catch(function () { setTimeout(function () { attempt().catch(function () {}); }, 2000); });
  }
  window.WHDiag.sendLead = sendLead;

  /* ── Résultat ── */
  function resultHtml() {
    var r = st.result, R = DIAG.resultat, a = st.answers;
    var cards = r.order.map(function (p, i) {
      return '<article class="dg-card' + (i === 0 ? ' main' : '') + '">' +
        '<small><span>' + esc(DIAG.noms[p]) + '</span><b class="lv-' + r.niveaux[p] + '">Exposition ' + esc(DIAG.niveaux[r.niveaux[p]].toLowerCase()) + '</b></small>' +
        '<p>' + esc(DIAG.textes[p][r.niveaux[p]]) + '</p></article>';
    }).join('');
    return '<p class="eyebrow">Résultat</p>' +
      '<h2 id="dg-h" tabindex="-1">' + esc(R.titre) + (st.prenom ? ', <em>' + esc(st.prenom) + '</em>' : '') + '</h2>' +
      '<p class="dg-lead">' + esc(R.ligne) + '</p>' +
      '<div class="dg-cards">' + cards + '</div>' +
      '<div class="vsl-wrap"><div class="vsl" id="vsl"><div class="vs-bg"></div><div class="vs-ui">' +
        '<div class="play"><svg viewBox="0 0 16 16"><path d="M3 1.5v13L14 8z"/></svg></div>' +
        '<div class="vs-t" id="vsl-t"></div><div class="vs-s" id="vsl-s"></div></div></div>' +
        '<div class="dg-vlinks"></div></div>' +
      '<div class="dg-book"><button type="button" class="btn btn-gold" id="dg-book">' + esc(R.reserver) + ARROW + '</button>' +
        '<p class="dg-fine">Le calendrier ne s\'ouvre pas ? <a href="#" id="dg-cal-link" target="_blank" rel="noopener" data-no-track>Ouvrir dans un nouvel onglet</a></p></div>' +
      '<div class="dg-booked" id="dg-booked" role="status" hidden><h3>C\'est réservé. <em>À bientôt.</em></h3><p>La confirmation est dans votre boîte courriel. Si vous voulez, invitez votre comptable.</p></div>' +
      '<div class="dg-notes">' +
        '<p>' + esc(R.methode) + '</p>' +
        (a.province === 'on' || a.province === 'autre' ? '<p>' + esc(R.horsQuebec) + '</p>' : '') +
        '<p>' + esc(R.divulgation) + '</p></div>';
  }

  function bindResult() {
    var r = st.result, vsl = document.getElementById('vsl');
    function load(p) {
      var old = vsl.querySelector('iframe, video'); if (old) old.remove();
      vsl.classList.remove('playing'); delete vsl.dataset.played;
      vsl.setAttribute('data-enjeu', p);
      var url = DIAG.videos[p] || '';
      vsl.setAttribute('data-video', url);
      vsl.classList.toggle('empty', !url);
      document.getElementById('vsl-t').textContent = DIAG.titresVideo[p];
      document.getElementById('vsl-s').textContent = url ? 'Regarder' : 'Vidéo bientôt';
      document.querySelectorAll('.dg-vlink').forEach(function (b) { b.hidden = b.getAttribute('data-vsl') === p; });
    }
    // Liens vers les autres vidéos : on montre toujours les deux qui ne jouent pas
    var links = document.querySelector('.dg-vlinks');
    links.innerHTML = r.order.map(function (p) { return '<button type="button" class="dg-vlink" data-vsl="' + p + '">Voir la vidéo · ' + esc(DIAG.noms[p]) + '</button>'; }).join('');
    load(r.main);
    links.addEventListener('click', function (e) {
      var b = e.target.closest('[data-vsl]'); if (!b) return;
      load(b.getAttribute('data-vsl'));
      vsl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
    vsl.addEventListener('click', function () {
      var url = vsl.getAttribute('data-video');
      if (!url || vsl.dataset.played) return;
      var e = window.WH && WH.embedUrl(url); if (!e) return;
      vsl.dataset.played = '1'; vsl.classList.add('playing');
      var node;
      if (e.type === 'video') { node = document.createElement('video'); node.src = e.src; node.controls = true; node.autoplay = true; node.playsInline = true; }
      else { node = document.createElement('iframe'); node.src = e.src; node.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media'; node.allowFullscreen = true; node.title = 'Vidéo'; }
      vsl.appendChild(node);
      if (WH.trackVsl) WH.trackVsl(node, vsl.getAttribute('data-enjeu'));
    });

    // Réservation : nom, courriel et une note (enjeu principal + niveaux) préremplis si on les a
    var c = st.contact || {};
    var notes = 'Diagnostic · enjeu principal : ' + DIAG.noms[r.main] + ' · niveaux : ' +
      PROBS.map(function (p) { return DIAG.noms[p] + ' ' + DIAG.niveaux[r.niveaux[p]].toLowerCase(); }).join(', ');
    var prefill = { notes: notes };
    if (c.prenom) prefill.name = (c.prenom + ' ' + (c.nom || '')).trim();
    if (c.courriel) prefill.email = c.courriel;
    var q = Object.keys(prefill).map(function (k) { return k + '=' + encodeURIComponent(prefill[k]); }).join('&');
    var link = document.getElementById('dg-cal-link');
    link.href = 'https://cal.com/' + DIAG.calLink + '?' + q;
    var booked = false;
    function onBooked() {
      if (booked) return; booked = true;
      track('diagnostic_booked', { enjeu_principal: r.main });
      document.getElementById('dg-booked').hidden = false;
      document.querySelector('.dg-book').hidden = true;
    }
    function clicked() { track('diagnostic_booking', { enjeu_principal: r.main }); }
    link.addEventListener('click', clicked);
    document.getElementById('dg-book').addEventListener('click', function () {
      clicked();
      if (!initCal(onBooked)) { window.open(link.href, '_blank', 'noopener'); return; }
      Cal.ns.diag('modal', { calLink: DIAG.calLink, config: Object.assign({ theme: 'dark' }, prefill) });
    });
  }

  var calReady = false;
  function initCal(onBooked) {
    if (calReady) return true;
    try {
      (function (C, A, L) { var p = function (a, ar) { a.q.push(ar); }; var d = C.document; C.Cal = C.Cal || function () { var cal = C.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }; var namespace = ar[1]; api.q = api.q || []; if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, 'https://app.cal.com/embed/embed.js', 'init');
      Cal('init', 'diag', { origin: 'https://app.cal.com' });
      Cal.ns.diag('ui', { theme: 'dark', cssVarsPerTheme: { dark: { 'cal-brand': '#C9A84C' } } });
      Cal.ns.diag('on', { action: 'bookingSuccessful', callback: onBooked });
      Cal.ns.diag('on', { action: 'bookingSuccessfulV2', callback: onBooked });
      calReady = true;
    } catch (e) { return false; }
    return true;
  }

  /* ── Démarrage ── */
  track('diagnostic_view');
  go(st.step === 'intro' || !st.step ? 'intro' : st.step, { instant: true, noFocus: true });
})();
