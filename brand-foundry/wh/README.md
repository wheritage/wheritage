# W Héritage content engine (Brand Foundry Vol 1)

Vendored from [bbm-media/brand-foundry](https://github.com/bbm-media/brand-foundry) at
`e67baa3fe784449165571675af9f2758f204e0cd` (2026-10-18), created by Payton Kaleiwahea,
published by Business Based Media (MIT). Excluded from the Vercel deploy by `/.vercelignore`.

## Start (fresh container)

```sh
cd brand-foundry
npm ci --ignore-scripts               # 384 MB, gitignored
export CHROME_PATH=/opt/pw-browsers/chromium
npm start                              # builds templates, serves http://127.0.0.1:4800
```

## Fill and render

All copy lives in `wh/content.json` (one entry per asset, keyed by `name`).
Field IDs must exist on the template (`GET /api/manifest`); the renderer refuses unknown ones.
`@file:assets/x.jpg` uploads a local image from `wh/` into an image field.

```sh
node wh/render.mjs                     # everything: stills to PNG (4:5), motion to MP4 (9:16)
node wh/render.mjs stat-cdc quote-manifeste
node wh/render.mjs --size=sq,st poster-opco      # other ratios (still: pt sq st, motion: full half wide)
node wh/render.mjs --mov headline-hook           # transparent MOV overlay
node wh/render.mjs --frames                      # fast PNG proof of every asset
```

Output lands in `wh/renders/<name>-<size>.<ext>`.

## Brand and local changes to the upstream kit

- `studio.config.json`: W Héritage, @walidh.csf, or `#C9A84C`, or pâle `#EAD6A2`,
  noir `#080808`, texte `#EDE8DF`, Cormorant Garamond + Montserrat.
- No rounded corners: every `border-radius: Npx` in `templates/` set to 0 (circles kept).
- GSAP 3.14.2 vendored to `templates/_shared/gsap.min.js` (CDN is blocked in cloud sessions; renders are now offline).
- Case study (static + carousel): eyebrow and footnote are fields instead of hardcoded English; dark metric cards.
- Bar race numbers formatted `fr-CA` (`900 000 $`). Prompt box surface derived from the theme (no grey card on noir).

## House rules for copy

Social content uses tutoiement. No em dashes, no invented figures: numbers come from the site
(e.g. the illustrative CDC example: 1 000 000 $ prestation, 100 000 $ CBR, 900 000 $ au CDC)
and carry "Exemple illustratif" when they are examples. `video/reveals/aurora-title` uses blurred
colour blobs, a banned tell in the motion rules: use it sparingly or prefer `mask-reveal`.
