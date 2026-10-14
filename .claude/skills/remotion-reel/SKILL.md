---
name: remotion-reel
description: Daily Reel Editor. Edit a raw talking-head take into a tight-cut, word-by-word captioned 9:16 reel with Remotion (studio/remotion): silence cut, Whisper captions, screen recordings dropped on keywords, lower third, punch-in zooms, progress bar, then bulk-render hook variants. Use for "/remotion-reel", "edit this video with Remotion", a daily TikTok / Reel / Short tip from a raw take, or bulk hook variants.
---

# Remotion reel (Daily Reel Editor)

Project: `studio/remotion/` (Remotion 4, React). Read `studio/remotion/README.md` once. For Remotion API
questions load the `remotion-best-practices` skill (installed alongside: captions, render, studio, create).

## Pipeline

1. **Take**: the raw take goes in `studio/remotion/public/raw-footage/` (newest file is used by default).
   Screen recordings go in `public/screen-recordings/`, music in `public/music/lofi-bed.mp3`.
2. **Install once**: `cd studio/remotion && npm install` (`npm run sfx` regenerates the two house SFX).
3. **Cue map**: update `config/cues.json` (keyword said in the take -> screen recording file). Ask which
   recordings to drop if the user mentions any; never invent a file.
4. **Hooks**: write 5 hook lines in `config/hooks.json` (hook1..hook5). French, tutoiement, no em dashes,
   no invented figures. Each variant is the same edit with a different opening line.
5. **Edit**: `npm run edit -- public/raw-footage/<take>.mp4` -> `public/edit/plan.json` (silence-cut
   segments, Whisper word captions remapped onto the cut, keyword screen drops). First run compiles
   whisper.cpp and downloads the model (`config/reel.json` `whisperModel`, default `medium` for French).
6. **Check**: `npx remotion still hook1 out/check.png --frame=<n>` on a few frames (hook, first caption,
   each screen drop) and look at them before rendering. Fix caption typos directly in `plan.json`.
7. **Render**: `npm run render:variants` (all five) or `node scripts/render-variants.mjs hook1 hook3`.
   Programmatic: `renderVariants(['hook1','hook2','hook3','hook4','hook5'])` from `scripts/render-variants.mjs`.
   Outputs land in `studio/remotion/out/<hook>.mp4`.

On a headless Linux box without Chrome Headless Shell, set
`REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell` (or pass
`--browser-executable` to the CLI).

## Style ("tight cuts, captioned, screen recording on cue")

Tight: tune `config/reel.json` `silence` (lower `minSilenceSec` = tighter). Alternate segments punch in
(`punchInScale`) so jump cuts read as reframes. House motion rules from CLAUDE.md apply: expo-out
entrances, faster accelerating exits, no bounce. `emojiPops` exists but is off: the brand bans emoji
pops; only enable it when the user explicitly asks for that reel.
