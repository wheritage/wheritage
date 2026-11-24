# W Heritage — state

Loaded into every new Claude Code session in this repo by the SessionStart hook. Keep it current:
PR queue, test results, decisions, open questions. Business context: `.agents/product-marketing.md`.

## PR queue (from git, 2026-11-24)

- **Merged into `main`:** PRs #9, #11–#27. Includes #19 (VSLs), #20 (Web3Forms simple keys + `?debug`),
  #21 (new Web3Forms key), #22 (pixel), #23 (anti-fake leads + Twilio SMS), #24, #25 (Business OS),
  #26 (Quebec/Ontario area codes, email endings), #27 (UTM provenance in the Cal.com note, merged 2026-11-19).
  The setup document (Nov 24) still lists #19/#20/#23/#25/#26/#27 as open: it is out of date on this point.
- **Unmerged branch, no PR number known:** `claude/youthful-davinci-t65vec` (2026-11-20/21) —
  "Refonte v2: système noir et blanc", new home, Expertise, Entrepreneurs, Contact and Guide pages,
  248 files. Changes the brand away from black and gold. Not reviewed.
- **Old unmerged branches (Sep–Oct):** `ccr-5f808459-p2d0n0`, `ccr-61f7522e-y6xzon`, `ccr-c03a9951-n8f5cv`,
  `claude/emil-kowalski-skills-0vmefz`. Status unknown; nothing deleted.
- **#28 merged 2026-11-24** (`setup/claude-operating-system`): Claude Code setup + 3 HIGH fixes. Live: internal
  files return 404, `lead-guard.js` 2.0.1 served. Apps Script part waits for Walid to paste + redeploy.
- **Branch `fix/utm-provenance`** (not merged): ad provenance kept for the whole visit and written into the
  Cal.com note on /strategie-societe AND /diagnostic (`assets/provenance.js`).

## Test results

- 2026-11-24 (after fixes): `node tools/test-leads.mjs` 35/35 · `node --test tools/test-lead-guard.mjs` 26/26 (new) ·
  `node tools/test-apps-script.mjs` 28/28 (5 new security checks). Details: `docs/verification-log.md`.

## Review findings (2026-11-24, code-reviewer + security-reviewer)

- **FIXED in #28 (lead-guard live; Apps Script part live once pasted):**
  - Real prospects refused by `assets/lead-guard.js` (Jean-Michel, admin@, .ai/.dev/.pro/…, surnames Ewert/Schwertz/Na).
  - Google Sheet formula injection in the Leads tab (`esc_` on every value in `pipeline_`).
  - Missing/stale/foreign server proof now means « À vérifier » and no automatic callback, when `LEAD_PROOF_SECRET` is set.
- **Still open — MEDIUM:** send-otp not gated by a verify-lead proof (moot while Twilio is off); per-instance rate
  limits without KV; per-email limit trips on contact form + diagnostic within an hour; `remindProspect_` can email
  any address if `RAPPEL_PROSPECT=1`; no CSP/HSTS headers. (UTM provenance: fixed on `fix/utm-provenance`.)
- **Known trade-off of the proof fix:** if `/api/verify-lead` is down, a real lead lands in « À vérifier » with no
  automatic callback while the Web3Forms email still reads like a clean lead — check that tab daily.
  (Journal appels + Blocklist writes are escaped too.)
- **Still open — LOW:** phone extensions refused; `?debug` innerHTML unescaped; OTP proof reusable 6 h without
  `lead_id`; any row overwritable by `lead_id`.
- **Account settings (Walid):** turn off Meta "Automatic advanced matching"; enable Web3Forms domain restriction.

## Decisions

- 2026-11-24: Claude Code setup follows `claude-code-setup-w-heritage.md`; W Heritage rules and custom
  agents live in this repo's `.claude/`, not globally.
- 2026-11-24 (Walid): lower third « Conseiller en sécurité financière · Industrielle Alliance ».
- 2026-11-24 (Walid): gold = "a warm but premium gold" → working value `#C9A84C` (live site).
- 2026-11-24 (Walid): Twilio is no longer used. SMS-verification code stays in the repo, inactive without env vars.
- 2026-11-24 (Walid): cancel ElevenLabs Starter (before Nov 25 EST). Walid cancels it in his account.
- 2026-11-24: hook bank, playbook and creators report were lost; new versions created in `docs/` (hooks all NOUVEAU).
- 2026-11-24: internal files (`CLAUDE.md`, `.claude/`, `.agents/`, `docs/`, `.mcp.json`) excluded from deploys via `.vercelignore`.

## Next steps for Walid (in order)

1. **Cancel ElevenLabs Starter** today (renews Nov 26; cancel before Nov 25 EST).
2. **Apps Script** (probably never pasted): open the Sheet → Extensions → Apps Script; replace the code with
   `tools/apps-script-diagnostic.gs` AND add/replace a `LeadGuard.gs` file with `assets/lead-guard.js`;
   Deploy → Manage deployments → edit the web app → New version. Until then leads may not land in the Sheet.
3. **`LEAD_PROOF_SECRET`**: the same long random value in Vercel (env var) AND Apps Script (Script Properties).
   Both or neither: set in only the Apps Script, every lead becomes « À vérifier ».
4. ~~Merge #28~~ done 2026-11-24. Merge `fix/utm-provenance`, then run the live checks in `docs/verification-log.md`.
5. Approve or edit the 30 hooks in `docs/hook-bank.md` (H13 needs an EN keyword).

## Open questions

- Is the black-and-white redesign (`claude/youthful-davinci-t65vec`) going ahead? It decides the brand.
- Final type pairing (live site: Cormorant Garamond + Montserrat).
- The firm's required disclosure wording for ads and emails (beyond the lower third).
- Set `GITHUB_PAT` (env var) for the GitHub MCP; sign in to the Vercel MCP via `/mcp`.
- Prune marketing skills not used here (aso, paywalls, churn-prevention, directory-submissions, popups, public-relations)?
- Canva Pro (gaming project): restart cancellation or let it end Dec 6?
- Claude export scope; did the Monday Nov 23 calls happen; have any of the 7 ready reels been filmed;
  is the outreach stack for the 153 "Lead entrant" leads?
