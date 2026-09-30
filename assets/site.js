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
    instagram: 'https://www.instagram.com/walidh.csf'
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
    var quick = sstore('wh-seen') === '1';
    sstore('wh-seen', '1');
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

    introTotal = reduce ? 150 : (quick ? 1150 : 2350);
    setTimeout(function () { el.classList.add('done'); }, introTotal);
    setTimeout(function () {
      el.classList.add('open');
      document.documentElement.style.overflow = '';
      document.documentElement.classList.add('ready');
      document.dispatchEvent(new CustomEvent('wh:ready'));
    }, introTotal + 260);
    setTimeout(function () { el.classList.add('gone'); }, introTotal + 1500);
  })();

  /* ==========================================================================
     CHROME PARTAGÉ — nav, menu mobile, pied de page, pastille auto/habitation
     ========================================================================== */
  var NAV = [
    { href: 'index.html#services', key: 'services', fr: 'Services', en: 'Services' },
    { href: 'processus.html', key: 'processus', fr: 'La méthode', en: 'The method' },
    { href: 'vie-participative.html', key: 'par', fr: 'Vie participative', en: 'Participating life' },
    { href: 'calculateur.html', key: 'calc', fr: 'Simulateur', en: 'Simulator' },
    { href: 'a-propos.html', key: 'about', fr: 'Qui est Walid', en: 'Meet Walid' }
  ];

  function buildChrome() {
    var page = document.body.getAttribute('data-page') || '';
    var linksHtml = NAV.map(function (n) {
      return '<li><a href="' + n.href + '"' + (n.key === page ? ' class="active" aria-current="page"' : '') + '>' + bi(n.fr, n.en) + '</a></li>';
    }).join('');

    var top = document.createElement('div');
    top.innerHTML =
      '<div id="scroll-progress"></div>' +
      '<nav class="nav" id="nav" aria-label="Navigation">' +
        '<a href="index.html" class="logo" aria-label="W Héritage — accueil">' + WH.logo('logo-mark') +
          '<span class="logo-text">W <b>Héritage</b><small>Walid Harchaoui · CSF</small></span></a>' +
        '<ul class="nav-links">' + linksHtml + '</ul>' +
        '<div class="nav-right">' +
          '<div class="lang-toggle" role="group" aria-label="Langue / Language"><button data-l="fr" type="button">FR</button><button data-l="en" type="button">EN</button></div>' +
          '<a href="index.html#reservation" class="nav-cta">' + bi('Réserver', 'Book a call') + '</a>' +
          '<button class="hamburger" id="hamburger" type="button" data-aria-fr="Ouvrir le menu" data-aria-en="Open menu" aria-label="Ouvrir le menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
        '</div>' +
      '</nav>' +
      '<div class="mobile-menu" id="mobileMenu">' +
        '<a href="index.html">' + bi('Accueil', 'Home') + '</a>' +
        NAV.map(function (n) { return '<a href="' + n.href + '">' + bi(n.fr, n.en) + '</a>'; }).join('') +
        '<a href="index.html#reservation" class="mm-small">' + bi('Réserver un appel', 'Book a call') + '</a>' +
        '<a href="' + CONFIG.quoteAutoUrl + '" target="_blank" rel="noopener" class="mm-small">' + bi('Soumission auto', 'Auto quote') + '</a>' +
        '<a href="' + CONFIG.quoteHomeUrl + '" target="_blank" rel="noopener" class="mm-small">' + bi('Soumission habitation', 'Home quote') + '</a>' +
      '</div>';
    var intro = document.getElementById('intro');
    var ref = intro ? intro.nextSibling : document.body.firstChild;
    while (top.firstChild) document.body.insertBefore(top.firstChild, ref);

    var yr = new Date().getFullYear();
    var foot = document.createElement('footer');
    foot.className = 'footer';
    foot.innerHTML =
      '<div class="footer-grid">' +
        '<div class="footer-brand"><a href="index.html" class="logo">' + WH.logo('logo-mark') + '<span class="logo-text">W <b>Héritage</b><small>Walid Harchaoui · CSF</small></span></a>' +
          '<p>' + bi('Stratège, pas vendeur. Protection, structure et patrimoine pour les entrepreneurs et les familles du Québec et de l\'Ontario.',
                     'A strategist, not a salesman. Protection, structure and wealth for entrepreneurs and families in Quebec and Ontario.') + '</p></div>' +
        '<div><h4>' + bi('Explorer', 'Explore') + '</h4><ul>' +
          '<li><a href="index.html">' + bi('Accueil', 'Home') + '</a></li>' +
          '<li><a href="a-propos.html">' + bi('Qui est Walid', 'Meet Walid') + '</a></li>' +
          '<li><a href="processus.html">' + bi('La méthode', 'The method') + '</a></li>' +
          '<li><a href="index.html#services">Services</a></li>' +
          '<li><a href="index.html#guide">' + bi('Guide gratuit', 'Free guide') + '</a></li></ul></div>' +
        '<div><h4>' + bi('Outils', 'Tools') + '</h4><ul>' +
          '<li><a href="vie-participative.html">' + bi('Simulation vie participative', 'Participating life simulation') + '</a></li>' +
          '<li><a href="calculateur.html">' + bi('Simulateur d\'épargne', 'Savings simulator') + '</a></li>' +
          '<li><a href="' + CONFIG.quoteAutoUrl + '" target="_blank" rel="noopener">' + bi('Soumission auto', 'Auto insurance quote') + '</a></li>' +
          '<li><a href="' + CONFIG.quoteHomeUrl + '" target="_blank" rel="noopener">' + bi('Soumission habitation', 'Home insurance quote') + '</a></li></ul></div>' +
        '<div><h4>Contact</h4><ul>' +
          '<li><a href="tel:' + CONFIG.tel + '">' + CONFIG.phone + '</a></li>' +
          '<li><a href="mailto:' + CONFIG.email + '">' + CONFIG.email + '</a></li>' +
          '<li><a href="' + CONFIG.instagram + '" target="_blank" rel="noopener">Instagram @walidh.csf</a></li>' +
          '<li><a href="index.html#reservation">' + bi('Réserver un appel', 'Book a call') + '</a></li></ul></div>' +
      '</div>' +
      '<div class="footer-bottom">' +
        '<span>© ' + yr + ' W Héritage — Walid Harchaoui, ' + bi('conseiller en sécurité financière', 'financial security advisor') + ' · AGC — Assurance &amp; Gestion de Capital</span>' +
        '<span><a href="https://lautorite.qc.ca" target="_blank" rel="noopener">AMF</a> · <a href="https://www.fsrao.ca" target="_blank" rel="noopener">' + bi('ARSF (Ontario)', 'FSRA (Ontario)') + '</a> · <a href="https://www.chambresf.com" target="_blank" rel="noopener">' + bi('Chambre de la sécurité financière', 'Chambre de la sécurité financière') + '</a></span>' +
      '</div>';
    document.body.appendChild(foot);

    if (!sstore('wh-qp-x') && !document.body.hasAttribute('data-no-pill')) {
      var pill = document.createElement('div');
      pill.className = 'quote-pill';
      pill.innerHTML = '<span class="qp-ico"><svg viewBox="0 0 16 16"><path d="M2 10.5 3.6 6.4A1.5 1.5 0 0 1 5 5.5h6a1.5 1.5 0 0 1 1.4.9L14 10.5v2.5h-2v-1.2H4V13H2z"/><circle cx="4.8" cy="10.3" r=".8"/><circle cx="11.2" cy="10.3" r=".8"/></svg></span>' +
        '<span><b>' + bi('Soumission', 'Get a quote') + '</b><small>' + bi('En quelques minutes', 'In a few minutes') + '</small></span>' +
        '<a class="qp-go" href="' + CONFIG.quoteAutoUrl + '" target="_blank" rel="noopener">Auto</a>' +
        '<a class="qp-go" href="' + CONFIG.quoteHomeUrl + '" target="_blank" rel="noopener">' + bi('Habitation', 'Home') + '</a>' +
        '<button class="qp-x" type="button" aria-label="Fermer">×</button>';
      document.body.appendChild(pill);
      pill.querySelector('.qp-x').addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        pill.classList.remove('show'); sstore('wh-qp-x', '1');
        setTimeout(function () { pill.remove(); }, 800);
      });
      document.addEventListener('wh:ready', function () { setTimeout(function () { pill.classList.add('show'); }, 2200); });
      // se range quand on descend, revient quand on remonte
      var lastY = window.scrollY;
      window.addEventListener('scroll', function () {
        var y = window.scrollY, dy = y - lastY;
        if (Math.abs(dy) > 6) { pill.classList.toggle('tuck', dy > 0 && y > 300); lastY = y; }
      }, { passive: true });
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

  function onReady() {
    buildChrome();
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
