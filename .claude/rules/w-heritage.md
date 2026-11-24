# W Heritage rules (always on in this repo)

These override any conflicting default in a skill, agent or global rule. Business context:
`.agents/product-marketing.md` (read it first). Compliance detail: `business-os/GARDE-FOUS.md`.

1. **Compliance first.** Verify every figure before it appears in copy or a script. Flag invented figures
   and cash incentives BEFORE drafting, not after. Never present illustrative numbers as client results.
2. **Brand separation.** Confirm brand + product + format with the user before drafting anything. Never
   carry a format, product, or CTA between W Heritage and Leo. A new message may be a scope change:
   recheck before applying an earlier direction.
3. **Funnel discipline.** No PR is merged without (a) code-review + security-review, (b) the live checks
   in `docs/verification-log.md`, (c) one real test booking and one real test lead in the Sheet.
4. **Language.** French-first for Quebec, English for Ontario. Never mix languages in one video.
5. **Approval.** No action on accounts, no purchases, no sends, no merges without the user's explicit
   approval for that exact action.
6. **Numbers.** The only pre-verified figure is the $33,810 RRSP limit (product-marketing §6). Everything
   else is illustrative until the user or his accountant confirms it.

## How the global everything-claude-code rules apply here

- The site is static HTML/CSS/JS with no build step. `testing.md`'s 80% coverage and TDD apply to code in
  `assets/*.js`, `api/` and `tools/` (tests: `node tools/test-leads.mjs`, `node tools/test-apps-script.mjs`),
  not to copy, scripts, docs or content work.
- Never put secrets in chat or committed files; keys live in Vercel env vars or `.env` (see `.env.example`).
- At the end of a work session, update `docs/state.md`: PR queue, test results, decisions, open questions.
