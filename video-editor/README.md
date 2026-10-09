# video-editor

Remotion + Claude Code editing pipeline: drop one raw take in `raw-footage/`, run one command,
get a cut, captioned, sound-designed video in 16:9 and 9:16.

```bash
npm i
npm run edit            # or, in Claude Code: "edit this video"
```

## What happens

| Step | What | Where |
|------|------|-------|
| 01 Ingest | Scans `public/` and `raw-footage/`, logs every file's type, writes `public/edit/manifest.json`. `npm run watch` keeps watching. | `scripts/ingest.ts` |
| 02 Raw → polished | Dead air cut from the audio waveform (RMS per 20 ms vs. the take's own noise floor) · word-level Whisper transcript (whisper.cpp, local) remapped onto the cut timeline · screen recordings and b-roll inserted when their file name is spoken | `scripts/lib/silence.ts`, `transcribe.ts`, `cues.ts` |
| 03 Polish | Spring zoom ins / pan outs on every jump cut · animated hook title with terracotta accent · lower third · word-by-word Tailwind captions · emoji pops on caption words · scene transitions · bottom progress bar | `src/components/`, `src/compositions/MainVideo.tsx` |
| 04 Sound pack | Re-reads `public/assets/sound/` on every edit: intro riser on the first 2 s, lofi bed looped under, whoosh on cuts, pop on each word. Roles come from file names. | `scripts/lib/sounds.ts`, `src/components/SoundLayer.tsx` |
| 05 Output | `out/MainVideo.mp4` (1920x1080) + `out/MainVideo-vertical.mp4` (1080x1920), then a stats card with render time | `scripts/render.ts`, `scripts/lib/stats.ts` |

## Commands

```bash
npm run edit                          # newest take → analyse → render both formats → stats
npm run edit -- raw-footage/take.mov  # a specific take
npm run edit -- --no-render           # analyse only (writes public/edit/edit.json + transcript.txt)
npm run edit -- --variants            # + 5 hook variants into out/variants/
npm run render                        # re-render from the current edit
npm run variants -- "Hook *one*" "Hook two"
npm run dev                           # Remotion Studio, scrub the edit
npm run ingest                        # one scan;  npm run watch  to keep watching
npm run sounds                        # regenerate the synthesized starter sound pack

npx remotion render src/index.ts MainVideo out.mp4               # plain CLI, 16:9
npx remotion render src/index.ts MainVideoVertical out-9x16.mp4  # plain CLI, 9:16
```

`renderVariants(hooks: string[])` in `scripts/render.ts` renders up to 5 vertical cuts at once,
one per hook, sharing the CPU between them.

## Folders

```
raw-footage/              your takes (git-ignored); <take>.captions.json = cached transcript
public/
  assets/sound/           intro-riser.mp3  lofi-bed.mp3  whoosh-cut.wav  pop-caption.wav
  screen-recordings/      "tableau-de-bord.mp4" fires on "tableau de bord"
  broll/                  same naming rule, overlaid on the talking head
  raw/, edit/             generated (git-ignored)
src/
  Root.tsx                MainVideo (16:9) + MainVideoVertical (9:16)
  compositions/MainVideo.tsx
  components/             ZoomPan, LowerThird, AnimatedTitle, ProgressBar, SceneTransition,
                          EmojiPop, Captions, Inserts (BRoll, ScreenInsert), SoundLayer
  lib/edit-schema.ts      the edit decision list shared by pipeline and composition
scripts/                  the Node pipeline (run with tsx)
edit.config.json          every knob: theme, speaker, hooks, silence, whisper, features, volumes, emoji
```

## Notes

- **Whisper**: the first edit compiles whisper.cpp (needs `git`, `make`, a C++ compiler) and
  downloads the model (`small` by default, set `whisper.model` to `medium` for better Québec
  French). If it cannot, the edit still renders without captions; you can also supply
  `raw-footage/<take>.captions.json` yourself (Remotion `Caption[]`, ms on the raw take).
- **Browser**: Remotion downloads Chrome Headless Shell on first render. On a locked-down
  network set `REMOTION_BROWSER_EXECUTABLE` to an installed Chromium.
- **Sounds**: the starter pack is synthesized with ffmpeg (`scripts/make-sound-pack.ts`), so it
  is royalty-free. Drop your own files with the same role words in their names to replace them.
- **License**: Remotion is free for individuals and companies of up to 3 people; larger teams
  need a company license (remotion.pro/license).
