// Synthesises the two house SFX with ffmpeg so the kit works out of the box (no licensed samples):
//   public/sfx/whoosh-cut.wav   soft filtered-noise swell for cuts
//   public/sfx/pop-caption.wav  short muted tick for caption pages
// Drop your own files with the same names to replace them. Music (public/music/lofi-bed.mp3) is yours to add.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SFX = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/sfx");
fs.mkdirSync(SFX, { recursive: true });
const ff = (...a) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...a]);

ff("-f", "lavfi", "-i", "anoisesrc=color=pink:duration=0.45:amplitude=0.6",
  "-af", "highpass=f=300,lowpass=f=4000,afade=t=in:d=0.3:curve=exp,afade=t=out:st=0.3:d=0.15,volume=0.6",
  "-ar", "48000", path.join(SFX, "whoosh-cut.wav"));
ff("-f", "lavfi", "-i", "sine=frequency=880:duration=0.08",
  "-af", "afade=t=out:st=0.01:d=0.07,lowpass=f=2500,volume=0.5", "-ar", "48000", path.join(SFX, "pop-caption.wav"));
console.log("wrote public/sfx/whoosh-cut.wav, public/sfx/pop-caption.wav");
