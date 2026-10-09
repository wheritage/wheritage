// "claude edit this video": the whole pipeline in one command.
//
//   npm run edit                         newest take in raw-footage/ → out/
//   npm run edit -- raw-footage/take.mov a specific take
//   npm run edit -- --no-render          analyse only (write public/edit/edit.json)
//   npm run edit -- --variants           also render the five hook variants
//
// 01 ingest → 02 cut dead air, transcribe, place inserts → 04 sound pack → 05 render

import type { Caption } from "@remotion/captions";
import { copyFileSync, existsSync, linkSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { EDIT_FILE, type EditConfig, type EditDecision, type Segment } from "../src/lib/edit-schema";
import { placeInserts, readLibrary } from "./lib/cues";
import { formatTime, kindOf, probe } from "./lib/media";
import { detectSpeech } from "./lib/silence";
import { readSoundPack } from "./lib/sounds";
import { transcribeTake } from "./lib/transcribe";
import { PUBLIC_DIR, RAW_DIR, ROOT, scan } from "./ingest";
import { renderMain, renderVariants } from "./render";

const FPS = 30;
const t0 = performance.now();
const args = process.argv.slice(2);
const flag = (f: string) => args.includes(f);

const config: EditConfig = JSON.parse(readFileSync(path.join(ROOT, "edit.config.json"), "utf8"));

// ── 01 Ingest ────────────────────────────────────────────────────────────────
const manifest = scan();
const explicit = args.find((a) => !a.startsWith("--"));
const takeEntry = explicit
  ? { path: path.relative(RAW_DIR, path.resolve(ROOT, explicit)) }
  : manifest.rawFootage
      .filter((e) => e.kind === "video" || e.kind === "audio")
      .map((e) => ({ ...e, mtime: statSync(path.join(RAW_DIR, e.path)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)[0];

if (!takeEntry) {
  console.error("\nNo raw take found. Drop a video in raw-footage/ and run again.");
  process.exit(1);
}
const rawFile = path.resolve(RAW_DIR, takeEntry.path);
if (!existsSync(rawFile) || !["video", "audio"].includes(kindOf(rawFile))) {
  console.error(`\nNot a video or audio file: ${rawFile}`);
  process.exit(1);
}
const name = path.basename(rawFile);
console.log(`\n● Take    ${path.relative(ROOT, rawFile)}`);

// Remotion can only read from public/, so the take is hard-linked (or copied) there.
const publicRaw = path.join(PUBLIC_DIR, "raw", name);
mkdirSync(path.dirname(publicRaw), { recursive: true });
if (!existsSync(publicRaw) || statSync(publicRaw).size !== statSync(rawFile).size) {
  rmSync(publicRaw, { force: true });
  try {
    linkSync(rawFile, publicRaw);
  } catch {
    copyFileSync(rawFile, publicRaw);
  }
}
const info = probe(rawFile);
console.log(`          ${formatTime(info.duration)}  ${info.width || "audio"}${info.width ? `x${info.height}` : ""}  ${info.fps ? info.fps.toFixed(2) + " fps" : ""}`);

// ── 02a Cut dead space ───────────────────────────────────────────────────────
const silence = detectSpeech(rawFile, info.duration, config.silence);
const segments: Segment[] = silence.segments;
const outDuration = segments.reduce((d, s) => d + (s.srcEnd - s.srcStart), 0);
console.log(
  `\n● Silence floor ${silence.noiseFloorDb.toFixed(1)} dB, speech ${silence.speechDb.toFixed(1)} dB, ` +
    `threshold ${silence.thresholdDb.toFixed(1)} dB\n` +
    `          ${segments.length} segments kept, ${silence.removedSec.toFixed(1)}s of dead air removed ` +
    `(${formatTime(info.duration)} → ${formatTime(outDuration)})`,
);

// ── 02b Transcribe and move every word onto the cut timeline ────────────────
console.log(`\n● Whisper ${config.whisper.model} (${config.whisper.language})`);
const transcript = await transcribeTake(rawFile, config.whisper);
const words: Caption[] = [];
for (const c of transcript?.captions ?? []) {
  if (!c.text.trim()) continue;
  const mid = (c.startMs + c.endMs) / 2000;
  const seg = segments.find((s) => mid >= s.srcStart && mid <= s.srcEnd);
  if (!seg) continue; // spoken inside a cut (breath, mumble): drop it
  const startSrc = Math.max(seg.srcStart, c.startMs / 1000);
  const endSrc = Math.min(seg.srcEnd, c.endMs / 1000);
  const toOut = (t: number) => Math.round((seg.outStart + (t - seg.srcStart)) * 1000);
  words.push({ ...c, startMs: toOut(startSrc), endMs: toOut(endSrc), timestampMs: toOut((startSrc + endSrc) / 2) });
}
console.log(
  transcript
    ? `          ${words.length} words${transcript.cached ? " (cached transcript)" : ""}`
    : "          skipped",
);

// ── 02c Screen recordings + b-roll on cue ───────────────────────────────────
const inserts = placeInserts(
  words,
  [
    { kind: "screen", lib: readLibrary(PUBLIC_DIR, "screen-recordings"), seconds: config.inserts.screenSec },
    { kind: "broll", lib: readLibrary(PUBLIC_DIR, "broll"), seconds: config.inserts.brollSec },
  ],
  config.inserts.cooldownSec,
  outDuration,
);
console.log(`\n● Inserts ${inserts.length}`);
for (const i of inserts) console.log(`          ${formatTime(i.start)}  ${i.kind.padEnd(6)} "${i.keyword}" → ${i.src}`);

// ── 04 Sound pack (re-read from the folder on every edit) ───────────────────
const sounds = readSoundPack(PUBLIC_DIR);
console.log(`\n● Sound   ${sounds.all.length} files in public/assets/sound`);
for (const role of ["intro", "bed", "transition", "word"] as const) {
  console.log(`          ${role.padEnd(10)} ${sounds[role] ?? "(none)"}`);
}

// ── Write the edit decision list ─────────────────────────────────────────────
const edit: EditDecision = {
  version: 1,
  createdAt: new Date().toISOString(),
  source: { src: `raw/${name}`, name, duration: info.duration, width: info.width, height: info.height, fps: info.fps },
  fps: FPS,
  duration: Math.round(outDuration * 1000) / 1000,
  segments,
  words,
  inserts,
  sounds,
  config,
  stats: {
    silenceRemovedSec: Math.round(silence.removedSec * 10) / 10,
    cuts: Math.max(0, segments.length - 1),
    words: words.length,
    transcribed: Boolean(transcript),
  },
};
const editPath = path.join(PUBLIC_DIR, EDIT_FILE);
mkdirSync(path.dirname(editPath), { recursive: true });
writeFileSync(editPath, JSON.stringify(edit, null, 2));
// Plain-text transcript of the FINISHED edit, for Claude to read and write hooks from.
writeFileSync(path.join(PUBLIC_DIR, "edit", "transcript.txt"), words.map((w) => w.text).join("").trim() + "\n");
console.log(`\n● Wrote   public/${EDIT_FILE}  (analysis ${((performance.now() - t0) / 1000).toFixed(1)}s)`);

// ── 05 Render ────────────────────────────────────────────────────────────────
if (!flag("--no-render")) {
  const only = args.find((a) => a.startsWith("--only="))?.split("=")[1] as "landscape" | "vertical" | undefined;
  await renderMain(only);
  if (flag("--variants")) await renderVariants(config.hooks);
}
