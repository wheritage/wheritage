# Installed skill sources

Copied 2026-10-06 from the repos below (shallow clone of the default branch). Licenses are kept
next to each skill set. To update, re-clone and copy the same folders over.

| Skill set | Repo | Commit | Folders installed |
|-----------|------|--------|-------------------|
| Three.js | https://github.com/CloudAI-X/threejs-skills | `b1c6230` | `threejs-*` (10) |
| GSAP (official) | https://github.com/greensock/gsap-skills | `aed9cfd` | `gsap-*` (8) |
| Design DNA | https://github.com/zanwei/design-dna | `593e39b` | `design-dna/` (SKILL.md, references, scripts) |
| Motion Design | https://github.com/lottiefiles/motion-design-skill | `f9a8a04` | `motion-design/` |
| Genjutsu | https://github.com/AThevon/genjutsu | `1f518a7` | `cast/`, `paint/`, `bunshin/`, `_jutsu/` (shared modules, must stay a sibling of the three) |

Found via Instagram post https://www.instagram.com/p/Dd_iThjj32v/ (@ai.theshift). The post wrote
the Three.js repo as `ClaudeAI-X/Threejs-skills`; that repo does not exist, `CloudAI-X` is the real owner.

Genjutsu is also distributed as a plugin (`/plugin marketplace add AThevon/genjutsu`), which
namespaces its commands as `/genjutsu:cast` etc. Installed here as project skills they are `/cast`,
`/paint`, `/bunshin`. `design-dna/scripts` needs `npm install` inside that folder before its
measurement scripts run.

## Video studio skills (installed 2026-10-14)

One command per style; `/video-studio` routes between them. Licences travel with each folder.

| Command | Repo | Commit | Installed as | Notes |
|---------|------|--------|--------------|-------|
| `/remotion-reel` | local (this repo) + https://github.com/remotion-dev/skills | n/a | `remotion-reel/` (ours) + `remotion-best-practices`, `remotion-captions`, `remotion-render`, `remotion-studio`, `remotion-create`, `remotion-multimedia` via `npx skills add remotion-dev/skills` | Project in `studio/remotion/`, Remotion 4.0.535 pinned |
| `/hyperframes` | https://github.com/heygen-com/hyperframes | `6f90ca1` | 21 skills via `npx skills add heygen-com/hyperframes` (`hyperframes`, `hyperframes-cli`, `hyperframes-core`, `hyperframes-animation`, … `figma`, `media-use`) | Hashes in `/skills-lock.json`; update with `npx skills update -p`. CLI runs through `npx hyperframes` |
| `/onetake` | https://github.com/feitangyuan/onetake | `4157581` | `onetake/` | **PolyForm Noncommercial 1.0.0**: commercial use (client work, ads) needs the author's permission. Demo films (`*.mp4`, `assets/hero.gif`, `assets/cases/`) left out; case READMEs kept |
| `/collage-broll` | https://github.com/MegaTroll222/VOX-COLLAGE-BROLL (English fork of pyang5166/gbro-collage-broll `a1a4ee2`) | `2e9b8a9` | `collage-broll/` (frontmatter `name` renamed from `collage-broll-explainers`) | Needs the MaxFusion MCP (in `/.mcp.json`, authenticate on first use). The original gbro version is Codex-only (built-in image_gen), so the fork is installed. Example `*.mp4` left out |
| `/painted-animation` | https://github.com/JohnHeibel/ClaudeAnimationBase | `0ac8bf2` | `painted-animation/` | Repo ships no SKILL.md; ours wraps `ANIMATION_GUIDE.md`. `docs/emotions.webp` left out (README image only) |
| `/lemo-opuscar` | https://github.com/lemomo-ai/lemo-opuscar | `fdc46d7` | `lemo-opuscar/` (the repo's own `plugin/skills/lemo-opuscar`) | First use clones the style library (~sparse) into `~/lemo-opuscar` and installs its deps |

MCP servers added to `/.mcp.json` (project scope): `playwright` (`npx @playwright/mcp@latest --isolated`)
and `maxfusion` (`https://mcp.maxfusion.ai/mcp`, OAuth on first use).
