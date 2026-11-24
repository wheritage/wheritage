# W Heritage — Recurring loops (Phase 6)

Defined with the `marketing-loops` skill's shape: trigger, job, what it reads, what it writes, when it
stops. Every loop drafts and reports; none sends, posts, spends, merges or changes an account.
Times: Casablanca = UTC+0, Montreal = UTC-5 (5-hour gap).

## Weekly — Monday

Start a session in this repo and say: **"Run the Monday loop from docs/loops.md."**

| Order | Agent | Job | Writes | Stops when |
|---|---|---|---|---|
| 1 | `competitor-watcher` | New reels, hooks, CTAs from the top 5 peers (product-marketing §9) | `docs/competitors/YYYY-MM-DD.md` | 5 peers covered, max 5 "worth adapting" items |
| 2 | `content-strategist` | Draft this week's reels from the sprint + hook bank, with compliance flags | `docs/reels/YYYY-Www.md` | every planned reel has a draft or a stated blocker |
| 3 | `outreach-operator` | Call sheet (10–15 contacts/day) + this week's cold-email batch, **drafts only** | `docs/outreach/YYYY-Www.md` | batch ready for Walid's approval |
| 4 | `ads-analyst` | Meta spend/results, cost per booked call, pixel + UTM integrity | `docs/ads/YYYY-Www.md` | numbers read or marked MISSING |
| 5 | `funnel-verifier` | Re-run the live checks (diagnostic email, booking path, VSL playback) | rows in `docs/verification-log.md` | each check PASS/FAIL with evidence |
| 6 | main session | Update `docs/state.md`: what changed, what is blocked, decisions needed | `docs/state.md` | — |

Rules: run 1–5 as parallel agents when they don't share files; anything needing an account, a send or
a real booking becomes a line in "Decisions needed" for Walid.

## Daily during the sprint (Nov 24 – Dec 20, 2026)

- **Tue + Thu, before 9:00 Casablanca (filming):** "Run the filming check." → the 2 reels for today,
  hook printed exactly, 3 ideas, CTA, props/whiteboard frame 1, compliance flags cleared or listed.
- **Wed / Fri / Sat / Sun, before 12:00 Montreal (= 17:00 Casablanca, posting):** "Run the posting check." →
  which reel, caption, DM keyword + automation reply ready, language version, cover frame.
- If a week slips: cut a NEW reel, never a ready one.

## Monthly (first Monday)

- `marketing-plan`: numbers vs targets (50 calls / 8 meetings per week).
- `offers` / `pricing`: review the 90-minute session offer against the Guerra model.
- `revops`: Leads sheet hygiene (the setup document says it holds only a "Test" line; 10 ready rows exist locally).

## Scheduling

Not scheduled yet. When Walid wants them automatic, the Monday loop and the daily checks can become
scheduled tasks (`/schedule` or the app's scheduled tasks) — his decision, per loop.
