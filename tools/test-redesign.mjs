// Recette de la refonte v2 (accueil, pages nouvelles, formulaires, diagnostic, mesure, liens).
// Usage : MOCK_TWILIO=1 node tools/dev-server.mjs   puis   node tools/test-redesign.mjs [http://localhost:3000]
// Les services externes (Web3Forms, Apps Script, Cal.com, GA4, Meta) sont interceptés dans le navigateur :
// aucun courriel n'est envoyé, aucune ligne n'est écrite dans la feuille. Sortie : liste PASS/FAIL, code 1 si un échec.
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');

async function loadPlaywright() {
  try { return await import('playwright'); } catch {}
  const globalRoot = execSync('npm root -g').toString().trim();
  return createRequire(path.join(globalRoot, 'noop.js'))('playwright');
}
const { chromium } = await loadPlaywright();

const results = [];
function check(name, ok, detail = '') { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  · ' + detail : ''}`); }

const browser = await chromium.launch();

// Contexte : témoins acceptés (pour voir les événements de mesure), services externes simulés.
async function newCtx(opts = {}) {
  // Une adresse IP fictive par contexte : les limites de débit de /api/verify-lead (3 envois / 10 min par IP) restent actives
  const ip = `10.${(Math.random() * 250) | 0}.${(Math.random() * 250) | 0}.${(Math.random() * 250) | 0}`;
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1440, height: 900 }, extraHTTPHeaders: { 'x-real-ip': ip }, ...(opts.device || {}) });
  await ctx.addInitScript((accept) => {
    try {
      localStorage.setItem('wh-consent', JSON.stringify({ a: accept ? 1 : 0, m: accept ? 1 : 0, t: Date.now(), v: 1 }));
      if (!sessionStorage.getItem('t-init')) { localStorage.removeItem('wh-guide'); sessionStorage.setItem('t-init', '1'); }
    } catch (e) {}
    window.__events = [];
  }, opts.accept !== false);
  const sent = [];
  await ctx.route(/api\.web3forms\.com/, r => { sent.push({ to: 'web3forms', body: r.request().postData() }); r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"message":"mock"}' }); });
  await ctx.route(/script\.google\.com/, r => { sent.push({ to: 'sheet', body: r.request().postData() }); r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  await ctx.route(/googletagmanager\.com|google-analytics\.com|connect\.facebook\.net|facebook\.com\/tr/, r => r.fulfill({ status: 200, body: '' }));
  await ctx.route(/app\.cal\.com|cal\.com\/embed/, r => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  await ctx.route(/instagram\.com|youtube|fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  ctx.sent = sent;
  return ctx;
}
async function open(ctx, url) {
  const p = await ctx.newPage(); p.errors = [];
  p.on('pageerror', e => p.errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) p.errors.push(m.text()); });
  await p.goto(BASE + url, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => document.documentElement.classList.contains('wh-ready'), null, { timeout: 8000 }).catch(() => {});
  // gtag / fbq espions, posés après le chargement (le site installe ses propres fonctions quand les témoins sont acceptés)
  await p.evaluate(() => {
    window.gtag = function () { if (arguments[0] === 'event') window.__events.push({ via: 'ga', name: arguments[1], p: arguments[2] }); };
    window.fbq = function () { if (arguments[0] === 'track' || arguments[0] === 'trackCustom') window.__events.push({ via: 'meta', name: arguments[1], p: arguments[2] }); };
  });
  await p.waitForTimeout(400);
  return p;
}
const visibleText = (p, sel) => p.$eval(sel, el => el.innerText.trim()).catch(() => '');

// ─── 1. Pages : chargement, erreurs console, débordement horizontal, titre, h1 unique, description, canonique ───
const PAGES = ['/', '/expertise', '/entrepreneurs', '/contact', '/guide-entrepreneur', '/a-propos', '/processus', '/ressources',
  '/calculateur', '/vie-participative', '/surplus-societe-opco', '/convention-actionnaires-financee',
  '/assurance-invalidite-collective-individuelle', '/compte-dividendes-capital-assurance-vie', '/diagnostic', '/strategie-societe',
  '/confidentialite', '/conditions'];
{
  for (const [label, vp] of [['ordinateur', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const ctx = await newCtx({ viewport: vp });
    for (const url of PAGES) {
      const p = await open(ctx, url);
      const info = await p.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        title: document.title, h1: document.querySelectorAll('h1').length,
        desc: (document.querySelector('meta[name="description"]') || {}).content || '',
        canonical: (document.querySelector('link[rel="canonical"]') || {}).href || '',
        imgNoAlt: [...document.images].filter(i => !i.hasAttribute('alt')).length,
        placeholder: /bientôt|coming soon|lorem ipsum|TODO/i.test(document.body.innerText)
      }));
      check(`[${label}] ${url} : aucune erreur JS`, p.errors.length === 0, p.errors.slice(0, 2).join(' | '));
      check(`[${label}] ${url} : aucun débordement horizontal`, info.overflow <= 0, info.overflow > 0 ? info.overflow + 'px' : '');
      if (label === 'ordinateur') {
        check(`${url} : un seul h1, titre, description, canonique`, info.h1 === 1 && info.title && info.desc.length > 50 && info.canonical, `h1=${info.h1}`);
        check(`${url} : images avec alt, aucun texte provisoire visible`, info.imgNoAlt === 0 && !info.placeholder);
      }
      await p.close();
    }
    await ctx.close();
  }
}

// ─── 2. Accueil : structure, bascule de langue, anciennes ancres ───
{
  const ctx = await newCtx();
  const p = await open(ctx, '/');
  const ids = await p.$$eval('body > header, body > section', els => els.map(e => e.id || e.className.split(' ')[0]));
  check('Accueil : 9 sections dans l\'ordre du cahier', JSON.stringify(ids) === JSON.stringify(['accueil', 'trust-strip', 'pour-qui', 'expertise', 'entreprise', 'walid', 'methode', 'ressources', 'consultation']), ids.join(','));
  check('Accueil : h1 = titre du cahier', /Votre patrimoine mérite une stratégie à la hauteur de ce que vous bâtissez/.test(await visibleText(p, 'h1')));
  const ctas = await p.$$eval('a', as => as.filter(a => a.offsetParent && /diagnostic/.test(a.getAttribute('href') || '')).map(a => a.innerText.trim().replace(/\s+/g, ' ')));
  check('Accueil : appel principal uniforme « Réserver une consultation »', ctas.filter(t => /^Réserver une consultation/i.test(t)).length >= 3, ctas.join(' / '));
  await p.click('.lang-toggle button[data-l="en"]');
  await p.waitForTimeout(300);
  const en = await p.evaluate(() => ({ lang: document.documentElement.lang, h1: document.querySelector('h1').innerText, title: document.title,
    frVisible: [...document.querySelectorAll('[lang="fr"]')].filter(e => e.offsetParent !== null && e !== document.documentElement).length }));
  check('Accueil : passage à l\'anglais (titre, h1, aucun texte FR visible)', en.lang === 'en' && /Your wealth deserves/.test(en.h1) && /financial security advisor/.test(en.title) && en.frVisible === 0, `fr visibles=${en.frVisible}`);
  await p.reload(); await p.waitForTimeout(800);
  check('Accueil : la langue choisie est retenue', await p.evaluate(() => document.documentElement.lang) === 'en');
  await p.click('.lang-toggle button[data-l="fr"]');
  const vt = await p.evaluate(() => [...document.styleSheets].some(ss => { try { return [...ss.cssRules].some(r => /view-transition/.test(r.cssText)); } catch (e) { return false; } }));
  check('Transitions entre pages natives (@view-transition), plus de rideau JS', vt && !(await p.$('#curtain')));
  const t0 = Date.now();
  await Promise.all([p.waitForURL(/expertise/), p.click('.nav-links a[href="expertise.html"]')]);
  check('Clic de navigation : départ immédiat (aucun délai artificiel)', Date.now() - t0 < 450, (Date.now() - t0) + ' ms');
  check('Intro du logo : seulement à la première page de la visite', !(await p.$('#intro')));
  await p.goBack(); await p.waitForTimeout(500);
  for (const [hash, target] of [['#guide', '/guide-entrepreneur'], ['#contact', '/contact'], ['#reservation', '/diagnostic']]) {
    const q = await ctx.newPage(); await q.goto(BASE + '/' + hash); await q.waitForURL(u => u.pathname.replace(/\.html$/, '') === target, { timeout: 5000 }).catch(() => {});
    check(`Ancienne ancre /${hash} redirige vers ${target}`, new URL(q.url()).pathname.replace(/\.html$/, '') === target, q.url()); await q.close();
  }
  await ctx.close();
}

// ─── 3. Navigation mobile ───
{
  const ctx = await newCtx({ viewport: { width: 390, height: 844 } });
  const p = await open(ctx, '/');
  await p.click('#hamburger'); await p.waitForTimeout(500);
  const openState = await p.evaluate(() => ({ open: document.getElementById('mobileMenu').classList.contains('open'), links: [...document.querySelectorAll('#mobileMenu a')].map(a => a.getAttribute('href')) }));
  check('Menu mobile : s\'ouvre avec les 7 entrées + ressources + réservation', openState.open && ['index.html', 'a-propos.html', 'expertise.html', 'entrepreneurs.html', 'processus.html', 'contact.html', 'diagnostic'].every(h => openState.links.includes(h)), openState.links.join(' '));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  check('Menu mobile : se ferme avec Échap', !(await p.evaluate(() => document.getElementById('mobileMenu').classList.contains('open'))));
  await p.evaluate(() => scrollTo(0, 1600)); await p.waitForTimeout(800);
  check('Mobile : barre « Réserver » collante visible après le héros', await p.evaluate(() => document.querySelector('.book-bar').classList.contains('show')));
  await ctx.close();
}

// ─── 4. Mesure : clic de réservation (une fois, avec emplacement), consentement refusé = rien ───
{
  const ctx = await newCtx();
  const p = await open(ctx, '/');
  await p.evaluate(() => document.addEventListener('click', e => { if (e.target.closest('a')) e.preventDefault(); }, true));
  await p.click('#entreprise a.btn[href="entrepreneurs.html"]');
  await p.click('#consultation a.btn-gold');
  const ev = await p.evaluate(() => window.__events);
  const ga = ev.filter(e => e.via === 'ga' && e.name === 'clic_reservation');
  check('Mesure : clic « Réserver » = 1 événement GA + 1 Meta, emplacement inclus', ga.length === 1 && ga[0].p.zone === 'consultation' && ev.filter(e => e.via === 'meta' && e.name === 'ClicReservation').length === 1, JSON.stringify(ga.map(e => e.p)));
  check('Mesure : un lien qui ne réserve pas ne déclenche rien', !ev.some(e => e.p && /Explorer/.test(e.p.lien || '')));
  await ctx.close();
  const ctx2 = await newCtx({ accept: false });
  const q = await open(ctx2, '/');
  await q.evaluate(() => document.addEventListener('click', e => { if (e.target.closest('a')) e.preventDefault(); }, true));
  await q.click('#consultation a.btn-gold');
  check('Mesure : témoins refusés = aucun événement', (await q.evaluate(() => window.__events)).length === 0);
  await ctx2.close();
}

// ─── 5. Guide (/guide-entrepreneur) : validations, confirmation, envois, événement ───
{
  const ctx = await newCtx();
  const p = await open(ctx, '/guide-entrepreneur');
  check('Guide : contenu verrouillé avant inscription', !(await p.isVisible('#guide-content')));
  await p.click('#leadCaptureForm button[type="submit"]'); await p.waitForTimeout(200);
  check('Guide : courriel vide refusé avec message', /courriel valide/.test(await visibleText(p, '.lc-err')));
  await p.fill('#lc-email', 'marie.tremblay@videotron.ca');
  await p.click('#leadCaptureForm button[type="submit"]'); await p.waitForTimeout(200);
  check('Guide : consentement exigé', /consentement/.test(await visibleText(p, '.lc-err')));
  await p.fill('#lc-email', 'test@gmail.com');
  await p.check('#leadCaptureForm input[name="consentement"]');
  await p.waitForTimeout(2600); // temps de remplissage minimal (anti-robot)
  await p.click('#leadCaptureForm button[type="submit"]'); await p.waitForTimeout(1500);
  check('Guide : courriel bidon (test@gmail.com) refusé', (await visibleText(p, '.lc-err')).length > 5 && !(await p.isVisible('#guide-content')), await visibleText(p, '.lc-err'));
  await p.fill('#lc-email', 'marie.tremblay@videotron.ca');
  await p.click('#leadCaptureForm button[type="submit"]');
  await p.waitForSelector('#guide-content.active', { timeout: 8000 }).catch(() => {});
  check('Guide : confirmation affichée et guide ouvert', await p.isVisible('#guide-content') && await p.isVisible('.g-done'));
  check('Guide : avis courriel (Web3Forms) parti une fois', ctx.sent.filter(s => s.to === 'web3forms').length === 1);
  const ev = await p.evaluate(() => window.__events);
  check('Mesure : demande de guide = generate_lead (form=guide) une fois', ev.filter(e => e.name === 'generate_lead' && e.p.form === 'guide').length === 1);
  await p.reload(); await p.waitForTimeout(800);
  check('Guide : reste ouvert au retour (déjà inscrit)', await p.isVisible('#guide-content'));
  await ctx.close();
}

// ─── 6. Contact (/contact) : validations, envoi, confirmation ───
{
  const ctx = await newCtx();
  const p = await open(ctx, '/contact');
  await p.click('#submitBtn'); await p.waitForTimeout(200);
  check('Contact : champs requis bloqués par le navigateur', ctx.sent.length === 0 && await p.evaluate(() => !document.getElementById('contactForm').checkValidity()));
  await p.fill('#prenom', 'Marie'); await p.fill('#nom', 'Tremblay');
  await p.fill('#courriel', 'jean.gagnon@videotron.ca'); await p.fill('#telephone', '514 555 0123');
  await p.selectOption('#sujet', 'Mon entreprise');
  await p.fill('#message', 'Bonjour, j\'aimerais faire le point sur la protection de mon entreprise et ses surplus.');
  await p.check('#contactForm input[name="consentement"]');
  await p.waitForTimeout(2600);
  await p.click('#submitBtn'); await p.waitForTimeout(1500);
  const blocked = await visibleText(p, '.form-check');
  check('Contact : numéro fictif 555-01xx signalé', /num|phone|téléphone/i.test(blocked) || ctx.sent.length === 0, blocked);
  await p.fill('#telephone', '514 690 2211');
  await p.click('#submitBtn');
  await p.waitForSelector('#formSuccess', { state: 'visible', timeout: 8000 }).catch(() => {});
  check('Contact : confirmation affichée', await p.isVisible('#formSuccess'), await visibleText(p, '#formSuccess'));
  check('Contact : un seul envoi Web3Forms', ctx.sent.filter(s => s.to === 'web3forms').length === 1);
  const ev = await p.evaluate(() => window.__events);
  check('Mesure : message de contact = generate_lead (form=contact) une fois', ev.filter(e => e.name === 'generate_lead' && e.p.form === 'contact').length === 1);
  check('Contact : liens de soumission auto/habitation branchés', await p.$$eval('[data-quote]', as => as.every(a => /assurance\.ia\.ca/.test(a.href))));
  await ctx.close();
}

// ─── 7. Diagnostic : parcours entrepreneur complet jusqu'au calendrier (mobile) ───
async function runDiagnostic(profil, vp, email, tel) {
  const ctx = await newCtx({ viewport: vp });
  const p = await open(ctx, '/diagnostic');
  const pick = { besoin_5ans: 'non', surplus: '50_150', placements: '250k_1m', incorpore: 'oui' };
  await p.click(`.dg-opt[data-act="profil"][data-v="${profil}"]`);
  let guard = 0;
  while (guard++ < 20) {
    await p.waitForTimeout(450);
    if (await p.$('#dg-form')) break;
    const micro = await p.$('.dg-opt[data-act="micro"][data-v="oui"]');
    if (micro) { await micro.click(); continue; }
    const opts = await p.$$('.dg-opt:not([data-act])');
    if (!opts.length) break;
    const id = await opts[0].getAttribute('data-id');
    const want = pick[id];
    const target = (want && await p.$(`.dg-opt[data-id="${id}"][data-v="${want}"]`)) || opts[0];
    await target.click();
  }
  check(`Diagnostic ${profil} : 10 questions puis formulaire de coordonnées`, !!(await p.$('#dg-form')));
  await p.fill('#dg-form [name="prenom"]', 'Marie'); await p.fill('#dg-form [name="nom"]', 'Tremblay');
  await p.fill('#dg-form [name="courriel"]', email); await p.fill('#dg-form [name="telephone"]', tel);
  await p.check('#dg-form [name="c1"]');
  await p.waitForTimeout(2600);
  await p.click('#dg-form [type="submit"]');
  await p.waitForTimeout(2500);
  if (await p.$('[data-act="otp-send"]')) {
    await p.check('#dg-sms-ok').catch(() => {});
    await p.click('[data-act="otp-send"]'); await p.waitForTimeout(1200);
    const field = await p.evaluate(() => { const i = document.getElementById('dg-otp-code'); return i && { n: document.querySelectorAll('#dg-otp input').length, ac: i.autocomplete, im: i.inputMode, type: i.type, label: !!document.querySelector('label[for="dg-otp-code"]'), focused: document.activeElement === i }; });
    check(`Diagnostic ${profil} : code texto = un seul champ (one-time-code, clavier numérique, étiquette, focus)`, field && field.n === 1 && field.ac === 'one-time-code' && field.im === 'numeric' && field.type === 'text' && field.label && field.focused, JSON.stringify(field));
    await p.fill('#dg-otp-code', '12 34 56'); // collage avec espaces : nettoyé puis envoyé seul
    await p.waitForTimeout(2500);
    check(`Diagnostic ${profil} : vérification par texto (Twilio simulé, code 123456 collé)`, !(await p.$('#dg-otp-code')));
  }
  const res = await p.evaluate(() => ({ cal: !!document.getElementById('dg-cal'), text: document.querySelector('#dg-h') ? document.querySelector('#dg-h').innerText : '' }));
  check(`Diagnostic ${profil} : résultat + calendrier Cal.com intégré`, res.cal, res.text);
  const ev = await p.evaluate(() => window.__events.map(e => e.via + ':' + e.name));
  // diagnostic_view part au chargement, avant la pose des espions : vérifié à part ci-dessous
  check(`Mesure diagnostic ${profil} : début, étapes, texto, lead`, ['ga:diagnostic_start', 'ga:diagnostic_step', 'ga:otp_verified', 'ga:generate_lead'].every(n => ev.includes(n)), [...new Set(ev)].join(' '));
  check(`Mesure diagnostic ${profil} : Meta « Lead » seulement pour l'entrepreneur qualifié`, profil === 'entrepreneur' ? ev.includes('meta:Lead') : !ev.includes('meta:Lead'));
  check(`Diagnostic ${profil} : avis courriel + feuille`, ctx.sent.some(s => s.to === 'web3forms') && ctx.sent.some(s => s.to === 'sheet'));
  check(`Diagnostic ${profil} : aucune erreur JS`, p.errors.length === 0, p.errors.join(' | '));
  await ctx.close();
}
await runDiagnostic('entrepreneur', { width: 390, height: 844 }, 'luc.bouchard@videotron.ca', '438 690 3344');
await runDiagnostic('particulier', { width: 1440, height: 900 }, 'sophie.roy@videotron.ca', '514 690 5566');

// ─── 8. Liens internes : chaque href de chaque page répond 200 ───
{
  const files = readdirSync(ROOT).filter(f => f.endsWith('.html'));
  const hrefs = new Set();
  for (const f of files) {
    const s = readFileSync(path.join(ROOT, f), 'utf8');
    for (const m of s.matchAll(/(?:href|src|srcset)="([^"#?][^"]*)"/g)) {
      const h = m[1].split(' ')[0];
      if (/^(https?:|mailto:|tel:|data:|javascript:|\{|')/.test(h)) continue;
      hrefs.add(h.replace(/^\//, '').replace(/#.*$/, '').replace(/\?.*$/, ''));
    }
  }
  for (const m of readFileSync(path.join(ROOT, 'assets/site.js'), 'utf8').matchAll(/href: '([^']+)'/g)) hrefs.add(m[1].replace(/#.*$/, ''));
  const bad = [];
  for (const h of hrefs) { if (!h) continue; const r = await fetch(BASE + '/' + h).catch(() => ({ status: 0 })); if (r.status !== 200) bad.push(h + ' → ' + r.status); }
  check(`Liens et ressources internes (${hrefs.size}) : tous en 200`, bad.length === 0, bad.join(', '));
}

await browser.close();
const fails = results.filter(r => !r.ok);
console.log(`\n${results.length - fails.length}/${results.length} vérifications réussies`);
process.exit(fails.length ? 1 : 0);
