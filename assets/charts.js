/* ==========================================================================
   W HÉRITAGE — graphique linéaire SVG interactif (sans dépendance)
   Transitions animées entre deux jeux de données, curseur au survol, séries masquables.
   ========================================================================== */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function mk(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function niceMax(v) {
    if (!(v > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p;
    var m = n <= 1 ? 1 : n <= 1.5 ? 1.5 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 3 ? 3 : n <= 4 ? 4 : n <= 5 ? 5 : n <= 6 ? 6 : n <= 8 ? 8 : 10;
    return m * p;
  }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  /**
   * opts: {
   *   series: [{ key, color, width, dash, fill, opacity }],
   *   height, yFmt(v), xFmt(x, i), tip(i) -> html, onPick(i), markers() -> [{ i, label }]
   * }
   */
  window.WHChart = function (el, opts) {
    el.classList.add('chart');
    el.innerHTML = '';
    var svg = mk('svg', { role: 'img', 'aria-label': opts.label || 'Graphique' }, el);
    var tip = document.createElement('div'); tip.className = 'chart-tip'; el.appendChild(tip);
    var defs = mk('defs', {}, svg);
    var gGrid = mk('g', { 'class': 'grid' }, svg), gAxis = mk('g', { 'class': 'axis' }, svg);
    var gArea = mk('g', {}, svg), gMark = mk('g', {}, svg), gLines = mk('g', {}, svg), gHover = mk('g', { style: 'pointer-events:none' }, svg);
    var hit = mk('rect', { fill: 'transparent', style: 'cursor:crosshair' }, svg);
    var W = 800, H = 380, pad = { l: 66, r: 18, t: 16, b: 34 };
    var cur = null, target = null, hidden = {}, anim = null, yMax = 1, yMaxShown = 1, hoverIdx = -1;
    var paths = {}, areas = {}, dots = {};
    var vline = mk('line', { 'class': 'hover-line', y1: 0, y2: 0, opacity: 0 }, gHover);

    opts.series.forEach(function (s, k) {
      if (s.fill) {
        var gid = 'g' + Math.random().toString(36).slice(2, 8);
        var lg = mk('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
        mk('stop', { offset: '0%', 'stop-color': s.color, 'stop-opacity': s.fill }, lg);
        mk('stop', { offset: '100%', 'stop-color': s.color, 'stop-opacity': 0 }, lg);
        areas[s.key] = mk('path', { fill: 'url(#' + gid + ')', stroke: 'none' }, gArea);
      }
      paths[s.key] = mk('path', { fill: 'none', stroke: s.color, 'stroke-width': s.width || 2, 'stroke-dasharray': s.dash || 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: s.opacity || 1 }, gLines);
      dots[s.key] = mk('circle', { r: 4.5, fill: '#080808', stroke: s.color, 'stroke-width': 2, opacity: 0 }, gHover);
    });

    function size() {
      W = Math.max(280, el.clientWidth || 800);
      var hh = opts.height || 380;
      H = W < 560 ? Math.round(Math.max(250, W * 0.78)) : hh;
      pad.l = W < 560 ? 52 : 66;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('height', H);
      hit.setAttribute('x', pad.l); hit.setAttribute('y', pad.t);
      hit.setAttribute('width', W - pad.l - pad.r); hit.setAttribute('height', H - pad.t - pad.b);
      vline.setAttribute('y1', pad.t); vline.setAttribute('y2', H - pad.b);
    }
    function X(i, n) { return pad.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - pad.l - pad.r)); }
    function Y(v) { return H - pad.b - (Math.max(0, v) / yMaxShown) * (H - pad.t - pad.b); }

    function computeMax(d) {
      var m = 0;
      opts.series.forEach(function (s) { if (hidden[s.key] || !d.series[s.key]) return; d.series[s.key].forEach(function (v) { if (v > m) m = v; }); });
      return niceMax(m * 1.04);
    }

    function draw(d) {
      var n = d.x.length;
      // grille + axes
      gGrid.innerHTML = ''; gAxis.innerHTML = '';
      var steps = 4;
      for (var g = 0; g <= steps; g++) {
        var v = yMaxShown * g / steps, y = Y(v);
        mk('line', { x1: pad.l, x2: W - pad.r, y1: y, y2: y }, gGrid);
        var t = mk('text', { x: pad.l - 10, y: y + 4, 'text-anchor': 'end' }, gAxis);
        t.textContent = opts.yFmt(v);
      }
      var maxTicks = W < 560 ? 5 : 11;
      var every = Math.max(1, Math.ceil((n - 1) / (maxTicks - 1)));
      // pas « rond » (1, 2, 5, 10…)
      var niceEvery = [1, 2, 5, 10, 20, 25, 50].filter(function (s) { return s >= every; })[0] || every;
      for (var i = 0; i < n; i++) {
        if (i % niceEvery !== 0 && i !== n - 1) continue;
        if (i === n - 1 && i % niceEvery !== 0 && (n - 1) % niceEvery < niceEvery * 0.6) continue;
        var tx = mk('text', { x: X(i, n), y: H - pad.b + 20, 'text-anchor': 'middle' }, gAxis);
        tx.textContent = opts.xFmt(d.x[i], i);
      }
      // séries
      opts.series.forEach(function (s) {
        var arr = d.series[s.key];
        if (!arr || hidden[s.key]) { paths[s.key].setAttribute('d', ''); if (areas[s.key]) areas[s.key].setAttribute('d', ''); return; }
        var dd = '';
        for (var i = 0; i < arr.length; i++) dd += (i ? 'L' : 'M') + X(i, n).toFixed(1) + ' ' + Y(arr[i]).toFixed(1);
        paths[s.key].setAttribute('d', dd);
        if (areas[s.key]) areas[s.key].setAttribute('d', dd + 'L' + X(n - 1, n).toFixed(1) + ' ' + Y(0) + 'L' + X(0, n) + ' ' + Y(0) + 'Z');
      });
      // repères verticaux
      gMark.innerHTML = '';
      var ms = opts.markers ? opts.markers() : [];
      ms.sort(function (a, b) { return a.i - b.i; });
      var lastX = -1e9, row = 0;
      ms.forEach(function (m) {
        if (m.i < 0 || m.i >= n) return;
        // décale l'étiquette sur une 2e ligne si elle chevauche la précédente
        var mx0 = X(m.i, n); row = (mx0 - lastX < 110) ? (row + 1) % 2 : 0; lastX = mx0;
        var ly = pad.t + 12 + row * 15;
        var x = X(m.i, n);
        mk('line', { x1: x, x2: x, y1: pad.t + 14, y2: H - pad.b, stroke: 'rgba(201,168,76,.35)', 'stroke-dasharray': '2 4' }, gMark);
        mk('rect', { x: x - 3, y: pad.t + 5, width: 6, height: 6, fill: '#C9A84C', transform: 'rotate(45 ' + x + ' ' + (pad.t + 8) + ')' }, gMark);
        var t = mk('text', { x: x + 8, y: ly, fill: '#EAD6A2', 'font-size': 10.5, 'font-family': 'Montserrat, sans-serif', 'letter-spacing': '.06em' }, gMark);
        if (x > W - 150) { t.setAttribute('x', x - 8); t.setAttribute('text-anchor', 'end'); }
        t.textContent = m.label;
      });
      if (hoverIdx >= 0) placeHover(hoverIdx);
    }

    function resample(a, n) {
      if (!a) return null;
      if (a.length === n) return a.slice();
      var out = [];
      for (var i = 0; i < n; i++) { var p = (a.length - 1) * (n <= 1 ? 0 : i / (n - 1)); var lo = Math.floor(p), hi = Math.ceil(p); out.push(a[lo] + (a[hi] - a[lo]) * (p - lo)); }
      return out;
    }

    function set(d, instant) {
      target = d;
      var newMax = computeMax(d);
      if (!cur || instant) { cur = d; yMax = yMaxShown = newMax; draw(d); return; }
      var n = d.x.length, from = {}, fromMax = yMaxShown;
      opts.series.forEach(function (s) { from[s.key] = resample(cur.series[s.key], n) || (d.series[s.key] ? d.series[s.key].map(function () { return 0; }) : null); });
      cancelAnimationFrame(anim);
      var t0 = performance.now(), dur = 650;
      (function step(t) {
        var p = Math.min(1, (t - t0) / dur), e = ease(p), frame = { x: d.x, series: {} };
        opts.series.forEach(function (s) {
          var to = d.series[s.key]; if (!to) return;
          var fr = from[s.key];
          frame.series[s.key] = to.map(function (v, i) { return fr ? fr[i] + (v - fr[i]) * e : v; });
        });
        yMaxShown = fromMax + (newMax - fromMax) * e;
        draw(frame);
        if (p < 1) anim = requestAnimationFrame(step); else { cur = d; yMax = newMax; }
      })(t0);
    }

    function placeHover(i) {
      var d = target || cur; if (!d) return;
      var n = d.x.length; i = Math.max(0, Math.min(n - 1, i));
      var x = X(i, n);
      vline.setAttribute('x1', x); vline.setAttribute('x2', x); vline.setAttribute('opacity', 1);
      opts.series.forEach(function (s) {
        var arr = d.series[s.key];
        if (!arr || hidden[s.key]) { dots[s.key].setAttribute('opacity', 0); return; }
        dots[s.key].setAttribute('cx', x); dots[s.key].setAttribute('cy', Y(arr[i])); dots[s.key].setAttribute('opacity', 1);
      });
      tip.innerHTML = opts.tip(i);
      tip.classList.add('on');
      var bw = el.clientWidth, scale = bw / W, px = x * scale, tw = tip.offsetWidth;
      var left = px + 18; if (left + tw > bw) left = px - tw - 18;
      tip.style.transform = 'translate(' + Math.max(0, left) + 'px,' + (pad.t * scale + 10) + 'px)';
    }
    function idxFrom(evt) {
      var d = target || cur; if (!d) return -1;
      var r = svg.getBoundingClientRect(), mx = (evt.clientX - r.left) * (W / r.width);
      return Math.round(((mx - pad.l) / (W - pad.l - pad.r)) * (d.x.length - 1));
    }
    hit.addEventListener('pointermove', function (e) { hoverIdx = idxFrom(e); placeHover(hoverIdx); });
    hit.addEventListener('pointerdown', function (e) { hoverIdx = idxFrom(e); placeHover(hoverIdx); if (opts.onPick) opts.onPick(Math.max(0, Math.min((target || cur).x.length - 1, hoverIdx))); });
    hit.addEventListener('pointerleave', function () {
      hoverIdx = -1; tip.classList.remove('on'); vline.setAttribute('opacity', 0);
      for (var k in dots) dots[k].setAttribute('opacity', 0);
    });

    var ro = 'ResizeObserver' in window ? new ResizeObserver(function () { size(); if (target) { yMaxShown = computeMax(target); draw(target); } }) : null;
    if (ro) ro.observe(el); else window.addEventListener('resize', function () { size(); if (target) draw(target); });
    size();

    return {
      set: set,
      toggle: function (key, off) { hidden[key] = off; if (target) set(target); },
      isHidden: function (key) { return !!hidden[key]; },
      redraw: function () { if (target) { size(); draw(target); } }
    };
  };
})();
