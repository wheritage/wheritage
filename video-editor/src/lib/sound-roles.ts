import type { SoundRole } from "./edit-schema";

/**
 * How a sound file's name maps to its role. First match wins, so
 * "intro-riser" never lands on "bed". Shared by the pipeline and the composition.
 */
export const SOUND_RULES: Array<[SoundRole, RegExp]> = [
  ["intro", /intro|riser|rise|opener|sting/i],
  ["transition", /whoosh|swoosh|swish|transition|cut|swipe/i],
  ["word", /pop|click|tick|caption|blip|tap/i],
  ["bed", /bed|lofi|lo-fi|music|loop|ambient|track|beat/i],
];

export const AUDIO_EXT = /\.(mp3|wav|m4a|aac|ogg|flac)$/i;

export const soundRoleOf = (fileName: string): SoundRole | null =>
  SOUND_RULES.find(([, re]) => re.test(fileName.split("/").pop() ?? ""))?.[0] ?? null;
