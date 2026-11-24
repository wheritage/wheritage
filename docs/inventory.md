# W Heritage — Inventory (Phase 5A)

Read-only inventory, 2026-11-24. "Found" means seen on disk or live; "not found" means looked for and
missing on this computer, not that it does not exist.

## Repo — `github.com/wheritage/wheritage` (local clone `C:\Users\walid\sites\wheritage`)

- **Stack:** static HTML/CSS/JS on Vercel (`cleanUrls`), no build, no package.json. Vercel functions in `api/`.
- **Public pages:** `index`, `a-propos`, `processus`, `ressources`, `calculateur`, `conditions`, `confidentialite`,
  `assurance-invalidite-collective-individuelle`, `compte-dividendes-capital-assurance-vie`,
  `convention-actionnaires-financee`, `surplus-societe-opco`, `vie-participative`, `404`.
- **Funnel pages (noindex, out of sitemap):** `diagnostic` (+ `assets/diagnostic.js/.css`), `strategie-societe`.
- **Internal pages (noindex):** `motion-lab`, `text-effects`.
- **API:** `api/verify-lead.js`, `api/send-otp.js`, `api/check-otp.js`, `api/_lib/core.js`, `api/_lib/disposable-domains.js`.
- **Tools (not deployed):** `tools/apps-script-diagnostic.gs`, `test-leads.mjs`, `test-apps-script.mjs`,
  `dev-server.mjs`, `twilio-mock.mjs`, `render-reel.mjs`, `update-disposable-domains.mjs`.
- **Docs:** `CLAUDE.md`, `LEAD-PROTECTION.md`, `TEST_RESULTS_V2.md`, `business-os/` (MEMORY, GARDE-FOUS,
  PROMPTS, PLAN-PROSPECTION, objections, meeting templates, `.ics`).
- **CI:** `.github/workflows/disposable-domains.yml` (monthly refresh of the disposable-domain list).
- **Project skills:** `.claude/skills/` (Three.js, GSAP, design-dna, motion-design, genjutsu).

## Pull requests (from git history; `gh` is not installed here)

| PR | Branch | Merged | Note |
|---|---|---|---|
| #19 | claude/upbeat-clarke-npku5m | 2026-11-09 | 3 VSLs, youtube-nocookie, progress tracking |
| #20 | claude/upbeat-clarke-npku5m | 2026-11-09 | Web3Forms simple keys, `/diagnostic?debug` |
| #21 | claude/amazing-wright-zr2n11 | 2026-11-09 | new Web3Forms key |
| #22 | claude/gallant-volta-r3f2of | 2026-11-11 | pixel behaviour |
| #23 | claude/gifted-goldberg-zu3h54 | 2026-11-12 | anti-fake leads, Twilio SMS, Business OS |
| #24 | claude/gifted-goldberg-zu3h54 | 2026-11-13 | |
| #25 | claude/gifted-goldberg-zu3h54 | 2026-11-13 | Business OS |
| #26 | claude/gifted-goldberg-zu3h54 | 2026-11-13 | QC/ON area codes, refused email endings |
| #27 | claude/gallant-volta-r3f2of | 2026-11-19 | UTM provenance in the Cal.com note |

- **Unmerged:** `claude/youthful-davinci-t65vec` (2026-11-20/21, "Refonte v2: système noir et blanc",
  248 files) and four old branches from Sep–Oct (`ccr-5f808459-p2d0n0`, `ccr-61f7522e-y6xzon`,
  `ccr-c03a9951-n8f5cv`, `claude/emil-kowalski-skills-0vmefz`).
- Vercel preview URLs per PR: not listed here (needs the Vercel MCP or dashboard).

## Live site — `wheritage.vercel.app` (checked 2026-11-24)

- `/`, `/diagnostic`, `/strategie-societe`, `/confidentialite`, `/diagnostic?debug` all return HTTP 200.
- `/confidentialite` already lists diagnostic answers + consents and "Google Workspace — conservation des
  demandes dans une feuille de calcul et un agenda à accès restreint" (since 2026-11-12, PR #23). The setup
  document's "[TO FIX]" on this point is out of date; wording validation by Walid/the firm still open.
- Configured endpoints in `assets/site.js`: `leadsUrl` (Apps Script web app) and `web3formsKey` (client-side keys by design).

## Apps Script + Google Sheet

- Script source to paste: `tools/apps-script-diagnostic.gs` (Leads / Quarantaine / Blocklist tabs, callbacks, triggers).
- Whether the current version is pasted and redeployed: **unknown** (needs Walid). Until it is, leads may not land in the Sheet.
- Sheet contents ("Test" line only, 10 rows ready to paste per the setup document): not checked.

## Firebase / Twilio

- Twilio code is merged (`api/send-otp.js`, `api/check-otp.js`); it turns on only when its env vars exist
  in Vercel. Whether they are set: **unknown**.
- Firebase (Blaze billing switch, Nov 12): not checked; no Firebase code in this repo.

## Content files

- **Not found on this computer:** hook bank (30 hooks), playbook, sprint plan, batch 1 + batch 2 reels,
  HOLDING v2, the Similar Creators report. Likely in Google Docs or Claude chats. `[TO CONFIRM: where]`
- **Found in `C:\Users\walid\W-Heritage-Studio\notes`:** `AD1.md`, `AD1_script.md`, `AD2.md`, `CAR5.md`,
  `SEAN1.md`, `TOFU1.md`, `VSL1_plan.md`, `VSLAD.md`, `letemps.md`, `v1026.md`.

## Outreach accounts (setup document §2.10)

Serper, Reoon, TrulyInbox: state unknown, needs Walid. Nothing checked from here.

## Claude Code setup (this branch, `setup/claude-operating-system`)

`.agents/product-marketing.md`, `.agents/brand.md`, `.agents/design.md`, `.claude/rules/w-heritage.md`,
`.claude/agents/` (5 agents), `.mcp.json` (Vercel + GitHub), `docs/state.md`, `docs/inventory.md`,
`docs/verification-log.md`, `docs/decisions.md`, `docs/loops.md`.
