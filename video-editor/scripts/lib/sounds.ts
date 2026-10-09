// STEP 04: the sound pack. Nothing is hardcoded: every edit re-reads
// public/assets/sound and assigns each file a role from its name, so swapping
// in your own riser or bed is just dropping a file with a matching word in it.

import { readdirSync } from "node:fs";
import path from "node:path";
import type { SoundPack } from "../../src/lib/edit-schema";
import { soundRoleOf } from "../../src/lib/sound-roles";
import { isIgnored, kindOf } from "./media";

export const SOUND_DIR = "assets/sound";

export const roleOf = soundRoleOf;

export const readSoundPack = (publicDir: string): SoundPack => {
  const dir = path.join(publicDir, SOUND_DIR);
  let files: string[] = [];
  try {
    files = readdirSync(dir)
      .filter((f) => !isIgnored(f) && kindOf(f) === "audio")
      .sort();
  } catch {
    // No folder yet: an edit without sound design is still a valid edit.
  }
  const pack: SoundPack = { all: files.map((f) => `${SOUND_DIR}/${f}`) };
  for (const f of files) {
    const role = roleOf(f);
    if (role && !pack[role]) pack[role] = `${SOUND_DIR}/${f}`;
  }
  return pack;
};
