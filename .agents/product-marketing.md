# W Heritage — Product Marketing Context

Source of truth for every marketing skill. Read this before doing anything for W Heritage or Leo.
Do not invent, soften or "improve" any fact. Items marked `[TO CONFIRM]` are open questions for Walid:
leave them exactly as written and ask.

> **Adaptation note:** the marketing skills were written for SaaS. Translate: signup = book a discovery
> call, activation = attend the session, churn = no-show. The compliance rules in §7 override any
> SaaS-default copy a skill suggests.

---

## 1. Business

- **Person:** Walid Harchaoui, financial security advisor (conseiller en sécurité financière), licensed in Quebec and Ontario.
- **Brand:** W Heritage. Visual identity: black and gold. Provisional gold `#D5B65A`, black `#090A0C` — `[TO CONFIRM: exact gold shade]`. Type: Montserrat + Inter (provisional). *(See §12: the live site uses different values.)*
- **Professional Instagram:** `walidh.csf` (use the professional account only).
- **Languages:** French-first for Quebec, English for Ontario. One concept is recorded as two native-language versions — never mix French and English in one video.
- **Professional title and firm for video lower thirds (confirmed by Walid 2026-11-24):** FR « Conseiller en sécurité financière · Industrielle Alliance », EN "Financial Security Advisor · Industrielle Alliance". `[TO CONFIRM: the firm's exact required disclosure wording, if any, for ads and emails]`.
- **Gold (direction confirmed 2026-11-24):** "a warm but premium gold". Working value: the live site's `#C9A84C` (see §12 and `.agents/brand.md`).

## 2. Audience

Incorporated business owners ($300k+ income/revenue), entrepreneurs, high-net-worth clients, growing teams, and family businesses. Niche audience — success is owners watching to the end, saving, and DMing, NOT millions of views.

## 3. The 7 pillars (all content and all funnel work maps to one of these)

1. Key-person insurance
2. Buy-sell / shareholder-agreement funding
3. Holding companies / creditor protection / insurance strategies
4. Estate / legacy / intergenerational transfer
5. Retirement income without an employer pension
6. Group benefits for growing teams
7. Family business succession

## 4. Offer and funnel

- **Core offer:** complimentary 90-minute Wealth Strategy Session, booked via Cal.com. Qualification matters (asset/income bands, spouse attends) — model it on the verified Guerra Wealth funnel, not on a generic "book a call" page.
- **Booking decision (Walid, 2026-11-24):** the site books the **15-minute call** (`cal.com/wheritage/rencontre-strategique-15min`). Walid books the 90-minute session himself after that call. Copy must not promise the 90-minute session as the first step.
- **Entry point:** the diagnostic quiz funnel at `/diagnostic` — 10 questions → result page with VSL + Cal.com booking → instant email follow-up. The quiz is also the free tool (see `free-tools`): the "Score de protection de ton entreprise" concept — no competitor has a diagnostic, that is the opening.
- **Second page:** `/strategie-societe` — carries the VSLs, sends `ViewContent` on load; Meta pixel fires `Lead` only for qualified business owners.
- **Email:** Web3Forms instant email for every diagnostic and guide submission (same key as the home contact form). Quiz email is always in French and includes all 10 answers, qualification, consent timestamps, UTMs, and niche. Reply-to goes to the visitor. No email if the visitor skips contact.
- **UTMs (already in the Meta ads, the page must not drop them):** `utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}`. Example live campaign: "W Héritage | Leads | 3e porte | VSL", ad `AD2_v3`.
- **Lead magnets:** the HOLDING checklist (pay-yourself: salary vs dividends for incorporated owners) — 6 points: current pay split, RRSP room, insurable income, payroll charges, the mix, the goal. Footer: general information only, not personalized tax/financial advice.
- **Site:** repo `github.com/wheritage/wheritage`, deployed on Vercel (`wheritage.vercel.app`). Live preview for funnel work: `https://wheritage-git-claude-upbeat-clarke-npku5m-w-heritage.vercel.app`.

## 5. Content system (how every reel is built)

