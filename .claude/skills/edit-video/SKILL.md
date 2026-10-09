---
name: edit-video
description: >
  Turns one raw talking-head take into a polished, captioned reel with the Remotion pipeline in
  video-editor/: cuts dead air from the waveform, word-by-word Whisper captions, screen recordings
  and b-roll on transcript keywords, spring zooms, title, lower third, progress bar, sound pack,
  16:9 + 9:16 renders and hook variants. Use when the user says "edit this video", "claude edit
  this video", "cut this take", "caption this", "make the reel", "render the variants", or drops a
  file in video-editor/raw-footage/.
---

# Edit a raw take

Everything runs from `video-editor/` (Remotion 4, React, Tailwind v4). The pipeline is
deterministic; your job is the editorial pass in step 3: the part a script cannot judge.

## 1. Preflight

```bash
cd video-editor
[ -d node_modules ] || npm i
ls -la raw-footage/
```

- No take in `raw-footage/`: ask the user to drop one there. Do not invent footage.
- The user named a file: pass it explicitly, e.g. `npm run edit -- raw-footage/take-03.mov`.
  Otherwise the newest video in `raw-footage/` is used.

## 2. Analyse (no render yet)

```bash
npm run edit -- --no-render
```

This runs 01 ingest (logs every file type in `public/` and `raw-footage/`), cuts silence from
the waveform, transcribes with whisper.cpp (first run installs it and downloads the model named
in `edit.config.json`), places inserts, reads the sound pack, and writes
`public/edit/edit.json` + `public/edit/transcript.txt`.

Read the console summary. Sanity-check it:
- Dead air removed should be plausible (usually 10–35% of a raw take). If whole sentences
  vanished, the speaker is quiet relative to room noise: set `silence.thresholdDb` to a number
  (start 6 dB below the printed threshold) or raise `minSilenceSec`.
- "Whisper unavailable": see Troubleshooting. Do not continue to render without telling the user
  the video will have no captions.

## 3. Editorial pass (this is the Claude part)

Read `public/edit/transcript.txt`, then:

1. **Fix mishearings** in `raw-footage/<take>.captions.json` (the cached Whisper output, source
   of truth). Only change a word's `text` when the error is obvious (names, jargon, homophones
   like "REER/rare", "CELI/celui"). Keep the leading space and every timestamp as is.
2. **Write 5 hooks** into `edit.config.json` → `hooks`, and set `hook` to the strongest one.
   - Built from what is actually said in the take. No invented figures, promises or claims.
   - At most 6 words. Wrap the one word that carries the tension in `*stars*` (accent colour).
   - Same language as the take. For W Héritage social content: tutoiement.
   - Five different angles (problem, contrarian, curiosity, outcome, mistake), not 5 rewordings.
3. **Emoji pops** (if `features.emojiPops` is on): add 3–6 entries to `emoji` for the take's key
   nouns. Fewer is better; one per sentence at most.
4. **Inserts**: check the `● Inserts` lines. A keyword firing in the wrong sentence → rename the
   clip in `public/screen-recordings/` or `public/broll/` to a more specific phrase
   (`tableau-de-bord.mp4` instead of `tableau.mp4`).
5. **Speaker**: confirm `speaker.name` / `speaker.title` for the lower third.

## 4. Render

```bash
npm run edit                 # re-analyses (instant, transcript is cached) and renders both formats
npm run edit -- --variants   # also the 5 hook variants (vertical) into out/variants/
```

Outputs: `out/MainVideo.mp4` (1920x1080), `out/MainVideo-vertical.mp4` (1080x1920),
`out/variants/*.mp4`. The stats card prints at the end (engagement placeholders, measured render
time, dead air cut, word count, inserts, sound roles). The plain Remotion CLI also works:
`npx remotion render src/index.ts MainVideo out.mp4`.

## 5. Report

Give the user: output paths, the stats card numbers (raw → edit length, seconds cut, render
time), the hooks you wrote, and any transcript words you corrected. Offer `npm run dev`
(Remotion Studio) to scrub the edit before posting.

## Reference

| What | Where |
|------|-------|
| All knobs (colours, silence, whisper model/language, caption words per page, insert lengths, feature toggles, sound volumes, emoji map) | `video-editor/edit.config.json` |
| Composition (layers: take → inserts → title / lower third / captions / transitions / progress → sound) | `src/compositions/MainVideo.tsx` |
| Reusable components: `ZoomPan`, `LowerThird`, `AnimatedTitle`, `ProgressBar`, `SceneTransition`, `EmojiPop`, `Captions`, `BRoll`, `ScreenInsert`, `SoundLayer` | `src/components/` |
| EDL types shared by pipeline and composition | `src/lib/edit-schema.ts` |
| Pipeline steps | `scripts/ingest.ts`, `scripts/lib/{silence,transcribe,cues,sounds}.ts`, `scripts/edit.ts`, `scripts/render.ts` (`renderVariants(hooks)`) |

Sound pack: files in `public/assets/sound/` get a role from their name (`intro|riser` → first
2 s, `bed|lofi|music` → looped under everything, `whoosh|swoosh|cut` → on cuts, `pop|click` → each
caption word). Swap a sound by dropping a new file; nothing is hardcoded. `npm run sounds`
regenerates the synthesized starter pack.

## W Héritage brand look

The defaults are the terracotta reel look (#E07A5F, emoji pops). For videos published as
W Héritage, the house motion rules in the root `CLAUDE.md` apply: ask the user, and if they want
the house look set `theme.accent` to `#C9A84C`, `theme.background` to `#080808`,
`features.emojiPops` to `false`, and `sound.whooshOn` to `"inserts"`.

## Troubleshooting

- **Chrome download fails / blocked network**: point Remotion at an installed Chromium,
  `export REMOTION_BROWSER_EXECUTABLE=/path/to/chrome-headless-shell` (both `remotion.config.ts`
  and `scripts/render.ts` read it).
- **Whisper install/download fails** (no compiler, no access to huggingface.co): the edit still
  renders without captions. Either fix the toolchain (`git`, `make`, a C++ compiler) or supply a
  Remotion `Caption[]` JSON at `raw-footage/<take>.captions.json` (times in ms on the RAW take).
- **Wrong language/accuracy**: `whisper.model` `small` is the default; `medium` is markedly
  better for Québec French (1.5 GB). Models ending in `.en` are English-only.
- **HEVC/iPhone .mov**: fine; `OffthreadVideo` decodes it with ffmpeg, not the browser.
