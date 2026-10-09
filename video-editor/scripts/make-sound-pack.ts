// Generates a royalty-free starter sound pack with ffmpeg, so the project
// works out of the box. Replace any file with your own: the edit re-reads
// public/assets/sound by name on every run.
//
//   npm run sounds            (skips files that already exist)
//   npm run sounds -- --force

import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { runFf } from "./lib/media";

const DIR = path.join(process.cwd(), "public", "assets", "sound");
mkdirSync(DIR, { recursive: true });
const force = process.argv.includes("--force");

const recipes: Record<string, string[]> = {
  // Rising sine sweep under filtered noise, swelling into the 2 s mark.
  "intro-riser.mp3": [
    "-f", "lavfi", "-i", "aevalsrc='0.5*sin(2*PI*(120*t+170*t*t))':s=44100:d=2.2",
    "-f", "lavfi", "-i", "anoisesrc=color=pink:amplitude=0.35:d=2.2:r=44100",
    "-filter_complex",
    "[1]highpass=f=600,lowpass=f=6000[n];[0][n]amix=inputs=2:weights='1 0.6',volume='min(1,pow(t/2,2))':eval=frame,afade=t=out:st=2.0:d=0.2,alimiter=limit=0.9",
    "-c:a", "libmp3lame", "-b:a", "160k",
  ],
  // 8-bar lo-fi loop: soft Fmaj7–Em7–Dm7–Cmaj7 pads, low-passed, with vinyl hiss.
  "lofi-bed.mp3": [
    "-f", "lavfi", "-i",
    "aevalsrc='" +
      [
        ["174.6", "220", "261.6", "329.6"],
        ["164.8", "196", "246.9", "293.7"],
        ["146.8", "174.6", "220", "261.6"],
        ["130.8", "164.8", "196", "246.9"],
      ]
        .map(
          (chord, i) =>
            `between(mod(t,16),${i * 4},${i * 4 + 4})*(` +
            chord.map((hz) => `sin(2*PI*${hz}*t)`).join("+") +
            `)*0.09*(0.6+0.4*exp(-mod(t,2)*1.5))`,
        )
        .join("+") +
      "':s=44100:d=16",
    "-f", "lavfi", "-i", "anoisesrc=color=brown:amplitude=0.02:d=16:r=44100",
    "-filter_complex", "[0]lowpass=f=1400,aecho=0.8:0.6:120:0.3[m];[m][1]amix=inputs=2:weights='1 1',volume=12dB,alimiter=limit=0.8",
    "-c:a", "libmp3lame", "-b:a", "128k",
  ],
  // Band-passed noise whose centre sweeps up then down: a classic air whoosh.
  "whoosh-cut.wav": [
    "-f", "lavfi", "-i", "anoisesrc=color=white:amplitude=0.9:d=0.6:r=44100",
    "-af", "bandpass=f=1800:width_type=o:w=2,volume='sin(PI*t/0.6)^2':eval=frame,afade=t=out:st=0.5:d=0.1,alimiter=limit=0.9",
  ],
  // Short pitched blip with a fast decay.
  "pop-caption.wav": [
    "-f", "lavfi", "-i", "aevalsrc='0.8*sin(2*PI*(900-500*t/0.07)*t)*exp(-t*55)':s=44100:d=0.09",
  ],
};

for (const [file, args] of Object.entries(recipes)) {
  const out = path.join(DIR, file);
  if (existsSync(out) && !force) {
    console.log(`  keep   assets/sound/${file}`);
    continue;
  }
  runFf("ffmpeg", ["-v", "error", "-y", ...args, out]);
  console.log(`  wrote  assets/sound/${file}`);
}
