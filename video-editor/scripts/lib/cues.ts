// STEP 02c: screen recordings and b-roll inserted on cue.
// A clip's keywords come from its file name: public/screen-recordings/
// "tableau-de-bord.mp4" fires when the speaker says "tableau de bord";
// "crm,pipeline.mp4" fires on either word. Matching ignores case, accents and
// punctuation.

import type { Caption } from "@remotion/captions";
import { readdirSync } from "node:fs";
import path from "node:path";
import type { Insert } from "../../src/lib/edit-schema";
import { isIgnored, kindOf, probe } from "./media";

export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9' ]+/g, " ")
    .trim();

type Library = Array<{ src: string; media: "video" | "image"; phrases: string[][]; duration: number }>;

export const readLibrary = (publicDir: string, folder: string): Library => {
  let files: string[] = [];
  try {
    files = readdirSync(path.join(publicDir, folder)).filter((f) => !isIgnored(f));
  } catch {
    return [];
  }
  return files.flatMap((f) => {
    const kind = kindOf(f);
    if (kind !== "video" && kind !== "image") return [];
    const stem = path.basename(f, path.extname(f));
    const phrases = stem
      .split(/[,+]/)
      .map((p) => normalize(p.replace(/[-_.]+/g, " ")).split(" ").filter(Boolean))
      .filter((p) => p.length);
    const duration = kind === "video" ? probe(path.join(publicDir, folder, f)).duration : Infinity;
    return [{ src: `${folder}/${f}`, media: kind, phrases, duration }];
  });
};

/**
 * Walk the transcript and place an insert wherever a clip's phrase is spoken.
 * Each clip fires once, inserts never overlap, and cooldownSec keeps the talking
 * head on screen between two inserts.
 */
export const placeInserts = (
  words: Caption[],
  libs: { kind: Insert["kind"]; lib: Library; seconds: number }[],
  cooldownSec: number,
  totalSec: number,
): Insert[] => {
  const tokens = words.map((w) => normalize(w.text));
  const placed: Insert[] = [];
  const used = new Set<string>();
  const busyUntil = { t: -Infinity };

  for (let i = 0; i < tokens.length; i++) {
    const start = words[i].startMs / 1000;
    if (start < busyUntil.t) continue;
    for (const { kind, lib, seconds } of libs) {
      const hit = lib.find(
        (clip) =>
          !used.has(clip.src) &&
          clip.phrases.some((p) => p.every((word, k) => tokens[i + k] === word)),
      );
      if (!hit) continue;
      const duration = Math.min(seconds, hit.duration, totalSec - start);
      if (duration < 1) continue;
      used.add(hit.src);
      placed.push({
        kind,
        src: hit.src,
        media: hit.media,
        start: Math.round(start * 1000) / 1000,
        duration: Math.round(duration * 1000) / 1000,
        keyword: words[i].text.trim(),
      });
      busyUntil.t = start + duration + cooldownSec;
      break;
    }
  }
  return placed;
};
