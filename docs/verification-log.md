# W Heritage — Verification log

Every check is observed, not assumed. A headless page load is not a pass. A PR's claimed test count is
not a pass. Format: date · check · how · expected · observed · result. Newest at the bottom.

## Launch checklist (setup document §5C)

| # | Check | Status |
|---|---|---|
| 1 | Merge decision for #25/#26/#27 | **Moot**: all merged (2026-11-13 / 11-19); review fixes merged in #28 (2026-11-24) |
| 2 | Apps Script pasted + redeployed as a new version | OPEN — needs Walid |
| 3 | Live checks after #19/#20 (VSL playback + progress events, `/diagnostic?debug` email line) | OPEN |
| 4 | One real test booking with UTM provenance in the Cal.com note + one real test lead in the Sheet | OPEN — needs Walid's go-ahead and a test identity |
| 5 | Privacy text mentions diagnostic answers + Google Sheet | Text present since PR #23; wording `[À VALIDER]` by Walid/firm |

## Checks

| Date | Check | How | Expected | Observed | Result |
|---|---|---|---|---|---|
| 2026-11-24 | Funnel pages respond | `curl` HTTP status on `/`, `/diagnostic`, `/strategie-societe`, `/confidentialite`, `/diagnostic?debug` | 200 | 200 on all five | PASS (availability only, not function) |
| 2026-11-24 | Privacy page covers diagnostic + Sheet | read live `/confidentialite` | answers, consents and spreadsheet named | §2 lists diagnostic answers/consents; §5 names Google Workspace spreadsheet | PASS (content present; legal wording not validated) |
| 2026-11-24 | `diagnostic` and `strategie-societe` are noindex | grep `noindex` in source | present | present in both | PASS |
| 2026-11-24 | Lead validator tests | `node tools/test-leads.mjs` | 35/35 | 34/35: test 33 fails — made-up domains `constructionabc.ca`, `cpa-tremblay.com` don't resolve (ENOTFOUND); test depends on live DNS | FAIL (test bug, not code) |
| 2026-11-24 | Apps Script tests | `node tools/test-apps-script.mjs` | all pass | 23 pass, 0 fail | PASS |
| 2026-11-24 | Internal files not public | `curl` live site | 404 | `/CLAUDE.md` and `/.claude/skills/SOURCES.md` return 200 | FAIL — fixed in `.vercelignore` on `setup/claude-operating-system`, live once merged |
| 2026-11-24 | Twilio Verify wired | code review | — | Code fully wired; active only with Twilio env vars. Walid: Twilio no longer used | N/A (off by decision) |
| 2026-11-24 | Lead tests after HIGH fixes | `node tools/test-leads.mjs` (test 33 now uses real domains) | 35/35 | 35/35 | PASS |
| 2026-11-24 | Real prospects accepted / fakes blocked | `node --test tools/test-lead-guard.mjs` (new, no DNS) | 26/26 | 26/26 (was 12/26 before the fix) | PASS |
| 2026-11-24 | Internal files no longer public (after #28) | `curl` `/CLAUDE.md`, `/docs/state.md`, `/.agents/product-marketing.md`, `/.mcp.json`, `/.claude/skills/SOURCES.md` | 404 | 404 on all five | PASS |
| 2026-11-24 | Fixed validator is live | `curl` `/assets/lead-guard.js` | version 2.0.1 | `version: '2.0.1'` | PASS |
| 2026-11-24 | UTM provenance across pages (`fix/utm-provenance`, local dev server) | land on `/?utm_source=meta&…&utm_content=AD2_v3`, then open `/strategie-societe` and `/diagnostic` without params | provenance line on both | `· Provenance : source meta, campagne W Héritage \| Leads \| 3e porte \| VSL, pub AD2_v3` on both; direct visit `''`; fbclid-only `pub Meta`; no console errors; `test-provenance.mjs` 8/8 | PASS (local; live after merge, then confirm with a real booking) |
| 2026-11-24 | Sheet formula injection + server proof | `node tools/test-apps-script.mjs` (5 new checks) | all pass | 28/28 (new checks failed before the fix) | PASS (code; live only after the Apps Script is pasted + redeployed) |

## Still to run (each needs a real, observed result)

- [ ] `/strategie-societe`: click each of the 3 video cards; playback starts; play/25/50/75/100 events fire after consent.
- [ ] `/diagnostic?debug` with a real test email → "Courriel Web3Forms: envoyé ✓" and the email arrives.
- [ ] Test lead lands in the Sheet (Leads tab) with the same `lead_id` as the email.
- [ ] Booking from `/strategie-societe?utm_source=meta&utm_medium=paid&utm_campaign=<campaign>&utm_content=AD2_v3`:
      the Cal.com note ends with the provenance line.
- [ ] Booking-confirmed event fires.
- [ ] `node tools/test-leads.mjs` and `node tools/test-apps-script.mjs` re-run locally (counts recorded here).
