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