- **Format — conversational, everywhere:** fixed hook (exact wording, a readable claim or a specific number, NEVER a polite question) + 3 talking-point ideas (spoken as a chat with someone the user has known for a long time, loose enough to say in his own words) + fixed CTA (exact wording: `Écris + keyword`). No memorized script, one take, lighter editing. 2–3 takes, keep the most natural. 30–40 seconds cut from ~60. Jump cuts between ideas, captions on screen.
- **Retention rule:** a visual change every 2–3 seconds (visual, sound, or movement — one of each per video, rotate combinations across the week). Open on a readable claim with the number already visible (e.g. whiteboard "10 000 $/mois" as frame 1). Hold the answer/mix as an open loop until the end.
- **DM keywords (comment keyword → DM automation is the best-converting mechanism among peers, 9+ creators use it):** `CLÉ`/`KEY`, `CONVENTION`/`AGREEMENT`, `HÉRITAGE`/`LEGACY`, `RETRAITE`/`RETIREMENT`, `ÉQUIPE`/`TEAM`, `HOLDING`, `RELÈVE`/`SUCCESSION`, plus `PROTÉGER`, `STRUCTURE`, `RACHAT`, `AVANTAGES`.
- **Cadence (Morocco sprint, Nov 24 – Dec 20, 2026):** film Tue + Thu 9:00–11:00 Casablanca (2 reels per session), edit Tue/Thu nights, post Wed / Fri / Sat / Sun 12:00 Montreal (starting slot, adjust on results). 16 reels: 7 ready (HOLDING, Personne clé, Convention entre actionnaires, Patrimoine/transfert, Retraite sans régime d'employeur, Société de gestion, Relève d'entreprise familiale) + 9 new from the creator-breakdown gaps (buy-sell #1–2, group benefits #1–3, holdco/creditor-protection whiteboard, IPP vs RRSP, Relève #2, HOLDING English version Dec 20). The 9 new ones are themes + hooks only — write the conversational scripts before filming; the first new one films Tue Dec 1. If a week slips, cut a NEW reel, never a ready one.
- **Hook bank:** 30 bilingual FR/EN hooks across the 7 pillars (the repo's hook-bank file is the source — reuse its exact hooks, do not rewrite them). The original was lost; a new bank was created 2026-11-24 in `docs/hook-bank.md`; all 30 hooks were approved by Walid the same day (compliance notes per hook still apply).
- **Production:** CapCut Pro, phone filming, 8-video batch method, target 25–35 min per video, night-editing workflow.

## 6. Verified figures — and the rule about all other figures

- **2026 RRSP dollar limit: $33,810** (18% of 2025 earned income). Verified via concordant secondary sources (Fidelity, CIBC, AGF, Raymond James). Re-check against canada.ca at filming time. This is the only pre-verified figure in the content system.
- **Every other figure in a script is an ILLUSTRATIVE example, not a client result.** Ratios must be validated with the user's accountant before filming. Never present an illustrative number as a result, and never invent a figure to make a hook stronger.

## 7. Compliance (AMF / FSRA, Loi 25, CASL) — overrides everything else

- Never invent figures, results, savings, or client stories. Never claim "pay $0 taxes", guaranteed coverage, or "cheapest".
- No cash incentive in any video or ad without the cabinet's approval first.
- Content is general information only, not personalized tax or financial advice; keep the footer on lead magnets.
- Privacy: `/confidentialite` must mention diagnostic answers and the Google Sheet — it currently does not. `[TO FIX — see Phase 5]`.
- YouTube embeds use `youtube-nocookie` (Loi 25) with 25/50/75/100% progress tracking after cookie consent.
- Never claim content is "AMF-safe". Flag anything uncertain for the user instead of smoothing it over.
- Detailed house guardrails and the pre-publication checklist: `business-os/GARDE-FOUS.md`.

## 8. Leo — separate brand, separate rules (never mix with W Heritage)

- **Who:** Leo, the user's coworker. **Product:** auto insurance ONLY, French Quebec market. Never add home insurance on your own.
- **Method:** start from a funny/viral outlier format so viewers forget it is an ad; keep insurance hidden until the last second; surprise with the CTA in the user's own words: "Tu cherches une bonne assurance pour ton char, viens magasiner". DM keyword is `MAGASINE`. `DM SOUMISSION` was rejected by the user — never use it.
- **Live concept — "La scratch":** Leo's car has a real big scratch on the left side (the prop is real and free). Walid gets out of Leo's car while Leo films; Walid says the ride was nice but he scratched it a little, "mais au moins ye assuré d'un côté!"; Leo starts "Mon tabarnak" and the video cuts at "tabar—" (before the swear); cut to the office, Leo delivers the CTA. User's own written script is in his Word doc "Idées marketing".
- **Two open flags on "La scratch" (resolve before filming):** (1) the "$4,000 par an" figure is UNVERIFIED — if it is not a real example, drop the number or say "une fortune"; (2) the "$50 if you sign the contract" cash incentive is AMF-regulated — verify with the cabinet before promising it on video.
- **Compliance for Leo concepts:** no "cheapest" claims, no guaranteed coverage, "souvent pas couvert / vérifie ta police" framing, blank/sample policies only (never a real client's), no universal exclusion claims.

## 9. Competitors and peers (Similar Creators Breakdown, Nov 23, 2026 — 20 creators profiled)

- **Closest peers:** US tax strategists for $300k–$1M+ entrepreneurs — Carter Cofield (1.1M IG), Tyler McBroom (1M), Karlton Dennis (764k), Barbara Schreihans (377k), Amanda Han (200k), Andre Pennington (170k), Mark Kohler (124k), Ana Klein (119k), Tom Wheelwright (98k). US estate attorneys — Jerry Taylor (710k), Brittany Cohen (2M+ views on "Six things I would never do"). Insurance-led: M&M Wealth / Michael Henry (180k — the only large creator whose flagship Reel is family-business succession). Guerra Wealth (13k — best-verified funnel: complimentary 90-min session with qualification bands). Money Guy (153k IG / 703k YouTube).
- **Canadians are much smaller:** Anthony Goulet (9.6k — largest Quebec French advisor found; DM `PLAN`), Navpreet Kaur (7.6k), Bhuvan Sharma (6.4k), Ashneet Singh (3k), Dundas Wealth (990 — group benefits), Objective Financial (count unverifiable — login wall).
- **Biggest openings:** buy-sell funding and group benefits are almost unowned in French. Key-person, holdco/creditor protection, and retirement-without-pension are mentioned in passing but owned by no one in French. Estate/legacy is the most crowded pillar — differentiate via corporate estate transfer (deemed disposition + CDA + corporate life insurance).
- **What converts (ranked):** 1) comment-keyword → DM automation (most common, 9+ creators), 2) DM keyword, 3) link-in-bio → free call/review (Calendly/form), 4) free lead magnet (guide/kit/masterclass), 5) webinar/workshop bridge, 6) quiz/diagnostic — only Wheelwright has one, that is the opening, 7) email/newsletter.
- **What grabs attention (ranked hooks):** dollar-figure shock in frame 1; audience + pain callout; "I would never" / expert confession; myth-busting; newsjacking; ranking/tier-list; death-tomorrow story. Retention: numbered list with payoff withheld, whiteboard/live visual change every 3–5s, pattern-interrupt location, duo/reaction, word-by-word captions.
- **Caveats:** Instagram shows no public view counts in the search index, so "top videos" are by index prominence/likes/comments, NOT a verified view ranking — never invent view numbers. No creator publishes conversion rates or cost-per-call. ManyChat/Calendly tooling is inferred except Guerra (Calendly verified).
- **Full report:** the setup document points to `research_notes/similar-creators-top-videos-conversion-20261123-2032/report.md` in the user's workspace. The original was not found; a reconstruction from this section is in `docs/competitors/2026-11-23-similar-creators-breakdown.md` (2 of the 20 creators are unrecoverable).

