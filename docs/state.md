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
- **#29 merged 2026-11-24** (`fix/utm-provenance`): ad provenance kept for the whole visit and written into the
  Cal.com note on /strategie-societe AND /diagnostic (`assets/provenance.js`). Verified live (see log).

## Test results

- 2026-11-24 (after fixes): `node tools/test-leads.mjs` 35/35 · `node --test tools/test-lead-guard.mjs` 26/26 (new) ·
  `node tools/test-apps-script.mjs` 28/28 (5 new security checks). Details: `docs/verification-log.md`.

## Review findings (2026-11-24, code-reviewer + security-reviewer)

- **FIXED in #28 (lead-guard live; Apps Script part live once pasted):**
  - Real prospects refused by `assets/lead-guard.js` (Jean-Michel, admin@, .ai/.dev/.pro/…, surnames Ewert/Schwertz/Na).
  - Google Sheet formula injection in the Leads tab (`esc_` on every value in `pipeline_`).
  - Missing/stale/foreign server proof now means « À vérifier » and no automatic callback, when `LEAD_PROOF_SECRET` is set.
- **Still open — MEDIUM:** send-otp not gated by a verify-lead proof (moot while Twilio is off); per-instance rate
  limits without KV; `remindProspect_` can email
  any address if `RAPPEL_PROSPECT=1`. (UTM provenance: fixed in #29.)
- **Headers:** HSTS (2 y, preload), X-Frame-Options, nosniff, Referrer-Policy and Permissions-Policy are already
  sent (the review was wrong about HSTS). Only a Content-Security-Policy is missing — LOW; if added, start with
  `Content-Security-Policy-Report-Only` (Cal.com, YouTube, GA, Meta pixel, Web3Forms, Apps Script must stay allowed).
- **Known trade-off of the proof fix:** if `/api/verify-lead` is down, a real lead lands in « À vérifier » with no
  automatic callback while the Web3Forms email still reads like a clean lead — check that tab daily.
  (Journal appels + Blocklist writes are escaped too.)
- **Fixed 2026-11-24 (`fix/email-rate-limit`):** same email/phone limit raised 2/h → 5/h (contact + diagnostic +
  guide in one hour was refused); `?debug` message escaped. Tests: test-leads 37/37.
- **Still open — LOW:** phone extensions refused; OTP proof reusable 6 h without
  `lead_id`; any row overwritable by `lead_id`.
- **Account settings (Walid):** turn off Meta "Automatic advanced matching"; enable Web3Forms domain restriction.

## Decisions

- 2026-11-24: Claude Code setup follows `claude-code-setup-w-heritage.md`; W Heritage rules and custom
  agents live in this repo's `.claude/`, not globally.
- 2026-11-24 (Walid): lower third « Conseiller en sécurité financière · Industrielle Alliance ».
- 2026-11-24 (Walid): gold = "a warm but premium gold"; then redesign v2 approved → muted warm gold `#B49A70`, accents only.
- 2026-11-24 (Walid): Twilio is no longer used. SMS-verification code stays in the repo, inactive without env vars.
- 2026-11-24 (Walid): cancel ElevenLabs Starter (before Nov 25 EST). Walid cancels it in his account.
- 2026-11-24: hook bank, playbook and creators report were lost; new versions created in `docs/` (hooks all NOUVEAU).
- 2026-11-24: internal files (`CLAUDE.md`, `.claude/`, `.agents/`, `docs/`, `.mcp.json`) excluded from deploys via `.vercelignore`.

## Apps Script (done 2026-11-24, 16:07)

- Found: `doPost` (Code.gs) answered `inconnu` to every diagnostic/contact lead — they never reached the Sheet;
  `diagnostic.gs` (pasted Nov 13) was never called; no `LeadGuard.gs`; `sheet_` defined in both files.
- Done: `diagnostic.gs` = repo file (checksum match), `LeadGuard.gs` = `assets/lead-guard.js`, Code.gs routes to
  `routeLead_` before its own lock and uses `legacySheet_()`. 8 triggers installed. The site's deployment
  (`AKfycbz0suP…`, the one in `site.js`) moved from **version 2 (Nov 2)** to **version 6 (Nov 24 16:07)**.
- Watch out: an editor tab opened before the change overwrote it once. Only edit/deploy from a freshly loaded tab.
- Other active deployments (`AKfycbyynz…` v5, `AKfycbzbYNs…`, `AKfycbxK-N_…`) are not used by the site.
- `LEAD_PROOF_SECRET`: Vercel signs proofs (checked live); Apps Script value set by Walid — confirmed only when a
  real lead shows `preuve_valide = oui` in the Diagnostic tab.

## Live test lead (2026-11-24 21:11 UTC) — PASS

Email « envoyé ✓ », Diagnostic row with UTMs, `preuve_valide = oui` (secrets match), Leads row Nouveau/Hot,
callback in « Callbacks » for 2026-11-25 10:00. **Clean-up for Walid:** delete the test rows (Diagnostic row 2,
Leads row 1001) and the « CALLBACK: Walid Harchaoui » event.
**Bug found:** the Leads tab's checkbox column (« OTP vérifié ») is filled down to row 1000, so `appendRow`
puts every new lead at row 1001+, far below the old « Test » row. To fix in `pipeline_` (write to the first empty
row) or by trimming the checkboxes.

## Live test booking (2026-11-24) — PASS

Direct link `…/rencontre-strategique-15min?utm_source=meta&utm_medium=formulaire`: booking confirmed, Cal.com stores
the UTMs (« Paramètres UTM »), the webhook wrote Leads row 2 (« Calendrier »). **Clean-up for Walid:** cancel the
Dec 12 14:15 test booking, then delete Leads row 2. Ideas for later: have `fromCal_` copy the booking's UTMs into
the Sheet; the bookable event is the 15-min call, while the setup document's core offer is the 90-min session.
Leads-row fix (#31): the test-row and checkbox clean-up are done; next lead lands right under the data.

## Next steps for Walid (in order)

1. ~~Cancel ElevenLabs Starter~~ done by Walid 2026-11-24.
2. ~~**Apps Script**~~ done 2026-11-24 (see above). Was: open the Sheet → Extensions → Apps Script; replace the code with
   `tools/apps-script-diagnostic.gs` AND add/replace a `LeadGuard.gs` file with `assets/lead-guard.js`;
   Deploy → Manage deployments → edit the web app → New version. Until then leads may not land in the Sheet.
3. ~~**`LEAD_PROOF_SECRET`**~~ set by Walid 2026-11-24. Was: the same long random value in Vercel (env var) AND Apps Script (Script Properties).
   Both or neither: set in only the Apps Script, every lead becomes « À vérifier ».
4. ~~Merge #28 and #29~~ done 2026-11-24. After steps 2–3, run the live checks in `docs/verification-log.md`
   (test lead into the Sheet, test booking with the provenance line in the Cal.com note).
5. ~~Approve the 30 hooks~~ approved 2026-11-24. Still open: H13 needs an EN DM keyword.

## Open questions

- ~~Redesign v2~~ approved by Walid 2026-11-24; merged onto #28–#33 on branch `feat/redesign-v2` (not yet live).
- The firm's required disclosure wording for ads and emails (beyond the lower third).
- Set `GITHUB_PAT` (env var) for the GitHub MCP; sign in to the Vercel MCP via `/mcp`.
- Canva Pro (gaming project): restart cancellation or let it end Dec 6?
- Claude export scope; did the Monday Nov 23 calls happen; have any of the 7 ready reels been filmed;
  is the outreach stack for the 153 "Lead entrant" leads?
