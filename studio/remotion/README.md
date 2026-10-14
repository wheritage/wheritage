# Daily Reel Editor (Remotion)

Raw take in, five captioned 9:16 reels out. Command in Claude Code: `/remotion-reel`.

```
public/
  raw-footage/        your takes (git-ignored)
  screen-recordings/  clips dropped on keywords (git-ignored)
  music/lofi-bed.mp3  optional bed, your licence (git-ignored)
  sfx/                whoosh-cut.wav, pop-caption.wav (synthesised by `npm run sfx`, replace freely)
  fonts/              Cormorant Garamond + Montserrat, self-hosted (OFL)
  edit/plan.json      written by `npm run edit` (git-ignored)
config/
  reel.json           format, silence thresholds, Whisper model, lower third, volumes, emoji pops (off)
  cues.json           keyword -> screen recording
  hooks.json          hook1..hook5 opening lines (one render per hook)
src/
  Root.tsx            one composition per hook, duration from plan.json
  Reel.tsx            layer order: footage, screen drops, lower third, captions, hook, progress bar, music
  components/         Footage (cuts + punch-ins + whoosh), ZoomIn, Captions (word by word), LowerThird,
                      ScreenDrop, ProgressBar, HookTitle, EmojiPop
scripts/
  edit.mjs            silencedetect -> kept segments; whisper.cpp -> word captions; cue matching -> plan.json
  render-variants.mjs renderVariants(['hook1', ...]) -> out/<hook>.mp4
  make-sfx.mjs        synthesises the two SFX with ffmpeg
```

```bash
npm install
npm run edit -- public/raw-footage/take.mp4   # first run builds whisper.cpp + downloads the model
npm run studio                                 # scrub and tweak in Remotion Studio
npm run render:variants                        # out/hook1.mp4 … out/hook5.mp4
```

Needs Node 18+ and ffmpeg/ffprobe on PATH. whisper.cpp compiles from source on first run (needs
`make` and a C++ compiler: Xcode command line tools on macOS). `--model=small` is faster than the
default `medium`; `--no-whisper` skips captions entirely.
