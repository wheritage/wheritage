/* ==========================================================================
   Vie participative — moteur d'estimation recalé sur 29 illustrations réelles
   (octobre 2026, barème courant, participations en bonifications d'assurance libérée).
   Les chiffres produits sont APPROXIMATIFS : écart typique de ±5 % sur les cas d'ancrage.
   Aucune donnée ne nomme un produit ou un assureur.
   ========================================================================== */
(function () {
  'use strict';

  function lin(xs, ys, x) {
    if (x <= xs[0]) return ys[0];
    for (var i = 1; i < xs.length; i++) if (x <= xs[i]) return ys[i - 1] + (ys[i] - ys[i - 1]) * (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
    return ys[ys.length - 1];
  }
  // interpolation log-linéaire, avec prolongement aux extrémités
  function logLin(xs, ys, x) {
    var i = 0;
    if (x >= xs[xs.length - 1]) i = xs.length - 2;
    else if (x > xs[0]) while (!(xs[i] <= x && x <= xs[i + 1])) i++;
    var t = (x - xs[i]) / (xs[i + 1] - xs[i]);
    return Math.exp(Math.log(ys[i]) + (Math.log(ys[i + 1]) - Math.log(ys[i])) * t);
  }

  /* ── Primes (par 1 000 $ de protection, à 250 000 $) ── */
  var P20M_AGES = [1, 10, 20, 30, 40, 45, 50, 60, 65];
  var P20M = [2920, 3652.5, 4627.5, 5690, 7265, 8222.5, 9310, 12525, 14875].map(function (p) { return p / 250; });
  function sexF(a) { return lin([1, 30, 45, 60], [2550 / 2920, 5127.5 / 5690, 7357.5 / 8222.5, 11387.5 / 12525], a); }
  function smkM(a) { return lin([30, 45, 60], [6840 / 5690, 9885 / 8222.5, 15870 / 12525], a); }
  function smkF(a) { var m45 = 9885 / 8222.5 - 1, f45 = 8447.5 / 7357.5 - 1; return 1 + (smkM(a) - 1) * f45 / m45; }
  function pay10(a, sex) {
    var m = lin([30, 45, 60], [10360 / 5690, 15000 / 8222.5, 21030 / 12525], a);
    return sex === 'F' ? m * (13620 / 7357.5) / (15000 / 8222.5) : m;
  }
  function payLife(a) { return lin([1, 30, 45, 60, 70], [1450 / 2920, 3062.5 / 5690, 5202.5 / 8222.5, 0.73, 0.79], a); }
  var SMOKER_MIN_AGE = 18; // sous cet âge, aucune distinction fumeur

  function per1000(sex, smk, pay, a) {
    var r = logLin(P20M_AGES, P20M, a);
    if (sex === 'F') r *= sexF(a);
    if (smk && a >= SMOKER_MIN_AGE) r *= sex === 'F' ? smkF(a) : smkM(a);
    if (pay === 10) r *= pay10(a, sex);
    else if (pay === 0) r *= payLife(a);
    return r;
  }
  // Effet du montant (frais fixes et paliers), relatif à 250 000 $
  var BAND_X = [50e3, 100e3, 250e3, 500e3, 1e6, 2e6].map(Math.log);
  var BAND_Y = [1782 / 50, 3350 / 100, 8222.5 / 250, 16220 / 500, 32410 / 1000, 64420 / 2000].map(function (v) { return v / (8222.5 / 250); });
  function band(F) {
    var lx = Math.log(Math.max(10000, F));
    if (lx < BAND_X[0]) return BAND_Y[0] + (BAND_Y[0] - BAND_Y[1]) * (BAND_X[0] - lx) / (BAND_X[1] - BAND_X[0]);
    return lin(BAND_X, BAND_Y, lx);
  }

  /* ── Valeurs garanties ── */
  // Valeur garantie d'une police libérée, par 1 $ de protection, selon l'âge atteint
  var GA = [11, 21, 25, 40, 45, 50, 55, 65, 80, 85, 100];
  var GM = [0.082, 0.150, 0.17703, 0.27946, 0.32705, 0.38095, 0.41657, 0.58157, 0.80534, 0.85683, 1.0];
  function gpu(sex, smk, a) {
    var v = lin(GA, GM, a);
    if (sex === 'F') v *= lin([0, 25, 45, 65, 85, 100], [0.869, 0.869, 0.89479, 0.92057, 0.96596, 1], a);
    if (smk && a >= SMOKER_MIN_AGE) {
      var s = lin([0, 50, 65, 85, 100], [1.20, 1.20, 1.15364, 1.02879, 1], a);
      if (sex === 'F') s = 1 + (s - 1) * 0.148 / 0.202;
      v = Math.min(1, v * s);
    }
    return v;
  }
  var F20 = [[0, 0.1, 0.25, 0.5, 0.85, 1], [0, 0, 0.0119, 0.240, 0.93, 1]];
  var F10 = [[0, 0.2, 0.5, 1], [0, 0, 0.0575, 1]];
  var HL30 = [[0, 5, 10, 20, 35, 55], [0, 0.0107, 0.1818, 0.609, 0.824, 0.932]];
  var HL45 = [[0, 5, 10, 20, 40], [0, 0.0115, 0.2145, 0.658, 0.887]];
  function hl(x, t) {
    var w = Math.min(1, Math.max(0, (x - 30) / 15));
    var a = t <= 55 ? lin(HL30[0], HL30[1], t) : 0.932;
    var b = t <= 40 ? lin(HL45[0], HL45[1], t) : 0.887 + (0.932 - 0.887) * Math.min(1, (t - 40) / 15);
    return a * (1 - w) + b * w;
  }
  function G(sex, smk, pay, x, t) {
    var a = x + t;
    if (pay === 0) {
      var T = 100 - x, h = hl(x, t);
      if (t > 55) h = 0.932 + (1 - 0.932) * Math.min(1, (t - 55) / Math.max(1, T - 55));
      if (a >= 100) h = 1;
      return h * gpu(sex, smk, a);
    }
    if (t >= pay) return gpu(sex, smk, a);
    var f = pay === 20 ? F20 : F10;
    return lin(f[0], f[1], t / pay) * gpu(sex, smk, x + pay);
  }

  /* ── Participations (calées au barème courant) ── */
  var P = { g0: 0.012801, g1: -0.0071995, s0: 0.045875, s1: -0.0027313, c: 0.11132, ry: 0.97817 };
  var CORR = { 20: [0.972, 1.252, 1.021], 10: [0.796, 0.893, 0.924], 0: [1.065, 1.297, 1.113] };
  var BASE_RATE = 0.0635;
  function corr(pay, t) { var c = CORR[pay]; return lin([0, 5, 10, 20, 25], [c[0], c[0], c[1], c[2], 1], t); }

  /** Courbes par 1 $ de protection : g (valeur garantie), c (valeur totale), d (capital-décès total). */
  function curves(sex, smk, pay, x, r, years) {
    var prem = per1000(sex, smk, pay, x) / 1000, n = pay === 0 ? 100 - x : pay;
    var adj = Math.max(0, (r - 0.035) / (BASE_RATE - 0.035)), dr = r - BASE_RATE;
    var D = 0, o = { g: [0], c: [0], d: [1] };
    for (var t = 1; t <= years; t++) {
      var a = x + t, pr = t <= n ? prem : 0;
      var gg = P.g0 + P.g1 * (a - 50) / 50 + dr, ss = (P.s0 + P.s1 * (a - 50) / 50) * adj;
      var div = ss * (G(sex, smk, pay, x, t - 1) + D) + P.c * adj * pr;
      D = Math.max(0, D * (1 + gg) + div);
      var Dc = x >= 18 ? D * corr(pay, t) : D;
      var g = G(sex, smk, pay, x, t);
      o.g.push(g); o.c.push(g + Dc); o.d.push(1 + Dc / (gpu(sex, smk, Math.min(100, a)) * P.ry));
    }
    return o;
  }

  window.WH_PAR_CAL = {
    baseRate: 6.35,
    monthlyFactor: 0.09,
    smokerMinAge: SMOKER_MIN_AGE,
    per1000: per1000,
    band: band,
    /** Prime annuelle pour un montant de protection */
    annualPremium: function (sex, smk, pay, age, face) { return per1000(sex, smk, pay, age) * face / 1000 * band(face); },
    /** Montant de protection pour une prime annuelle donnée */
    faceFor: function (sex, smk, pay, age, annual) {
      var rate = per1000(sex, smk, pay, age), F = annual / rate * 1000;
      for (var i = 0; i < 6; i++) F = annual / (rate * band(F)) * 1000;
      return F;
    },
    curves: curves
  };
})();
