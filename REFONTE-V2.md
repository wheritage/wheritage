# W Héritage: redesign v2 (increment 1)

Date: 2026-11-20 · Branch: `claude/youthful-davinci-t65vec` · Not deployed (listed in `.vercelignore`).

This increment covers the brief's **Phase 1 (audit + design system)**, **Phase 2 (homepage)** and the parts of
**Phases 3 to 5** that the new homepage depends on: the content it no longer carries had to land on its own page
first, so nothing that works today was lost.

---

## 1. Audit of the existing site

**Architecture.** Static HTML/CSS/JS on Vercel (`cleanUrls`), no build step, no npm dependencies. One shared
stylesheet (`assets/site.css`) and one shared script (`assets/site.js`) that injects the nav, mobile menu, footer,
consent banner, sticky mobile booking bar and auto/home quote pill on every page. Self-hosted Lenis + GSAP +
ScrollTrigger for smooth scroll. Bilingual by `[lang]` spans. Vercel functions in `api/` (lead verification, SMS OTP).

**Integrations kept intact (all re-tested):** Web3Forms (contact form, guide, diagnostic notifications), Google
Apps Script sheet (`WH.sheetLead`), LeadGuard + `/api/verify-lead` anti-fake-lead filter and rate limits, Twilio
Verify OTP, Cal.com inline calendar at the end of `/diagnostic`, GA4 + Meta Pixel behind the Loi 25 consent banner,
YouTube/Vimeo VSL player, auto/home quote referral links, sitemap, JSON-LD.

**Main problems found.**

| Area | Finding |
|---|---|
| Homepage | 119 KB, 15 blocks: hero, credentials, ticker, philosophy, 4 overlapping audiences, 5-tab auto-rotating expertise panel (30 cards), business owners, method, permanent-insurance teaser, simulator band, manifesto, 3 Instagram iframes, full guide (gated), trust grid, booking block, contact form, auto/home strip. Many competing CTAs. |
| Visual | Gold dominant (fills, gradients, glows), brown-tinted blacks, hero photo is a poster with baked-in text ("RENCONTREZ…" + logo). |
| Motion | 1.9 s splash on first visit, custom cursor, magnetic buttons, gold dust canvas, ghost words, infinite ticker, auto-rotating tabs, scroll cue, pulsing play icons. |
| Bugs | Global `.sub` (nav dropdown) hid every other element using class `sub`: the guide's subtitle, the simulator sub-figures on `/calculateur` and `/vie-participative`. Six diagnostic events (`lead_blocked`, `otp_*`) were called but missing from the `EVENTS` table, so never sent. `/processus` showed four visible "Vidéo bientôt" placeholders. |

---

## 2. Design system v2 (`assets/site.css`)

- **Palette:** noir `#080808`, ivoire `#F5F4F0`, pierre `#D5D1C8` (+ `#EAE7E1` section tone), charbon `#202020`,
  muted gold `#B49A70` for small accents only. Neutral (not brown) dark greys. All hard-coded old gold values in the
  site files were replaced (video tools `motion-lab` / `text-effects` keep their own palette).
- **Light sections** `bg-ivoire` / `bg-pierre` redefine the colour variables, so titles, buttons, links, fields and
  consent boxes adapt with no extra rules. Contrast checked: body grey 5.5:1 on ivory, gold labels 5:1 on ivory,
  7:1 on black.
- **Buttons:** primary is ivory on dark / black on light, gold only on hover, no sheen. One wording everywhere:
  « Réserver une consultation ».
- **Editorial components:** `.sec` rhythm, `.sec-head`, `.photo-nb` + `.photo-cap`, `.rows` (hairline lists),
  `.text-link`, `.note-pro` (compliance note), `.sub-hero` (inner pages), `.page-toc`, `.cta-band`, `.guide-cover`,
  `.sr-only`, light-surface form styles.
- **Photography:** black & white versions generated from the existing authentic photos (`assets/photos/*-nb`):
  seated portrait (hero), head-and-shoulders crop of the "Rencontrez" poster without its baked-in text (About),
  desk scene (Entrepreneurs). WebP + JPEG, lazy-loaded below the fold, cached 7 days.
- **Motion, simplified:** intro always short (< 1 s), custom cursor and magnetic buttons removed, no dust canvas,
  ghost words, ticker or scroll cue on the new pages. Kept: line reveals, gentle fades, one timeline draw.

---

## 3. What changed

