---
name: video-studio
description: Router for the W Héritage video studio. Use for "/video-studio", "which video skill", or a video request that names no style; picks one of the six style commands (remotion-reel, hyperframes, onetake, collage-broll, painted-animation, lemo-opuscar) and hands over.
---

# Video studio: pick one style, then hand over

| The request is… | Command | Engine |
|---|---|---|
| Daily TikTok / Reel tip from a raw take (cuts, captions, screen rec on cue, hook variants) | `/remotion-reel` | Remotion, `studio/remotion/` |
| Motion graphics, kinetic text, agency-style reveal, deterministic 4K from HTML/CSS/SVG + GSAP | `/hyperframes` | HeyGen HyperFrames (`npx hyperframes …`) |
| Premium product launch / service explainer that feels like Linear / Stripe, one continuous take | `/onetake` | onetake (HTML comp + move library) |
| B-roll that explains a complex idea (REER, CELI, succession) as paper collage assembling itself | `/collage-broll` | MaxFusion MCP (Gemini first/last frame) |
| Story, emotional cartoon, mascot explaining finance, hand-painted | `/painted-animation` | p5.js + p5.brush, headless Chrome, ffmpeg |
| Short film, storytelling, viral concept film in one of 43 coded styles | `/lemo-opuscar` | canvas + WebGL + code music + TTS |

Steps:
1. Match the request to one row. If two fit, ask one question (deliverable length + where it is posted
   usually decides it). Do not blend engines in one deliverable.
2. Load that skill with the Skill tool and follow it. Its own approval gates and workflow win.
3. W Héritage defaults for every engine (CLAUDE.md): noir `#080808`, or `#C9A84C`, Cormorant Garamond +
   Montserrat, square corners, Premium motion personality (no overshoot, no emoji pops unless asked),
   French with tutoiement for social, no invented figures, no em dashes in on-screen copy.
4. Outputs go under `studio/<engine>/…` in this repo (ignored by Vercel), never in the site root.
