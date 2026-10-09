// STEP 02a: dead-space detection straight from the audio waveform.
// The take is decoded to 16 kHz mono PCM, cut into 20 ms windows, and each
// window's RMS loudness is compared with a threshold derived from the take's
// own noise floor. Quiet runs longer than minSilenceSec are removed.

import type { Segment } from "../../src/lib/edit-schema";
import { runFf } from "./media";

const RATE = 16000;
const WINDOW_SEC = 0.02;

export type SilenceOptions = {
  thresholdDb: number | "auto";
  minSilenceSec: number;
  paddingSec: number;
};

export type SilenceResult = {
  segments: Segment[];
  thresholdDb: number;
  noiseFloorDb: number;
  speechDb: number;
  removedSec: number;
  /** Per-window loudness in dBFS, handy for debugging or drawing a waveform. */
  envelope: number[];
};

const percentile = (sorted: number[], p: number) =>
  sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * p)))];

export const loudnessEnvelope = (file: string): number[] => {
  const pcm = runFf("ffmpeg", ["-v", "error", "-i", file, "-vn", "-ac", "1", "-ar", String(RATE), "-f", "s16le", "-"], {
    maxBuffer: 1024 * 1024 * 1024,
  });
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.byteLength / 2));
  const win = Math.round(RATE * WINDOW_SEC);
  const env: number[] = [];
  for (let i = 0; i < samples.length; i += win) {
    let sum = 0;
    const end = Math.min(samples.length, i + win);
    for (let j = i; j < end; j++) sum += (samples[j] / 32768) ** 2;
    const rms = Math.sqrt(sum / Math.max(1, end - i));
    env.push(rms > 0 ? 20 * Math.log10(rms) : -100);
  }
  return env;
};

export const detectSpeech = (file: string, duration: number, opts: SilenceOptions): SilenceResult => {
  const env = loudnessEnvelope(file);
  const sorted = [...env].sort((a, b) => a - b);
  const noiseFloorDb = percentile(sorted, 0.1);
  const speechDb = percentile(sorted, 0.9);
  // A third of the way from the floor to typical speech, never below -50 dBFS
  // (pure digital silence would otherwise drag it to -100).
  const thresholdDb =
    opts.thresholdDb === "auto"
      ? Math.max(-50, noiseFloorDb + (speechDb - noiseFloorDb) * 0.33)
      : opts.thresholdDb;

  // Light smoothing so a single loud click does not count as speech.
  const loud = env.map((_, i) => {
    const a = env[i - 1] ?? env[i];
    const b = env[i + 1] ?? env[i];
    return (a + env[i] + b) / 3 > thresholdDb;
  });

  const minWindows = Math.ceil(opts.minSilenceSec / WINDOW_SEC);
  const keep: Array<[number, number]> = [];
  let speechStart: number | null = null;
  let quietRun = 0;
  for (let i = 0; i <= loud.length; i++) {
    const isLoud = i < loud.length && loud[i];
    if (isLoud) {
      if (speechStart === null) speechStart = i;
      quietRun = 0;
      continue;
    }
    quietRun++;
    if (speechStart !== null && (quietRun >= minWindows || i === loud.length)) {
      const endWindow = i - quietRun + 1;
      keep.push([speechStart * WINDOW_SEC, endWindow * WINDOW_SEC]);
      speechStart = null;
    }
  }

  // Pad, clamp, and merge segments that touch once padded.
  const padded: Array<[number, number]> = [];
  for (const [s, e] of keep) {
    const start = Math.max(0, s - opts.paddingSec);
    const end = Math.min(duration, e + opts.paddingSec);
    const last = padded[padded.length - 1];
    if (last && start <= last[1] + 0.05) last[1] = Math.max(last[1], end);
    else padded.push([start, end]);
  }
  // Drop blips too short to be words (coughs, mic bumps).
  const filtered = padded.filter(([s, e]) => e - s >= 0.25);
  const final = filtered.length ? filtered : [[0, duration] as [number, number]];

  let out = 0;
  const segments: Segment[] = final.map(([srcStart, srcEnd]) => {
    const seg = { srcStart: round(srcStart), srcEnd: round(srcEnd), outStart: round(out) };
    out += srcEnd - srcStart;
    return seg;
  });

  return {
    segments,
    thresholdDb,
    noiseFloorDb,
    speechDb,
    removedSec: Math.max(0, duration - out),
    envelope: env,
  };
};

const round = (n: number) => Math.round(n * 1000) / 1000;