### Homepage (`index.html`, 119 KB → 40 KB)
Nine sections, in the brief's order: hero (brief headline, one CTA + « Découvrir mon approche ») · compact
credentials strip (CSF with AMF register link, Québec et Ontario, FR/EN/AR) · « Une approche adaptée à votre
réalité » (3 audiences) · « Une vision globale de votre patrimoine » (5 pillars → `/expertise#…`) · Entrepreneurs
(« …C'est un actif à structurer », 3 areas → `/entrepreneurs`) · « Avant les chiffres, il y a une histoire »
(3 existing principles → `/a-propos`) · 4-step process (horizontal on desktop, vertical on mobile → `/processus`) ·
« Comprendre avant de décider » (1 video + 1 business article + 1 personal article + small guide preview) · final CTA
with both journeys (entrepreneur / particulier) and the brand line.
Old anchors (`/#guide`, `/#contact`, `/#reservation`, …) redirect to their new pages.

### New pages
| Page | Content |
|---|---|
| `/expertise` | The five pillars in full (the 30 cards formerly in the homepage tabs), each with « Pour aller plus loin » links to existing articles and tools. |
| `/entrepreneurs` | Business-owner journey: six issues (surplus, liquidity, tax, shareholder protection, succession, wealth transfer) linked to the existing articles; the corporate permanent-insurance strategy relocated from the homepage with its limits stated; how working together starts (diagnostic, 15-min call, coordination with accountant/notary); guide; CTA to `/diagnostic?profil=entrepreneur`. |
| `/contact` | Contact details, meeting modes, direct booking box, the Web3Forms contact form (same fields, same LeadGuard checks, same script), auto/home quotes. |
| `/guide-entrepreneur` | L'Empire Blindé landing page: headline, what's inside, typographic cover, short form (email + consent), confirmation state, the guide itself, consultation CTA, disclaimer. Same Web3Forms + sheet pipeline and `guide_lead` event as before. |

### Shared chrome (`assets/site.js`)
Nav: À propos · Expertise · Entrepreneurs · Processus · Ressources ▾ · Contact + CTA. Footer updated with the brand
line. Booking clicks now report a `zone` (section id, navigation, footer, mobile bar) and only the visible label.

### Other pages
`/processus`: empty video slots now show a still B&W photograph (they become players as soon as a link is put in
`data-video`); pulsing animation removed. `/ressources` and the diagnostic's guide link point to the new guide page.

---

## 4. Retained / removed / created

**Retained:** all inner pages and articles, `/diagnostic` and `/strategie-societe` funnels, every form handler and
lead pipeline, consent banner, analytics, Lenis/GSAP setup, sticky mobile booking bar, auto/home quote pill (off on
the new pages), bilingual system, JSON-LD, the existing copy for the five pillars, principles and the guide.

**Removed from the homepage** (content relocated, not deleted): concept ticker, philosophy block, 4th audience card,
expertise tab panel, permanent-insurance teaser and simulator band, manifesto, Instagram iframes, gated guide,
trust grid, booking block, contact form, auto/home strip, ornaments, ghost words, dust canvas.
**Removed site-wide:** custom cursor, magnetic buttons, button sheen, ornament glow, long first-visit intro.

**Created:** 4 pages above, 3 B&W photos (×2 formats), v2 tokens and components, `tools/test-redesign.mjs`.

---

## 5. Tests run (`node tools/test-redesign.mjs`, 151/151 passing)

- **18 pages × desktop (1440) and mobile (390):** no JS errors, no horizontal overflow; one `h1`, title, meta
  description and canonical on each; every image has `alt`; no placeholder text visible.
- **Homepage:** section order, headline, uniform CTA wording, FR→EN switch (no French left visible, title switches),
  language remembered, old anchors redirect.
- **Mobile:** menu opens with all entries and closes with Esc; sticky booking bar appears after the hero.
- **Guide:** empty email refused, consent required, `test@gmail.com` refused, confirmation + guide unlocked, one
  notification sent, one `generate_lead`, stays unlocked on return.
- **Contact:** required fields enforced, fictional 555-01xx number refused, confirmation shown, one send, one
  `generate_lead`, quote links wired.
- **Diagnostic, both profiles** (entrepreneur on mobile, particulier on desktop): 10 questions → contact form → SMS
  verification (mocked Twilio) → result → Cal.com calendar mounted; notification + sheet sent; events start / steps /
  OTP / lead; Meta `Lead` only for the qualified business owner.
- **Analytics:** a booking click = exactly one GA + one Meta event with its zone; non-booking links fire nothing;
  refused consent = no events at all.
- **Links:** all 44 internal links and assets return 200.
- Existing suites still pass: `tools/test-leads.mjs` (35/35), `tools/test-apps-script.mjs`.

All external services were intercepted during tests: no email reached the inbox, no row was written to the sheet.

---

## 6. Limitations and items that need you

1. **Booking confirmation was not completed end to end.** The calendar mounts and the `bookingSuccessful` hook is in
   place, but confirming a real slot would create a real appointment. Book one test slot yourself and cancel it.
2. **Compliance review before publishing:** the new pages reuse existing approved wording, but the following are
   new sentences worth a read by your compliance contact: the six issue descriptions on `/entrepreneurs`, the
   corporate-insurance limits paragraph, the process step descriptions, and the hero/expertise one-liners.
   `/strategie-societe` (ad funnel, untouched) shows figures such as « 50,17 % » and « 50 000 $ »: they predate this
   work and should be checked against sources.
3. **Photography:** only four authentic photos exist; the audience cards use line drawings instead of stock images.
   A short shoot (portrait at a desk, hands-on-documents details, an office interior, architecture) would let the
   cards and inner pages use real photos.
4. **Open Graph images** for the new pages reuse existing ones (`accueil`, `surplus-societe-opco`, `ressources`).
5. **No testimonials** were added (none are available and none were invented).
6. **English pages** share their URL with French (toggle), as the rest of the site does. Separate `/en/` URLs with
   `hreflang` would be needed for English SEO to be indexed independently.
7. **Analytics in production:** the events were verified with spies in the browser; confirm them in GA4 DebugView
   and Meta Events Manager after deploy.

---

## 7. Next phases (recommended order)

1. **About (`/a-propos`)**: move to the v2 system (B&W portrait large, shorter narrative, credentials block,
   the four principles), review the « 20 % parler, 80 % écouter » framing and the « Je suis là pour vous blinder »
   line for tone.
2. **Process (`/processus`)**: align step names with the homepage (Analyser, Comprendre, Structurer, Accompagner),
   keep the pinned timeline and FAQ, add real videos when recorded.
3. **Resources**: v2 layout with filters (Entrepreneurs / Particuliers / Vidéos).
4. **Protection, Patrimoine, Transmission** dedicated pages, as `/expertise` sections grow.
5. Migrate the articles, simulators and legal pages to the light editorial layout.
6. New OG images; `/en/` URLs if English search traffic matters.
