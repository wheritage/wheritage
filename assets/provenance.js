/* Provenance des visites (UTM de la pub, fbclid) — gardée pour toute la visite (sessionStorage)
   et ajoutée à la note de réservation Cal.com, sur /strategie-societe comme sur /diagnostic.
   UMD : navigateur → window.WHProvenance ; Node → require (tests : tools/test-provenance.mjs).
   Jamais de nom, courriel ou téléphone ici : seulement les paramètres de la pub (Loi 25). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.WHProvenance = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var KEY = 'wh-provenance';
  var FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid'];
  var MAX = 60;

  function clean(v) {
    // eslint-disable-next-line no-control-regex
    return String(v).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX);
  }

  /** Ad parameters present in a query string ('' or '?a=b'); unrelated keys are ignored. */
  function fromSearch(search) {
    var out = {};
    var p;
    try { p = new URLSearchParams(search || ''); } catch (e) { return out; }
    FIELDS.forEach(function (k) {
      var v = p.get(k);
      if (v && clean(v)) out[k] = clean(v);
    });
    return out;
  }

  function isEmpty(src) { return !src || Object.keys(src).length === 0; }

  function load(storage) {
    try {
      var v = storage && storage.getItem(KEY);
      var o = v ? JSON.parse(v) : null;
      return o && typeof o === 'object' ? o : {};
    } catch (e) { return {}; }
  }

  /** Remember this page's ad parameters for the visit; the latest ad click wins. Returns what applies now. */
  function remember(storage, search) {
    var fresh = fromSearch(search);
    if (isEmpty(fresh)) return load(storage);
    try { if (storage) storage.setItem(KEY, JSON.stringify(fresh)); } catch (e) { /* storage blocked: still use fresh */ }
    return fresh;
  }

  /** ' · Provenance : source meta, campagne X, pub AD2_v3' — or '' for a direct visit. */
  function text(src) {
    if (isEmpty(src)) return '';
    var o = [];
    if (src.utm_source) o.push('source ' + clean(src.utm_source));
    if (src.utm_campaign) o.push('campagne ' + clean(src.utm_campaign));
    if (src.utm_content) o.push('pub ' + clean(src.utm_content));
    if (!o.length && src.fbclid) o.push('pub Meta');
    return o.length ? ' · Provenance : ' + o.join(', ') : '';
  }

  return { KEY: KEY, fromSearch: fromSearch, remember: remember, text: text };
});