## 10. Outreach stack (set up Nov 23, 2026 — verify state, do not assume)

- **Serper:** verification email sent; 2,500 free credits on verification. Check whether the account is verified.
- **Reoon:** activation code was valid 20 minutes and has expired — if the account is not activated yet, request a fresh code; do not reuse the old one.
- **TrulyInbox:** 7-day trial started Nov 23. Warm-up starts the moment a mailbox is connected (`https://my.trulyinbox.com/email-accounts`) — connect every mailbox planned for outreach; waiting loses trial days.
- **Leads:** 153 unworked "Lead entrant" leads in the CRM (166 leads total). Working rule: 10–15 contacts/day. Verify addresses in Reoon before any send. Never send outreach without the user's approval of the exact batch.
- **Open question:** confirm with the user whether this stack is for the 153 "Lead entrant" leads.

## 11. Time (earlier briefs got it wrong)

- Morocco is on permanent UTC+0 since Sun Sep 20, 2026 (Decree No. 2.26.530). Casablanca = UTC+0. Montreal (EST) = UTC-5. **The gap is 5 hours, not 6.** The pre-Sep-20 rule (Casablanca stays UTC+1 all winter) is dead — never use it, and correct any file that still says 6h.

---

## 12. Repo facts that differ from the setup document (found 2026-11-24 — Walid to settle)

These come from reading the repo, not from the setup document. Do not resolve them yourself.

- **Brand tokens on the live site** (`assets/site.css`, `CLAUDE.md`): gold `#C9A84C` (with `#DDBE68` vivid, `#EAD6A2` pale, `#8E7431` dark), black `#080808`, text `#EDE8DF`, cream `#F7F2EA`; type **Cormorant Garamond** (titles) + **Montserrat** (body). The setup document's provisional values (`#D5B65A`, `#090A0C`, Montserrat + Inter) are not used anywhere on the site. `[TO CONFIRM: which set is the brand]`
- **PR #27:** the latest commit on `main` is "Merge pull request #27 from wheritage/claude/gallant-volta-r3f2of" (2026-11-19). The setup document lists #27 as not merged. To be verified in Phase 5.
- **Title:** confirmed 2026-11-24, see §1.
- **Twilio:** no longer used (Walid, 2026-11-24). The SMS-verification code is still in the repo but stays off
  without its Vercel env vars; the diagnostic skips the verification step.
- **Apps Script:** the current `tools/apps-script-diagnostic.gs` is probably NOT pasted/redeployed (Walid, 2026-11-24).
- **ElevenLabs Starter:** cancelled by Walid (2026-11-24).
- **Tone (from `CLAUDE.md`):** *Stratège, pas vendeur.* Tutoiement in social content, vouvoiement on the site.
