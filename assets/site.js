/* ==========================================================================
   W HÉRITAGE — script partagé
   Chargé juste après <body> : l'intro (logo + nom) couvre la page avant le premier rendu.
   ========================================================================== */
(function () {
  'use strict';

  /* ── Réglages du site : modifier ici seulement ── */
  var CONFIG = {
    // Liens de soumission personnels (code référent uid=g9kics)
    quoteAutoUrl: 'https://assurance.ia.ca/auto/?uid=g9kics&redirect=false',
    quoteHomeUrl: 'https://assurance.ia.ca/soumissions-habitation/?uid=g9kics&redirect=false',
    calUrl: 'https://cal.com/wheritage',
    calQuickUrl: 'https://cal.com/wheritage/rencontre-strategique-15min',
    phone: '(514) 296-7511',
    tel: '5142967511',
    email: 'walid.harchaoui@agc.ia.ca',
    instagram: 'https://www.instagram.com/walidh.csf',
    // Mesure et publicité : laisser vide tant que les comptes ne sont pas créés.
    // Rien ne se charge et la bannière de témoins ne s'affiche pas tant que les deux sont vides.
    ga4Id: '',        // ex. 'G-XXXXXXXXXX'
    metaPixelId: ''   // ex. '123456789012345'
  };

  var WH = window.WH = window.WH || {};
  WH.config = CONFIG;

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && matchMedia('(pointer: fine)').matches;

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function sstore(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }

  /* ── Langue ── */
  WH.lang = function () { return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'fr'; };
  WH.t = function (fr, en) { return WH.lang() === 'en' ? en : fr; };
  function bi(fr, en) { return '<span lang="fr">' + fr + '</span><span lang="en">' + en + '</span>'; }
  WH.bi = bi;

  var nfCache = {};
  WH.money = function (n) {
    var l = WH.lang();
    if (!nfCache[l]) nfCache[l] = new Intl.NumberFormat(l === 'en' ? 'en-CA' : 'fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
    return nfCache[l].format(Math.round(n || 0));
  };
  WH.moneyShort = function (n) {
    var l = WH.lang(), a = Math.abs(n), s;
    if (a >= 1e6) s = (n / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace('.0', '') + (l === 'en' ? 'M' : ' M');
    else if (a >= 1e3) s = Math.round(n / 1e3) + (l === 'en' ? 'k' : ' k');
    else s = String(Math.round(n));
    if (l === 'en') return '$' + s;
    return s.replace('.', ',') + ' $';
  };
  WH.num = function (n) { return new Intl.NumberFormat(WH.lang() === 'en' ? 'en-CA' : 'fr-CA', { maximumFractionDigits: 0 }).format(Math.round(n)); };

  function setLang(l) {
    l = l === 'en' ? 'en' : 'fr';
    var html = document.documentElement;
    html.setAttribute('data-lang', l);
    html.lang = l;
    store('wh-lang', l);
    document.querySelectorAll('[data-ph-fr]').forEach(function (el) { el.placeholder = el.getAttribute('data-ph-' + l); });
    document.querySelectorAll('[data-aria-fr]').forEach(function (el) { el.setAttribute('aria-label', el.getAttribute('data-aria-' + l)); });
    document.querySelectorAll('[data-txt-fr]').forEach(function (el) { el.textContent = el.getAttribute('data-txt-' + l); });
    var t = html.getAttribute('data-title-' + l);
    if (t) document.title = t;
    document.querySelectorAll('.lang-toggle button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-l') === l); b.setAttribute('aria-pressed', b.getAttribute('data-l') === l); });
    nfCache = {};
    document.dispatchEvent(new CustomEvent('wh:lang', { detail: l }));
  }
  WH.setLang = setLang;

  /* ── Logo (monogramme losange + W + joyau) ── */
  WH.logo = function (cls) {
    return '<svg class="' + cls + '" viewBox="0 0 40 40" fill="none" aria-hidden="true">' +
      '<path class="d" d="M20 2 L38 20 L20 38 L2 20 Z" stroke="#C9A84C" stroke-width="1"/>' +
      '<path class="w" d="M11 14 L15.5 27 L20 17.5 L24.5 27 L29 14" stroke="#C9A84C" stroke-width="1.5" stroke-linejoin="miter" stroke-linecap="square"/>' +
      '<rect class="j" x="18.4" y="2.9" width="3.2" height="3.2" fill="#DDBE68" transform="rotate(45 20 4.5)"/></svg>';
  };

  /* ==========================================================================
     INTRO — s'exécute immédiatement
     ========================================================================== */
  var introTotal = 0;
  (function buildIntro() {
    if (!document.body) return;
    // Version complète seulement à la toute première visite ; version courte ensuite
    var quick = store('wh-intro') === '1' || sstore('wh-seen') === '1';
    store('wh-intro', '1'); sstore('wh-seen', '1');
    var word = 'W HÉRITAGE', letters = '';
    for (var i = 0; i < word.length; i++) {
      var ch = word[i];
      letters += '<span style="--i:' + i + '"' + (i > 1 ? ' class="g"' : '') + '>' + (ch === ' ' ? '&nbsp;' : ch) + '</span>';
    }
    var el = document.createElement('div');
    el.id = 'intro';
    if (quick) el.className = 'quick';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="intro-panel top"></div><div class="intro-panel bot"></div>' +
      '<div class="intro-center">' + WH.logo('intro-mark') +
      '<div class="intro-name">' + letters + '</div><div class="intro-rule"></div>' +
      '<div class="intro-sub">Walid Harchaoui · CSF</div></div>';
    document.body.insertBefore(el, document.body.firstChild);
    document.documentElement.style.overflow = 'hidden';

    introTotal = reduce ? 150 : (quick ? 800 : 1900);
    setTimeout(function () { el.classList.add('done'); }, introTotal);
    setTimeout(function () {
      el.classList.add('open');
      document.documentElement.style.overflow = '';
      document.documentElement.classList.add('ready');
      document.documentElement.classList.add('wh-ready');
      document.dispatchEvent(new CustomEvent('wh:ready'));
    }, introTotal + 260);
    setTimeout(function () { el.classList.add('gone'); }, introTotal + 1500);
  })();

  /* ==========================================================================
     CHROME PARTAGÉ — nav, menu mobile, pied de page, pastille auto/habitation
     ========================================================================== */
  var NAV = [
    { href: 'a-propos.html', key: 'about', fr: 'À propos', en: 'About' },
    { href: 'index.html#pour-qui', key: 'pourqui', fr: 'Pour qui', en: 'Who I help' },
    { href: 'index.html#expertise', key: 'expertise', fr: 'Expertise', en: 'Expertise' },
    { href: 'processus.html', key: 'processus', fr: 'Approche', en: 'Approach' }
  ];
  var RES = [
    { href: 'ressources.html', key: 'ressources', fr: 'Articles et ressources', en: 'Articles &amp; resources' },
    { href: 'index.html#guide', key: 'guide', fr: 'Guide — L\'Empire Blindé', en: 'Guide — The Armored Empire' },
    { href: 'calculateur.html', key: 'calc', fr: 'Simulateur d\'épargne', en: 'Savings simulator' },
    { href: 'calculateur.html#besoin', key: 'besoin', fr: 'Besoin en assurance vie', en: 'Life insurance needs' },
    { href: 'vie-participative.html', key: 'par', fr: 'Vie participative', en: 'Participating life' }
  ];
  var LINKEDIN = 'https://ca.linkedin.com/in/walidhcsf/en';

  function buildChrome() {
    var page = document.body.getAttribute('data-page') || '';
    var resActive = page === 'calc' || page === 'par' || page === 'ressources' || page === 'article';
    var linksHtml = NAV.map(function (n) {
      return '<li><a href="' + n.href + '"' + (n.key === page ? ' class="active" aria-current="page"' : '') + '>' + bi(n.fr, n.en) + '</a></li>';
    }).join('') +
      '<li class="has-sub"><button type="button" class="sub-toggle' + (resActive ? ' active' : '') + '" aria-expanded="false" aria-haspopup="true">' + bi('Ressources', 'Resources') +
        '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5"/></svg></button>' +
        '<ul class="sub">' + RES.map(function (n) {
          return '<li><a href="' + n.href + '"' + (n.key === page ? ' aria-current="page"' : '') + '>' + bi(n.fr, n.en) + '</a></li>';
        }).join('') + '</ul></li>';

    var top = document.createElement('div');
    top.innerHTML =
      '<a class="skip-link" href="#main">' + bi('Aller au contenu', 'Skip to content') + '</a>' +
      '<div id="scroll-progress"></div>' +
      '<nav class="nav" id="nav" aria-label="Navigation">' +
        '<a href="index.html" class="logo" aria-label="W Héritage — accueil">' + WH.logo('logo-mark') +
          '<span class="logo-text">W <b>Héritage</b><small>Walid Harchaoui · CSF</small></span></a>' +
        '<ul class="nav-links">' + linksHtml + '</ul>' +
        '<div class="nav-right">' +
          '<div class="lang-toggle" role="group" aria-label="Langue / Language"><button data-l="fr" type="button">FR</button><button data-l="en" type="button">EN</button></div>' +
          '<a href="index.html#reservation" class="nav-cta">' + bi('Réserver<span class="cta-x"> une consultation</span>', 'Book<span class="cta-x"> a consultation</span>') + '</a>' +
          '<button class="hamburger" id="hamburger" type="button" data-aria-fr="Ouvrir le menu" data-aria-en="Open menu" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="mobileMenu"><span></span><span></span><span></span></button>' +
        '</div>' +
      '</nav>' +
      '<div class="mobile-menu" id="mobileMenu">' +
        '<a href="index.html">' + bi('Accueil', 'Home') + '</a>' +
        NAV.map(function (n) { return '<a href="' + n.href + '">' + bi(n.fr, n.en) + '</a>'; }).join('') +
        '<div class="mm-res"><span class="mm-label">' + bi('Ressources', 'Resources') + '</span>' +
          RES.map(function (n) { return '<a href="' + n.href + '" class="mm-small">' + bi(n.fr, n.en) + '</a>'; }).join('') + '</div>' +
        '<a href="index.html#reservation" class="btn btn-gold mm-cta">' + bi('Réserver une consultation', 'Book a consultation') + '</a>' +
      '</div>';
    var intro = document.getElementById('intro');
    var ref = intro ? intro.nextSibling : document.body.firstChild;
    while (top.firstChild) document.body.insertBefore(top.firstChild, ref);

    // Cible du lien d'évitement : premier bloc de contenu après la navigation
    if (!document.getElementById('main')) {
      var first = document.querySelector('body > header, body > main, body > section');
      if (first) { first.id = first.id || 'main'; if (first.id !== 'main') { var a = document.createElement('span'); a.id = 'main'; first.parentNode.insertBefore(a, first); } }
    }
    var mainEl = document.getElementById('main'); if (mainEl) mainEl.setAttribute('tabindex', '-1');

    var yr = new Date().getFullYear();
    var foot = document.createElement('footer');
    foot.className = 'footer';
    foot.innerHTML =
      '<div class="footer-grid">' +
        '<div class="footer-brand"><a href="index.html" class="logo" aria-label="W Héritage — accueil">' + WH.logo('logo-mark') + '<span class="logo-text">W <b>Héritage</b></span></a>' +
          '<p class="fb-id"><b>Walid Harchaoui, CSF</b>' + bi('Conseiller en sécurité financière', 'Financial security advisor') + '<span>Québec · Ontario</span></p>' +
          '<p>' + bi('Protéger ce que vous construisez. Préparer ce que vous transmettrez.', 'Protect what you build. Prepare what you will pass on.') + '</p></div>' +
        '<div><h4>' + bi('Explorer', 'Explore') + '</h4><ul>' +
          '<li><a href="index.html">' + bi('Accueil', 'Home') + '</a></li>' +
          '<li><a href="a-propos.html">' + bi('À propos', 'About') + '</a></li>' +
          '<li><a href="index.html#pour-qui">' + bi('Pour qui', 'Who I help') + '</a></li>' +
          '<li><a href="index.html#expertise">Expertise</a></li>' +
          '<li><a href="processus.html">' + bi('Approche', 'Approach') + '</a></li>' +
          '<li><a href="index.html#reservation">' + bi('Consultation', 'Consultation') + '</a></li></ul></div>' +
        '<div><h4>' + bi('Ressources', 'Resources') + '</h4><ul>' +
          RES.map(function (n) { return '<li><a href="' + n.href + '">' + bi(n.fr, n.en) + '</a></li>'; }).join('') +
          '<li><a href="' + CONFIG.quoteAutoUrl + '" target="_blank" rel="noopener">' + bi('Soumission auto', 'Auto insurance quote') + '</a></li>' +
          '<li><a href="' + CONFIG.quoteHomeUrl + '" target="_blank" rel="noopener">' + bi('Soumission habitation', 'Home insurance quote') + '</a></li></ul></div>' +
        '<div><h4>Contact</h4><ul>' +
          '<li><a href="tel:' + CONFIG.tel + '">' + CONFIG.phone + '</a></li>' +
          '<li><a href="mailto:' + CONFIG.email + '">' + CONFIG.email + '</a></li>' +
          '<li><a href="' + CONFIG.instagram + '" target="_blank" rel="noopener">Instagram</a></li>' +
          '<li><a href="' + LINKEDIN + '" target="_blank" rel="noopener">LinkedIn</a></li>' +
          '<li><a href="index.html#reservation">' + bi('Réserver une consultation', 'Book a consultation') + '</a></li></ul></div>' +
      '</div>' +
      '<div class="footer-legal">' +
        '<p>' + bi('Walid Harchaoui est conseiller en sécurité financière, inscrit auprès de l\'Autorité des marchés financiers (AMF) et rattaché au cabinet Industrielle Alliance, Assurance et services financiers inc. Autorisé en Ontario par l\'Autorité ontarienne de réglementation des services financiers (ARSF). Le contenu de ce site est fourni à titre informatif seulement et ne constitue pas un conseil financier, fiscal ou juridique personnalisé.',
                   'Walid Harchaoui is a financial security advisor registered with the Autorité des marchés financiers (AMF) and attached to the firm Industrielle Alliance, Assurance et services financiers inc. Licensed in Ontario by the Financial Services Regulatory Authority of Ontario (FSRA). The content of this site is for information only and does not constitute personalized financial, tax or legal advice.') + '</p>' +
      '</div>' +
      '<div class="footer-bottom">' +
        '<span>© ' + yr + ' W Héritage — Walid Harchaoui, CSF</span>' +
        '<span class="fl-links"><a href="confidentialite.html">' + bi('Confidentialité', 'Privacy') + '</a> · <a href="conditions.html">' + bi('Conditions d\'utilisation', 'Terms of use') + '</a> · <a href="conditions.html#divulgations">' + bi('Avis et divulgations', 'Notices &amp; disclosures') + '</a> · <button type="button" class="fl-consent" data-consent-open>' + bi('Préférences de témoins', 'Cookie preferences') + '</button></span>' +
        '<span><a href="https://lautorite.qc.ca" target="_blank" rel="noopener">AMF</a> · <a href="https://www.fsrao.ca" target="_blank" rel="noopener">' + bi('ARSF', 'FSRA') + '</a> · <a href="https://www.chambresf.com" target="_blank" rel="noopener">' + bi('Chambre de la sécurité financière', 'Chambre de la sécurité financière') + '</a></span>' +
      '</div>';
    document.body.appendChild(foot);

    var lastY = window.scrollY;
    function tuckOnScroll(el) {
      window.addEventListener('scroll', function () {
        var y = window.scrollY, dy = y - lastY;
        if (Math.abs(dy) > 6) { el.classList.toggle('tuck', dy > 0 && y > 300); }
      }, { passive: true });
    }
    window.addEventListener('scroll', function () { var y = window.scrollY; if (Math.abs(y - lastY) > 6) lastY = y; }, { passive: true });

    // Ordinateur : pastille auto/habitation discrète
    if (!sstore('wh-qp-x') && !document.body.hasAttribute('data-no-pill')) {
      var pill = document.createElement('div');
      pill.className = 'quote-pill';
      pill.innerHTML = '<span class="qp-ico"><svg viewBox="0 0 16 16"><path d="M2 10.5 3.6 6.4A1.5 1.5 0 0 1 5 5.5h6a1.5 1.5 0 0 1 1.4.9L14 10.5v2.5h-2v-1.2H4V13H2z"/><circle cx="4.8" cy="10.3" r=".8"/><circle cx="11.2" cy="10.3" r=".8"/></svg></span>' +
        '<span><b>' + bi('Soumission', 'Get a quote') + '</b><small>' + bi('En quelques minutes', 'In a few minutes') + '</small></span>' +
        '<a class="qp-go" href="' + CONFIG.quoteAutoUrl + '" target="_blank" rel="noopener">Auto</a>' +
        '<a class="qp-go" href="' + CONFIG.quoteHomeUrl + '" target="_blank" rel="noopener">' + bi('Habitation', 'Home') + '</a>' +
        '<button class="qp-x" type="button" data-aria-fr="Fermer" data-aria-en="Close" aria-label="Fermer">×</button>';
      document.body.appendChild(pill);
      pill.querySelector('.qp-x').addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        pill.classList.remove('show'); sstore('wh-qp-x', '1');
        setTimeout(function () { pill.remove(); }, 800);
      });
      document.addEventListener('wh:ready', function () { setTimeout(function () { pill.classList.add('show'); }, 2200); });
      tuckOnScroll(pill);
    }

    // Mobile : bouton de réservation collant (masqué près des sections de réservation et du pied de page)
    if (!document.body.hasAttribute('data-no-bookbar')) {
      var bar = document.createElement('div');
      bar.className = 'book-bar';
      bar.innerHTML = '<a href="index.html#reservation" class="btn btn-gold">' + bi('Réserver une consultation', 'Book a consultation') + '<svg viewBox="0 0 14 14"><path d="M2 7h10M8 3l4 4-4 4"/></svg></a>';
      document.body.appendChild(bar);
      var hideFor = [].slice.call(document.querySelectorAll('#reservation, #contact, .footer, .page-hero, body > header'));
      var visible = {};
      if ('IntersectionObserver' in window) {
        var bio = new IntersectionObserver(function (en) {
          en.forEach(function (x) { visible[hideFor.indexOf(x.target)] = x.isIntersecting; });
          var block = Object.keys(visible).some(function (k) { return visible[k]; });
          bar.classList.toggle('show', !block && window.scrollY > 200);
        }, { threshold: 0 });
        hideFor.forEach(function (el) { bio.observe(el); });
        window.addEventListener('scroll', function () {
          var block = Object.keys(visible).some(function (k) { return visible[k]; });
          bar.classList.toggle('show', !block && window.scrollY > 200);
        }, { passive: true });
      }
    }

    var curtain = document.createElement('div');
    curtain.id = 'curtain';
    curtain.innerHTML = '<div class="c-panel top"></div><div class="c-panel bot"></div>' + WH.logo('c-mark');
    document.body.appendChild(curtain);

    if (finePointer && !reduce) {
      var ring = document.createElement('div'); ring.className = 'cursor-ring';
      var dot = document.createElement('div'); dot.className = 'cursor-dot';
      document.body.appendChild(ring); document.body.appendChild(dot);
      var mx = -100, my = -100, rx = -100, ry = -100, started = false;
      window.addEventListener('mousemove', function (e) {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
        if (!started) { started = true; rx = mx; ry = my; document.body.classList.add('has-cursor'); loop(); }
      }, { passive: true });
      document.addEventListener('mouseleave', function () { document.body.classList.remove('has-cursor'); });
      document.addEventListener('mouseenter', function () { if (started) document.body.classList.add('has-cursor'); });
      function loop() {
        rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
        ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) rotate(45deg)';
        requestAnimationFrame(loop);
      }
      document.addEventListener('mouseover', function (e) {
        var hit = e.target.closest && e.target.closest('a, button, input, select, textarea, label, .spot, [data-hover]');
        document.body.classList.toggle('cursor-hover', !!hit);
      });
    }
  }

  /* ==========================================================================
     COMPORTEMENTS
     ========================================================================== */
  function initNav() {
    var nav = document.getElementById('nav');
    var bar = document.getElementById('scroll-progress');
    var ticking = false;
    function onScroll() {
      var y = window.scrollY;
      nav.classList.toggle('scrolled', y > 40);
      var total = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (total > 0 ? (y / total) * 100 : 0) + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    var ham = document.getElementById('hamburger'), menu = document.getElementById('mobileMenu');
    function close() { menu.classList.remove('open'); ham.classList.remove('open'); ham.setAttribute('aria-expanded', 'false'); document.documentElement.style.overflow = ''; }
    ham.addEventListener('click', function () {
      var open = !menu.classList.contains('open');
      menu.classList.toggle('open', open); ham.classList.toggle('open', open);
      ham.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.documentElement.style.overflow = open ? 'hidden' : '';
    });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    document.querySelectorAll('.lang-toggle button').forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-l')); });
    });

    // Menu « Ressources » : survol à la souris, clic ou clavier
    document.querySelectorAll('.has-sub').forEach(function (li) {
      var btn = li.querySelector('.sub-toggle');
      function set(open) { li.classList.toggle('open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
      btn.addEventListener('click', function (e) { e.stopPropagation(); set(!li.classList.contains('open')); });
      li.addEventListener('mouseenter', function () { if (finePointer) set(true); });
      li.addEventListener('mouseleave', function () { if (finePointer) set(false); });
      li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) set(false); });
      document.addEventListener('click', function (e) { if (!li.contains(e.target)) set(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && li.classList.contains('open')) { set(false); btn.focus(); } });
    });
  }

  /* Transition de sortie vers une autre page du site */
  function initTransitions() {
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      var here = location.pathname.replace(/index\.html$/, '').replace(/\.html$/, '');
      var there = url.pathname.replace(/index\.html$/, '').replace(/\.html$/, '');
      if (there === here && url.hash) return; // ancre sur la même page
      if (reduce) return;
      e.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(function () { location.href = url.href; }, 560);
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) document.body.classList.remove('leaving'); });
  }

  /* Texte fractionné mot par mot (garde <em>, <br>, <span lang>) */
  function splitText(root) {
    var idx = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var parts = ch.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var inner = document.createElement('span'); inner.textContent = p; inner.style.setProperty('--i', idx++);
            w.appendChild(inner); frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') {
          walk(ch);
        }
      });
    }
    walk(root);
  }

  function initReveals() {
    document.querySelectorAll('.split').forEach(splitText);
    var sel = '.reveal, .reveal-l, .reveal-r, .clip-reveal, .split, .draw-line, [data-count], [data-stagger]';
    var els = document.querySelectorAll(sel);
    if (!('IntersectionObserver' in window)) { els.forEach(show); return; }
    // Un élément masqué par clip-path n'« intersecte » jamais : on observe son parent à sa place
    var proxies = new Map();
    function tgt(el) {
      if (!el.classList.contains('clip-reveal') || !el.parentElement) return el;
      var p = el.parentElement;
      if (!proxies.has(p)) proxies.set(p, []);
      if (proxies.get(p).indexOf(el) < 0) proxies.get(p).push(el);
      return p;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var list = proxies.get(en.target);
        if (list) list.forEach(show);
        if (en.target.matches(sel)) show(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    var started = false;
    function start() { started = true; els.forEach(function (el) { io.observe(tgt(el)); }); }
    if (document.documentElement.classList.contains('ready')) start();
    else document.addEventListener('wh:ready', start);
    // Les éléments de l'autre langue étaient masqués : on les réobserve au changement de langue
    document.addEventListener('wh:lang', function () {
      if (!started) return;
      els.forEach(function (el) { if (!el.classList.contains('in')) { var t = tgt(el); io.unobserve(t); io.observe(t); } });
    });
    WH.observeReveal = function (el) { io.observe(el); };
  }
  function show(el) {
    el.classList.add('in');
    if (el.hasAttribute('data-stagger')) {
      Array.prototype.forEach.call(el.children, function (c, i) { c.style.setProperty('--d', (i * 0.09).toFixed(2)); c.classList.add('in'); });
    }
    if (el.hasAttribute('data-count')) countUp(el);
  }
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count')), dec = (el.getAttribute('data-count').split('.')[1] || '').length;
    var pre = el.getAttribute('data-prefix') || '', suf = el.getAttribute('data-suffix') || '';
    var dur = reduce ? 1 : 1800, t0 = performance.now();
    function f(t) {
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = pre + (target * e).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  }

  /* Projecteur doré sur cartes + boutons magnétiques */
  function initPointerFx() {
    document.addEventListener('pointermove', function (e) {
      var s = e.target.closest && e.target.closest('.spot');
      if (s) { var r = s.getBoundingClientRect(); s.style.setProperty('--mx', (e.clientX - r.left) + 'px'); s.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
    }, { passive: true });
    if (!finePointer || reduce) return;
    document.querySelectorAll('.btn, .nav-cta').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / r.width, y = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.transform = 'translate(' + (x * 8).toFixed(1) + 'px,' + (y * 6).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* Parallaxe légère : data-parallax="0.15" */
  function initParallax() {
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    if (!els.length || reduce) return;
    var ticking = false;
    function upd() {
      var vh = innerHeight;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var sp = parseFloat(el.getAttribute('data-parallax')) || 0.1;
        var off = (r.top + r.height / 2 - vh / 2) * -sp;
        el.style.translate = '0 ' + off.toFixed(1) + 'px';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* Poussière d'or animée (canvas.dust) */
  function initDust() {
    document.querySelectorAll('canvas.dust').forEach(function (cv) {
      var ctx = cv.getContext('2d'), parts = [], w, h, dpr = Math.min(2, devicePixelRatio || 1), running = true, raf;
      function size() {
        w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var n = Math.round(Math.min(70, w / 18));
        parts = [];
        for (var i = 0; i < n; i++) parts.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.3 + .3, vy: -(Math.random() * .18 + .04), vx: (Math.random() - .5) * .08, a: Math.random() * .5 + .15, ph: Math.random() * 6.28 });
      }
      function frame(t) {
        ctx.clearRect(0, 0, w, h);
        parts.forEach(function (p) {
          p.x += p.vx; p.y += p.vy;
          if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
          var tw = p.a * (0.6 + 0.4 * Math.sin(t / 900 + p.ph));
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
          ctx.fillStyle = 'rgba(221,190,104,' + tw.toFixed(3) + ')'; ctx.fill();
        });
        if (running) raf = requestAnimationFrame(frame);
      }
      size(); window.addEventListener('resize', size);
      if (reduce) { frame(0); running = false; return; }
      new IntersectionObserver(function (en) {
        running = en[0].isIntersecting;
        if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
      }).observe(cv);
    });
  }

  /* Iframes chargées à l'approche (data-src) */
  function initLazyFrames() {
    var frames = document.querySelectorAll('iframe[data-src]');
    if (!frames.length) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.src = e.target.getAttribute('data-src'); e.target.removeAttribute('data-src'); io.unobserve(e.target); } });
    }, { rootMargin: '400px 0px' });
    frames.forEach(function (f) { io.observe(f); });
  }

  /* Emplacements vidéo : data-video = lien YouTube, Vimeo, Instagram ou .mp4 */
  WH.embedUrl = function (u) {
    if (!u) return null;
    var m;
    if ((m = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/))) return { type: 'iframe', src: 'https://www.youtube-nocookie.com/embed/' + m[1] + '?autoplay=1&rel=0&modestbranding=1' };
    if ((m = u.match(/vimeo\.com\/(\d+)/))) return { type: 'iframe', src: 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1&title=0&byline=0' };
    if ((m = u.match(/instagram\.com\/(?:reel|p)\/([\w-]+)/))) return { type: 'iframe', src: 'https://www.instagram.com/reel/' + m[1] + '/embed/' };
    if (/\.(mp4|webm|mov)(\?|$)/i.test(u)) return { type: 'video', src: u };
    return null;
  };
  function initVideoSlots() {
    document.querySelectorAll('.video-slot').forEach(function (slot) {
      var e = WH.embedUrl(slot.getAttribute('data-video'));
      if (!e) { slot.classList.add('empty'); return; }
      slot.classList.add('ready');
      slot.addEventListener('click', function () {
        if (slot.classList.contains('playing')) return;
        slot.classList.add('playing');
        var node;
        if (e.type === 'video') { node = document.createElement('video'); node.src = e.src; node.controls = true; node.autoplay = true; node.playsInline = true; }
        else { node = document.createElement('iframe'); node.src = e.src; node.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media'; node.allowFullscreen = true; node.title = 'Vidéo'; }
        slot.appendChild(node);
      });
    });
  }

  /* Remplissage visuel des curseurs de plage */
  WH.paintRange = function (r) {
    var p = ((r.value - r.min) / (r.max - r.min)) * 100;
    r.style.setProperty('--p', p + '%');
  };
  function initRanges() {
    document.querySelectorAll('input[type="range"]').forEach(function (r) {
      WH.paintRange(r);
      r.addEventListener('input', function () { WH.paintRange(r); });
    });
  }

  /* ── Témoins (Loi 25) : consentement explicite avant toute mesure ou publicité ──
     Choix conservé 13 mois dans le navigateur. Les scripts Google Analytics et Meta
     ne sont chargés qu'après un « oui » pour leur catégorie. */
  var CONSENT_KEY = 'wh-consent', CONSENT_V = 1, CONSENT_TTL = 1000 * 60 * 60 * 24 * 395;
  var consent = null, loaded = { a: false, m: false }, queue = [];
  function readConsent() {
    try {
      var c = JSON.parse(store(CONSENT_KEY) || 'null');
      if (c && c.v === CONSENT_V && (Date.now() - new Date(c.t).getTime()) < CONSENT_TTL) return c;
    } catch (e) {}
    return null;
  }
  function trackersConfigured() { return !!(CONFIG.ga4Id || CONFIG.metaPixelId); }
  function loadScript(src) { var sc = document.createElement('script'); sc.async = true; sc.src = src; document.head.appendChild(sc); }
  function loadAnalytics() {
    if (loaded.a || !CONFIG.ga4Id) return; loaded.a = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    gtag('js', new Date());
    gtag('config', CONFIG.ga4Id);
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CONFIG.ga4Id));
  }
  function loadPixel() {
    if (loaded.m || !CONFIG.metaPixelId) return; loaded.m = true;
    var f = window, n;
    n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', CONFIG.metaPixelId);
    fbq('track', 'PageView');
  }
  function applyConsent() {
    if (!consent) return;
    if (consent.a) loadAnalytics();
    if (consent.m) loadPixel();
    queue.splice(0).forEach(function (q) { WH.track(q[0], q[1]); });
  }
  function clearTrackerCookies() {
    document.cookie.split(';').forEach(function (c) {
      var k = c.split('=')[0].trim();
      if (/^(_ga|_gid|_gat|_fbp|_fbc)/.test(k)) {
        var host = location.hostname, parts = host.split('.');
        for (var i = 0; i < parts.length - 1; i++) {
          document.cookie = k + '=; Max-Age=0; path=/; domain=.' + parts.slice(i).join('.');
        }
        document.cookie = k + '=; Max-Age=0; path=/';
      }
    });
  }
  function saveConsent(a, m) {
    var had = consent;
    consent = { v: CONSENT_V, a: !!a, m: !!m, t: new Date().toISOString() };
    store(CONSENT_KEY, JSON.stringify(consent));
    closeBanner();
    // Retrait d'un consentement déjà donné : on efface les témoins et on recharge sans les scripts.
    if (had && ((had.a && !consent.a) || (had.m && !consent.m))) { clearTrackerCookies(); location.reload(); return; }
    applyConsent();
  }

  /* Événements : envoyés seulement si la catégorie correspondante a été acceptée.
     ga = nom Google Analytics, meta = événement standard Meta (ou personnalisé si custom: true). */
  var EVENTS = {
    guide_lead:     { ga: 'generate_lead', meta: 'Lead', p: { form: 'guide' } },
    contact_sent:   { ga: 'generate_lead', meta: 'Contact', p: { form: 'contact' } },
    booking_click:  { ga: 'clic_reservation', meta: 'ClicReservation', custom: true },
    quote_click:    { ga: 'clic_soumission', meta: 'ClicSoumission', custom: true },
    calc_used:      { ga: 'utilisation_calculateur', meta: 'UtilisationCalculateur', custom: true },
    phone_click:    { ga: 'clic_telephone', meta: 'Contact', p: { method: 'phone' } }
  };
  WH.track = function (name, params) {
    var ev = EVENTS[name]; if (!ev) return;
    if (!consent) { if (trackersConfigured()) queue.push([name, params]); return; }
    var p = {}, k;
    for (k in (ev.p || {})) p[k] = ev.p[k];
    for (k in (params || {})) p[k] = params[k];
    p.langue = WH.lang();
    if (consent.a && window.gtag) gtag('event', ev.ga, p);
    if (consent.m && window.fbq) fbq(ev.custom ? 'trackCustom' : 'track', ev.meta, p);
  };
  WH.consent = function () { return consent; };

  var banner = null;
  function buildBanner() {
    banner = document.createElement('div');
    banner.className = 'consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-labelledby', 'cb-title');
    banner.innerHTML =
      '<p class="cb-title" id="cb-title">' + bi('Vos choix de témoins', 'Your cookie choices') + '</p>' +
      '<p class="cb-text">' + bi(
        'Ce site utilise des témoins de mesure d\'audience et de publicité seulement si vous les acceptez. Ils m\'aident à savoir quelles pages vous sont utiles et à vous montrer du contenu pertinent sur Instagram et Facebook. Refuser ne change rien à votre navigation.',
        'This site only uses analytics and advertising cookies if you accept them. They help me see which pages are useful to you and show you relevant content on Instagram and Facebook. Declining changes nothing about your browsing.') +
      ' <a href="confidentialite.html#temoins">' + bi('Politique de confidentialité', 'Privacy policy') + '</a></p>' +
      '<div class="cb-prefs" hidden>' +
        '<label class="cb-row"><input type="checkbox" checked disabled><span><b>' + bi('Essentiels', 'Essential') + '</b><small>' + bi('Toujours actifs. Langue, préférences d\'affichage et sécurité du site.', 'Always on. Language, display preferences and site security.') + '</small></span></label>' +
        '<label class="cb-row"><input type="checkbox" data-c="a"><span><b>' + bi('Mesure d\'audience', 'Analytics') + '</b><small>' + bi('Google Analytics : pages consultées, provenance des visites, de façon agrégée.', 'Google Analytics: pages viewed and where visits come from, in aggregate.') + '</small></span></label>' +
        '<label class="cb-row"><input type="checkbox" data-c="m"><span><b>' + bi('Publicité', 'Advertising') + '</b><small>' + bi('Meta Pixel : mesurer mes publicités et vous montrer du contenu pertinent sur Instagram et Facebook.', 'Meta Pixel: measure my ads and show you relevant content on Instagram and Facebook.') + '</small></span></label>' +
      '</div>' +
      '<div class="cb-actions">' +
        '<button type="button" class="cb-btn" data-cb="refuse">' + bi('Tout refuser', 'Decline all') + '</button>' +
        '<button type="button" class="cb-btn" data-cb="accept">' + bi('Tout accepter', 'Accept all') + '</button>' +
        '<button type="button" class="cb-link" data-cb="custom">' + bi('Personnaliser', 'Customize') + '</button>' +
        '<button type="button" class="cb-btn cb-save" data-cb="save" hidden>' + bi('Enregistrer mes choix', 'Save my choices') + '</button>' +
      '</div>';
    document.body.appendChild(banner);
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cb]'); if (!b) return;
      var act = b.getAttribute('data-cb');
      if (act === 'refuse') saveConsent(false, false);
      else if (act === 'accept') saveConsent(true, true);
      else if (act === 'custom') {
        banner.querySelector('.cb-prefs').hidden = false;
        b.hidden = true; banner.querySelector('.cb-save').hidden = false;
        banner.querySelector('[data-c="a"]').focus();
      } else if (act === 'save') {
        saveConsent(banner.querySelector('[data-c="a"]').checked, banner.querySelector('[data-c="m"]').checked);
      }
    });
    banner.addEventListener('keydown', function (e) { if (e.key === 'Escape' && consent) closeBanner(); });
  }
  function openBanner(showPrefs) {
    if (!banner) buildBanner();
    var c = consent || { a: false, m: false };
    banner.querySelector('[data-c="a"]').checked = !!c.a;
    banner.querySelector('[data-c="m"]').checked = !!c.m;
    banner.querySelector('.cb-prefs').hidden = !showPrefs;
    banner.querySelector('[data-cb="custom"]').hidden = !!showPrefs;
    banner.querySelector('.cb-save').hidden = !showPrefs;
    document.documentElement.classList.add('consent-open');
    requestAnimationFrame(function () { banner.classList.add('show'); });
    if (showPrefs) setTimeout(function () { var f = banner.querySelector('[data-c="a"]'); if (f) f.focus({ preventScroll: true }); }, 450);
  }
  function closeBanner() {
    if (!banner) return;
    banner.classList.remove('show');
    document.documentElement.classList.remove('consent-open');
  }
  function initConsent() {
    consent = readConsent();
    var preview = /[?&]consent=preview/.test(location.search);
    document.addEventListener('click', function (e) {
      var o = e.target.closest('[data-consent-open]');
      if (o) { e.preventDefault(); openBanner(true); return; }
      var a = e.target.closest('a[href]'); if (!a) return;
      var h = a.getAttribute('href');
      if (/cal\.com|#reservation/.test(h)) WH.track('booking_click', { lien: a.textContent.trim().slice(0, 60) });
      else if (/assurance\.ia\.ca/.test(h)) WH.track('quote_click', { type: /habitation/.test(h) ? 'habitation' : 'auto' });
      else if (/^tel:/.test(h)) WH.track('phone_click');
    });
    var calcSeen = {};
    document.addEventListener('input', function (e) {
      var t = e.target.closest && e.target.closest('#epargne, #besoin, #simulation');
      if (t && !calcSeen[t.id]) { calcSeen[t.id] = 1; WH.track('calc_used', { outil: t.id }); }
    });
    if (consent) applyConsent();
    else if (trackersConfigured() || preview) {
      var show = function () { setTimeout(function () { openBanner(false); }, 900); };
      if (document.documentElement.classList.contains('wh-ready') || !document.querySelector('.intro')) show();
      else document.addEventListener('wh:ready', show);
    }
  }

  function onReady() {
    buildChrome();
    initConsent();
    initNav();
    setLang(document.documentElement.getAttribute('data-lang') || 'fr');
    initTransitions();
    initReveals();
    initPointerFx();
    initParallax();
    initDust();
    initLazyFrames();
    initVideoSlots();
    initRanges();
    document.dispatchEvent(new CustomEvent('wh:init'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();
