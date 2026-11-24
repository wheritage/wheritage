---
name: wh-funnel-verification
description: When checking that the W Heritage funnel works (diagnostic email, Sheet landing, Cal.com booking with UTM provenance, VSL playback and progress events), or before/after a funnel change ships. Every check is observed and logged as PASS/FAIL in docs/verification-log.md.
---

# Funnel verification

Read `docs/verification-log.md` and `CLAUDE.md` (Diagnostic funnel + Anti-fake leads sections) first.

Rules:
- Observed result or it did not happen. A headless load is not a pass; a PR's claimed test count is not a pass.
- One row per check: date · check · how · expected · observed · result (+ evidence: screenshot, email, Sheet row id).
- Real bookings, real leads and real emails need Walid's go-ahead for that exact check, with test data only.

Standard checks:

| Check | How | Pass when |
|---|---|---|
| Code tests | `node tools/test-leads.mjs`, `node tools/test-apps-script.mjs` | counts recorded, 0 failures |
| Diagnostic email | `/diagnostic?debug`, test identity | page shows "Courriel Web3Forms: envoyé ✓" AND the email arrives in French with all answers, consents, UTMs |
| Sheet landing | same submission | row in Leads tab with the same `lead_id` |
| Booking provenance | `/strategie-societe?utm_source=meta&utm_medium=paid&utm_campaign=<c>&utm_content=AD2_v3` → book | Cal.com note ends with the provenance line |
| VSL playback | click each of the 3 cards on `/strategie-societe` after consent | playback starts; play/25/50/75/100 events fire |
| Pixel | consent on, qualified owner | `ViewContent` on load; `Lead` only for qualified owners |
