// The edit decision list (EDL) shared by the Node pipeline (scripts/) and the
// Remotion compositions (src/). The pipeline writes it to public/edit/edit.json;
// MainVideo reads it in calculateMetadata. Every time value is in SECONDS unless
// the field name ends in Ms.

import type { Caption } from "@remotion/captions";

export const EDIT_FILE = "edit/edit.json";

/** A kept stretch of the raw take, after dead space has been cut out. */
export type Segment = {
  /** Start in the raw source. */
  srcStart: number;
  /** End in the raw source. */
  srcEnd: number;
  /** Where this segment starts in the finished edit. */
  outStart: number;
};

/** A screen recording or b-roll clip placed on the output timeline. */
export type Insert = {
  kind: "screen" | "broll";
  /** Path relative to public/, pass through staticFile(). */
  src: string;
  /** "video" or "image" so the layer knows which element to render. */
  media: "video" | "image";
  /** Output time the insert starts (the cue word). */
  start: number;
  duration: number;
  /** The transcript keyword that triggered it. */
  keyword: string;
};

/**
 * Sound roles. Files are discovered from public/assets/sound by name
 * (see scripts/lib/sounds.ts), never hardcoded.
 */
export type SoundRole = "intro" | "bed" | "transition" | "word";
export type SoundPack = Partial<Record<SoundRole, string>> & {
  /** Every file found in the folder, for reference. */
  all: string[];
};

export type Theme = {
  accent: string;
  text: string;
  shadow: string;
  background: string;
  /** Google font family used for captions and titles. */
  font: "Montserrat" | "Inter";
};

export type EditConfig = {
  theme: Theme;
  speaker: { name: string; title: string };
  /** Default hook shown as the animated title. Wrap words in *stars* to accent them. */
  hook: string;
  /** Alternate hooks for renderVariants(). */
  hooks: string[];
  silence: {
    /** "auto" derives the threshold from the take's own noise floor. */
    thresholdDb: number | "auto";
    /** Pauses shorter than this stay in (breathing room). */
    minSilenceSec: number;
    /** Audio kept on each side of a cut so words are not clipped. */
    paddingSec: number;
  };
  whisper: { model: string; language: string; version: string };
  captions: { wordsPerPage: number; uppercase: boolean };
  inserts: { screenSec: number; brollSec: number; cooldownSec: number };
  features: {
    zoom: boolean;
    lowerThird: boolean;
    title: boolean;
    progressBar: boolean;
    transitions: boolean;
    emojiPops: boolean;
  };
  sound: {
    whooshOn: "cuts" | "inserts";
    /** Seconds between two whooshes, so dense jump cuts do not machine-gun. */
    whooshMinGapSec: number;
    /** Seconds between two caption pops. */
    popMinGapSec: number;
    volumes: Record<SoundRole, number>;
  };
  /** Transcript word (accent and case insensitive) -> emoji. */
  emoji: Record<string, string>;
};

export type EditDecision = {
  version: 1;
  createdAt: string;
  source: {
    /** Path relative to public/. */
    src: string;
    name: string;
    duration: number;
    width: number;
    height: number;
    fps: number;
  };
  fps: number;
  /** Output duration after cuts. */
  duration: number;
  segments: Segment[];
  /** Word-level captions on the OUTPUT timeline. */
  words: Caption[];
  inserts: Insert[];
  sounds: SoundPack;
  config: EditConfig;
  stats: {
    silenceRemovedSec: number;
    cuts: number;
    words: number;
    transcribed: boolean;
  };
};
