# W Héritage — wheritage.vercel.app

Static site (plain HTML/CSS/JS, deployed on Vercel with `cleanUrls`). No build step, no package.json.
Shared design system lives in `assets/site.css`: noir `#080808`, or `#C9A84C`, Cormorant Garamond
(titles) + Montserrat (body), **no rounded corners**, film grain on `body::after`, signature curve
`--ease-out: cubic-bezier(.16,1,.3,1)`. Pages are bilingual through `[lang="fr"]` / `[lang="en"]`
spans toggled by `html[data-lang]`. Positioning: *Stratège, pas vendeur.* Tutoiement in social
content, vouvoiement on the site.

## Motion & video-edit animation skills

Installed in `.claude/skills/` (project scope). Use them for **video editing animations**: reel
overlays, motion titles, animated explainers, 3D backgrounds and anything screen-recorded or
exported into an edit. Goal: motion that reads as directed, not as a generic AI template.

| Need | Skill(s) | Source |
|------|----------|--------|
| 3D scenes, particles, lighting, GLTF, camera moves | `threejs-fundamentals`, `threejs-geometry`, `threejs-materials`, `threejs-lighting`, `threejs-textures`, `threejs-animation`, `threejs-loaders`, `threejs-shaders`, `threejs-postprocessing`, `threejs-interaction` | [CloudAI-X/threejs-skills](https://github.com/CloudAI-X/threejs-skills) |
| Timelines, text reveals (SplitText), ScrollTrigger, SVG draw, React | `gsap-core`, `gsap-timeline`, `gsap-plugins`, `gsap-scrolltrigger`, `gsap-utils`, `gsap-performance`, `gsap-react`, `gsap-frameworks` | [greensock/gsap-skills](https://github.com/greensock/gsap-skills) |
| Reverse-engineer a reference style (layout, type, palette) into tokens | `design-dna` | [zanwei/design-dna](https://github.com/zanwei/design-dna) |
| Timing, easing, choreography, Disney principles, Lottie/SVG motion | `motion-design` | [lottiefiles/motion-design-skill](https://github.com/lottiefiles/motion-design-skill) |
| Creative direction, premium polish, AI-tell audit | `cast` (one interface moves), `paint` (whole look), `bunshin` (whole site, multi-agent, costly) + shared modules in `_jutsu/` | [AThevon/genjutsu](https://github.com/AThevon/genjutsu) |

Note: the Instagram post (@ai.theshift) spelled the Three.js repo `ClaudeAI-X`; the real one is
`CloudAI-X/threejs-skills`. Pinned commits are listed in `.claude/skills/SOURCES.md`.

### Workflow for a video-edit animation

1. **Direct first** (`motion-design`): name the emotion, pick ONE personality (W Héritage =
   *Premium*), define primary / secondary / ambient layers before writing code.
2. **Style** (`design-dna`): when copying a reference look, extract its DNA into tokens, then map
   them onto the W Héritage tokens above. Never ship the reference's colours over ours.
3. **Build**: GSAP master timeline for everything that is choreographed; Three.js only for the
   ambient/3D layer. Drive the 3D scene from the timeline's time, not the wall clock, so every
   frame is scrubbable and records identically.
4. **Audit** (genjutsu `_jutsu/tells/references/web.md`): strip AI tells before delivery.

### W Héritage motion rules (house style)

- Premium personality: 350–600 ms for UI, 0.9–1.4 s for title reveals, **zero overshoot/bounce**.
- One signature ease for 80% of moves: `--ease-out` / GSAP `"expo.out"`; exits accelerate
  (`"power2.in"`) and run ~35% shorter than entrances.
- Slow, confident rhythm. No 0.5 s jump cuts, no shakes, no emoji pops (brand: never TikTok-aggressive).
- Text reveals: lines rising out of a mask, staggered 60–100 ms. Not letter-by-letter typewriter.
- Ambient layer moves at most ~1/3 the speed of the primary layer.
- Banned (genjutsu tells): infinite pulsing loops with no state behind them, neon glow /
  `box-shadow: 0 0 40px`, blurred colour blobs, gradient text, glassmorphism, invented figures
  or "since 20XX" badges, numbered section eyebrows, scroll cues, em dashes in on-screen copy.
- Stretched SVG strokes (`preserveAspectRatio="none"` + `non-scaling-stroke`) fragment under DrawSVG;
  draw those with a `clip-path: inset()` wipe instead. DrawSVG is fine on uniformly scaled SVGs.
- Respect `prefers-reduced-motion`: cut to resolved frames, keep opacity fades only.

## Video studio (one command per style)

`/video-studio` picks for you. Sources, commits and licences: `.claude/skills/SOURCES.md`. Work and
renders live in `studio/` (git-ignores `out/`, excluded from the Vercel deploy by `.vercelignore`).

| Need | Command | Engine / where |
|------|---------|----------------|
| Daily TikTok/Reel tip from a raw take | `/remotion-reel` | Remotion project `studio/remotion/` (silence cuts, Whisper word captions, screen rec on keyword, lower third, punch-ins, progress bar, `renderVariants(['hook1'…'hook5'])`) |
| Motion graphics, text animation, agency-style reveal | `/hyperframes` | HeyGen HyperFrames, HTML + GSAP, `npx hyperframes preview` / `render -o out.mp4` |
| Premium launch / service explainer, Linear/Stripe feel, one continuous take | `/onetake` | `references/motion-library.md` + `references/composition.md`; PolyForm **Noncommercial** licence |
| B-roll explaining REER, CELI, succession as self-assembling paper collage | `/collage-broll` | MaxFusion MCP (Gemini first/last frame), three approval gates |
| Story, emotional cartoon, mascot explaining finance | `/painted-animation` | Clawd kit, p5.js + p5.brush, films in `studio/painted/<slug>/` |
| Short film / storytelling / viral concept film (43 coded styles) | `/lemo-opuscar` | Library cloned to `~/lemo-opuscar` on first use |

Prerequisites: Node 18+, ffmpeg (`brew install ffmpeg`), Chrome. MCP servers in `.mcp.json`:
`playwright` and `maxfusion` (authenticate on first use). Remotion runs from the project's own
`node_modules` (`npx remotion …`), so no global install is required. House style above still applies
to every engine: emoji pops stay off unless asked for a specific reel.

## Demo

`motion-lab.html` (+ `assets/motion-lab.js`) combines the five skill sets: a 9:16 / 1:1 / 16:9
reel composition with a scrubbable GSAP master timeline, SplitText line reveals, SVG stroke wipes,
and a Three.js gold-dust field that resolves into the W mark. It is `noindex` and not in the
sitemap. Recording mode (`H`) hides the controls for screen capture; `?t=4.5` opens at a time;
`window.motionLab.seek(seconds)` gives frame-exact stills for headless export.
