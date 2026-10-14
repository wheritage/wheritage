// Daily Reel Editor: raw take -> public/edit/plan.json (what src/Root.tsx renders).
//
//   node scripts/edit.mjs public/raw-footage/take.mp4 [--model=medium] [--lang=fr] [--no-whisper]
//
// 1. ffmpeg silencedetect finds the dead air; everything else becomes a kept segment (tight cuts).
// 2. whisper.cpp (via @remotion/install-whisper-cpp, installed into .whisper/ on first run)
//    transcribes the take with token-level timestamps -> word-by-word captions.
// 3. Caption times are remapped onto the cut timeline; words said inside a cut are dropped.
// 4. config/cues.json keywords drop a screen recording on screen the first time they are said.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUB = path.join(ROOT, "public");
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const cfg = readJson("config/reel.json");
const cues = readJson("config/cues.json");

const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => {
    const [k, v] = a.slice(2).split("=");
    return [k, v ?? true];
  }),
);
const input = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? latestTake();
if (!input || !fs.existsSync(input)) {
  console.error("Usage: node scripts/edit.mjs public/raw-footage/<take>.mp4  (no take found)");
  process.exit(1);
}
const absInput = path.resolve(input);
if (!absInput.startsWith(PUB + path.sep)) {
  console.error("The take must live under public/ (drop it in public/raw-footage/) so Remotion can serve it.");
  process.exit(1);
}

function latestTake() {
  const dir = path.join(PUB, "raw-footage");
  const files = fs.readdirSync(dir).filter((f) => /\.(mp4|mov|m4v|webm|mkv)$/i.test(f))
    .map((f) => path.join(dir, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0];
}

const probeDuration = (file) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());

// ---- 1. silence detection -------------------------------------------------------------------
function detectSilences(file) {
  const { noiseDb, minSilenceSec } = cfg.silence;
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af",
    `silencedetect=noise=${noiseDb}dB:d=${minSilenceSec}`, "-f", "null", "-"], { encoding: "utf8" });
  const out = r.stderr;
  const silences = [];
  let start = null;
  for (const line of out.split("\n")) {
    const s = line.match(/silence_start: (-?[\d.]+)/);
    const e = line.match(/silence_end: ([\d.]+)/);
    if (s) start = Math.max(0, Number(s[1]));
    if (e && start !== null) { silences.push([start, Number(e[1])]); start = null; }
  }
  if (start !== null) silences.push([start, Infinity]);
  return silences;
}

function keptSegments(duration, silences) {
  const { padSec, minKeepSec } = cfg.silence;
  const keep = [];
  let cursor = 0;
  for (const [s, e] of silences) {
    if (s > cursor) keep.push([cursor, s]);
    cursor = Math.max(cursor, e);
  }
  if (cursor < duration) keep.push([cursor, duration]);
  return keep
    .map(([a, b]) => [Math.max(0, a - padSec), Math.min(duration, b + padSec)])
    .filter(([a, b]) => b - a >= minKeepSec)
    .reduce((acc, seg) => { // merge overlaps created by padding
      const last = acc[acc.length - 1];
      if (last && seg[0] <= last[1]) last[1] = Math.max(last[1], seg[1]);
      else acc.push([...seg]);
      return acc;
    }, []);
}

// ---- 2. transcription ------------------------------------------------------------------------
async function transcribeTake(file) {
  if (args["no-whisper"]) return [];
  const { installWhisperCpp, downloadWhisperModel, transcribe, toCaptions } = await import("@remotion/install-whisper-cpp");
  const whisperPath = path.join(ROOT, ".whisper");
  const version = "1.7.6";
  const model = args.model ?? cfg.whisperModel;
  await installWhisperCpp({ to: whisperPath, version, printOutput: false });
  await downloadWhisperModel({ model, folder: whisperPath, printOutput: false });
  const wav = path.join(ROOT, "out", "audio-16k.wav");
  fs.mkdirSync(path.dirname(wav), { recursive: true });
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", file, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wav]);
  const whisperCppOutput = await transcribe({
    inputPath: wav, whisperPath, whisperCppVersion: version, model,
    tokenLevelTimestamps: true, language: args.lang ?? cfg.language, splitOnWord: true, printOutput: false,
  });
  return toCaptions({ whisperCppOutput }).captions;
}

// ---- 3. remap onto the cut timeline -----------------------------------------------------------
function remap(segments) {
  let offset = 0;
  const map = segments.map(([from, to]) => {
    const m = { from, to, outStart: offset };
    offset += to - from;
    return m;
  });
  const toOut = (sec) => {
    const m = map.find((s) => sec >= s.from && sec < s.to);
    return m ? m.outStart + (sec - m.from) : null;
  };
  return { map, toOut, total: offset };
}

const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

async function main() {
  const duration = probeDuration(absInput);
  const segments = keptSegments(duration, detectSilences(absInput));
  const { map, toOut, total } = remap(segments);
  const words = await transcribeTake(absInput);

  const captions = words.flatMap((w) => {
    const start = toOut(w.startMs / 1000);
    if (start === null) return [];
    const len = Math.max(0.05, (w.endMs - w.startMs) / 1000);
    return [{ ...w, startMs: Math.round(start * 1000), endMs: Math.round((start + len) * 1000), timestampMs: null }];
  });

  const screenDrops = [];
  for (const [keyword, file] of Object.entries(cues)) {
    if (keyword.startsWith("_")) continue;
    const hit = captions.find((c) => norm(c.text).includes(norm(keyword)));
    if (!hit) continue;
    if (!fs.existsSync(path.join(PUB, file))) { console.warn(`cue "${keyword}" said, but ${file} is missing: skipped`); continue; }
    screenDrops.push({ keyword, file, startMs: hit.startMs, endMs: hit.startMs + cfg.screenDropSec * 1000 });
  }

  const exists = (rel) => (rel && fs.existsSync(path.join(PUB, rel)) ? rel : null);
  const plan = {
    source: path.relative(PUB, absInput).split(path.sep).join("/"),
    fps: cfg.fps,
    durationSec: Number(total.toFixed(3)),
    segments: map.map((m) => ({ from: Number(m.from.toFixed(3)), to: Number(m.to.toFixed(3)) })),
    captions,
    screenDrops,
    audio: { music: exists(cfg.music.file), cut: exists(cfg.sfx.cut), caption: exists(cfg.sfx.caption) },
  };
  fs.mkdirSync(path.join(PUB, "edit"), { recursive: true });
  fs.writeFileSync(path.join(PUB, "edit", "plan.json"), JSON.stringify(plan, null, 2));
  console.log(`take ${duration.toFixed(1)}s -> reel ${total.toFixed(1)}s, ${segments.length} segments, ` +
    `${captions.length} caption words, ${screenDrops.length} screen drops -> public/edit/plan.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
