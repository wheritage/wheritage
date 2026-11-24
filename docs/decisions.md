# W Heritage — Decisions

Why things are the way they are. Each entry: date · decision · reason · source.
Phase 5F: when Walid provides the Claude data export, the decisions and reasoning behind the funnel and
content work get added here. `[TO CONFIRM: export scope — W Heritage funnel only, or everything?]`

## From the repo and the setup document (2026-11-24)

- **Self-hosted Lenis/GSAP, no third-party CDN** — so no CDN sees visitors' IPs (Loi 25). Source: `CLAUDE.md`.
- **Every « Réserver » link goes to `/diagnostic`**; the home page no longer embeds a calendar. Source: `CLAUDE.md`.
- **Web3Forms field keys are simple (`nom`, `courriel`, …)**: a test once sent no email because keys like
  "Q1. Quel âge avez-vous?" were rejected. Source: setup document §5B (PR #20).
- **A lead is never lost**: forms fall back to the local LeadGuard verdict if `/api/verify-lead` is down. Source: `CLAUDE.md`.
- **Never block a whole « 444 » substring or fixed VoIP numbers**: both lose real Quebec clients. Source: `CLAUDE.md`.
- **Meta pixel fires `Lead` only for qualified business owners**; `ViewContent` on `/strategie-societe`. Source: setup document §2.4.
- **Conversational reel format** (fixed hook, 3 loose ideas, fixed CTA), not memorised scripts. Source: setup document §2.5.
- **`DM SOUMISSION` rejected** for Leo; keyword is `MAGASINE`. Source: setup document §2.8.
- **Morocco–Montreal gap is 5 hours** (Morocco on permanent UTC+0 since 2026-09-20). Source: setup document §2.11.
- **Supabase project `mcioxeabylusmrvbmxgs` is not W Heritage**: leave it alone. Source: setup document §4.

## Walid's decisions (2026-11-24)

- **Booking:** the site keeps the 15-minute call; Walid books the 90-minute session after talking to the prospect.
- **Hooks:** the 30 hooks in `docs/hook-bank.md` are approved (wording); compliance notes per hook still apply.
- **Marketing skills:** keep all of them (including aso, paywalls, churn-prevention, directory-submissions,
  popups, public-relations) until a use is found.
- **ElevenLabs Starter:** cancelled.
- **Redesign v2:** approved — black / ivory / stone, muted gold `#B49A70` for accents only, new pages
  Expertise / Entrepreneurs / Contact / Guide. Merged onto #28–#33 on `feat/redesign-v2`.
- **Title / gold / Twilio:** see `.agents/product-marketing.md` §1 and §12.

## Claude Code setup (2026-11-24)

- W Heritage rules and the 5 custom agents live in this repo's `.claude/`, not globally, so they never
  apply to other projects (e.g. the gaming project).
- Hooks: SessionStart loads `docs/state.md`; SessionEnd/PreCompact log to it. Repo is on the allow list.
- `brand.md` follows the site's design system v2 (approved 2026-11-24).
