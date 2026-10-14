---
name: painted-animation
description: Hand-painted watercolour cartoon starring Clawd (or any character) made in p5.js + p5.brush, rendered frame by frame in headless Chrome and encoded with ffmpeg. Use for "/painted-animation", a painted or watercolour cartoon, a mascot or character explaining an idea (finance included), boil-effect / brush-stroke / flat 2D animation, or anything asking for Clawd's emotions, dances, idle wander, listen / sleep / pet. Not for kinetic type, UI demos or live footage.
---

# Painted animation (Claude Animation Base)

This folder is the starter kit from github.com/JohnHeibel/ClaudeAnimationBase (MIT, see LICENSE and
`.claude/skills/SOURCES.md`). The kit itself is the instruction set: **read `ANIMATION_GUIDE.md` in this
folder in full before drawing anything.** It holds the rules, the workflow, the review loop and the API
for Clawd (31 emotions, five key views, hats, emotes, dances) and the engine.

## Set up a film

Never build inside the skill folder. Each film gets its own copy of the kit:

```bash
SKILL="<this skill's base directory>"
FILM=studio/painted/<slug>            # lowercase, hyphens, from the repo root
mkdir -p "$FILM" && cp -R "$SKILL"/{ANIMATION_GUIDE.md,render.mjs,gpu_probe.mjs,package.json,package-lock.json,studio.html,src,docs} "$FILM"/
cd "$FILM" && npm install
```

Then work in `$FILM` exactly as the guide says: storyboard first, scenes in `src/scenes/`, check with
`node render.mjs --sheet=…` / `--strip=…` contact sheets, final `node render.mjs --clip --out=out/video.mp4`.
Chrome: `render.mjs` finds Chrome, or a Playwright Chromium on Linux; otherwise pass `--chrome=<path>`.
No GPU: add `--soft-gl` and keep watercolour fills light (the guide explains why).

## Non-negotiables (from the guide)

- Paint everything with p5.brush through `paint()` and `inkLine()`. Never plain p5 shapes (`rect`, `ellipse`, `fill()`).
- Linework boils (`BOIL`), flat 2D only, drawn key views instead of 3D turns.
- No text unless the user asks for it; then `letter()`, one or two words, once.
- Every seam gets a transition; every shot has an event; time it for a first-time viewer.

## W Héritage use

Content in French, tutoiement for social. When a finance idea needs a word on screen (the guide allows
it when the user asks), keep it to one or two painted words and let Clawd act the rest. Palette may lean
on noir / or (`#080808` / `#C9A84C`) but the guide's "no pure black or white" still applies: use `PAL.ink`.
