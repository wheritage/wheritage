# AICM — Design System

Adapted from Emil Kowalski / Impeccable / interface-design taste principles. Live `/taste`
scraping of linear.app, stripe.com and aicm.io was blocked by this environment's network
egress policy (confirmed 403 policy denial at the proxy, not a config bug), so this system
is built directly from the skills' structural principles rather than scraped tokens — no
invented "trendy" colors, every choice traced to product intent below.

## Intent

- **Who:** a technical, skeptical evaluator — has seen a hundred "Web3 AI" landing pages
  that are all hype and no mechanism. Arrives from a protocol thread or a dev-community link.
- **Job:** decide in seconds whether AICM is real infrastructure or vaporware, then find the
  actual mechanism (discovery → negotiation → settlement), then read the spec or launch the app.
- **Feel:** technical documentation crossed with a trading ticker. Precise, numerate,
  unhurried, confident without hype. Cold and exact — never glossy.

## Domain exploration

- **Concepts:** ledger, settlement, escrow, order book, registry, handshake, counterparty,
  clearing, uptime, spread.
- **Color world** (what actually exists in this domain — a ledger book + a server room + a
  trading floor): warm ledger paper, near-black ink, terminal-amber status lights, graphite
  server enclosures, muted verified-green (like a completed-trade checkmark).
- **Signature element:** "The Ledger Line" — a live-look monospace settlement ticker
  (scrolling anonymized agent-to-agent transaction records) used as a hero band, section
  divider, and footer motif. Paired with a Request → Settlement two-column diagram in
  "How it works."
- **Rejected defaults:**
  - Dark navy/black + purple-blue gradient blobs + glass cards (generic Web3/AI SaaS) →
    warm paper base, zero gradients, zero blur, inset 1px borders only.
  - Icon-title-description 3-card grids → a dense spec-sheet comparison table + the ticker.
  - Generic hero copy ("Welcome to the future of AI commerce") → copy that reads like a
    protocol spec / changelog entry.

## Tokens

Two surface families — **paper** (light, primary) and **graphite** (dark, signature band) —
share one warm-black hue so the palette reads as one material system, not two themes bolted
together.

| Token | Value | Role |
| --- | --- | --- |
| `--paper` | `#F7F4EC` | primary background |
| `--paper-raised` | `#FBF9F4` | card / raised surface |
| `--paper-sunken` | `#EFEAE0` | inset surfaces (code block, inputs) |
| `--ink` | `#18140F` | primary text |
| `--ink-secondary` | `#5B5346` | supporting text |
| `--ink-tertiary` | `#8D8471` | metadata / labels |
| `--ink-muted` | `#C2BAA8` | disabled / placeholder |
| `--line` | `rgba(24,20,15,.12)` | standard border |
| `--line-soft` | `rgba(24,20,15,.07)` | soft separation |
| `--line-strong` | `rgba(24,20,15,.30)` | emphasis border |
| `--accent` | `#9A4B14` | single accent — buttons, links, focus |
| `--accent-hover` | `#7E3D10` | accent hover/active |
| `--accent-soft` | `rgba(154,75,20,.10)` | accent hover fill / tag bg |
| `--verified` | `#3F6B45` | semantic "settled" state only |
| `--verified-soft` | `rgba(63,107,69,.12)` | verified badge bg |
| `--graphite` | `#17140F` | dark band background |
| `--graphite-raised` | `#201C15` | dark band card |
| `--graphite-fg` | `#F3EFE6` | text on graphite |
| `--graphite-fg-secondary` | `#B3AA97` | supporting text on graphite |
| `--graphite-line` | `rgba(243,239,230,.14)` | border on graphite |
| `--graphite-accent` | `#E08A3E` | accent on graphite (lighter, for contrast) |

**Depth strategy:** borders only. No drop shadows, no gradients, no glassmorphism — inset
1px lines define every surface boundary.

**Radius:** small and mostly sharp — 3px controls, 6px cards. A technical product should not
feel soft.

**Spacing:** 8px grid. Only even Tailwind spacing steps are used (2, 4, 6, 8, 10, 12, 16, 20,
24, 32...).

## Typography

- **IBM Plex Sans** — headlines and body. Chosen over Inter deliberately: Plex was designed
  for technical/engineering contexts, which matches "reads like a protocol spec."
- **IBM Plex Mono** — labels, eyebrow tags, the ticker, data, nav wordmark. Ties directly to
  the ledger/terminal domain.
- Shipped via `@fontsource` (npm-hosted font files) rather than `next/font/google`, since
  this environment's network policy blocks the Google Fonts CDN at build time.

## Motion (emil-design-eng)

- Entrance: `ease-out`, `cubic-bezier(0.23,1,0.32,1)`, 400-600ms for section reveals
  (marketing-context, so longer than the 300ms UI cap is appropriate).
- Interaction feedback (buttons, links): ≤200ms, `scale(0.97)` on `:active`.
- The Ledger Line ticker: pure CSS `transform: translateX()` marquee — off main thread,
  never drops frames, pauses on `prefers-reduced-motion`.
- Only `transform` and `opacity` are animated anywhere. No layout properties.
- Stagger on multi-item reveals: 60-80ms between items.
