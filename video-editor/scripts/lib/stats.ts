// The post-render card, styled after the creator-analytics screenshot.
// Engagement numbers are placeholders (a render cannot know them); everything
// below the line is measured.

import type { EditDecision } from "../../src/lib/edit-schema";
import { formatBytes, formatTime } from "./media";

export type RenderResult = {
  label: string;
  file: string;
  width: number;
  height: number;
  frames: number;
  fps: number;
  bytes: number;
  renderMs: number;
};

const pad = (s: string, n: number) => s + " ".repeat(Math.max(0, n - [...s].length));

export const printStats = (results: RenderResult[], edit: EditDecision | null, totalMs: number) => {
  const W = 58;
  const line = (s = "") => console.log(`│ ${pad(s, W - 2)} │`);
  console.log(`\n┌${"─".repeat(W)}┐`);
  line("▶  RENDER COMPLETE");
  line();
  line("   Views  —      Likes  —      Shares  —      Saves  —");
  line("   (placeholders: post it, then fill these in)");
  console.log(`├${"─".repeat(W)}┤`);
  for (const r of results) {
    const secs = r.frames / r.fps;
    line(`${r.label}`);
    line(`   ${r.file}`);
    line(`   ${r.width}x${r.height}  ${formatTime(secs)}  ${formatBytes(r.bytes)}`);
    line(`   render ${(r.renderMs / 1000).toFixed(1)}s  (${(secs / (r.renderMs / 1000)).toFixed(2)}x realtime)`);
  }
  if (edit) {
    console.log(`├${"─".repeat(W)}┤`);
    line(`Raw take        ${formatTime(edit.source.duration)}  →  edit ${formatTime(edit.duration)}`);
    line(`Dead air cut    ${edit.stats.silenceRemovedSec.toFixed(1)}s across ${edit.stats.cuts} cuts`);
    line(`Captions        ${edit.stats.words} words${edit.stats.transcribed ? "" : " (no transcript)"}`);
    line(`Inserts         ${edit.inserts.length} (${edit.inserts.map((i) => i.keyword).join(", ") || "none"})`);
    line(`Sound pack      ${(["intro", "bed", "transition", "word"] as const).filter((r) => edit.sounds[r]).join(", ") || "empty"}`);
  }
  console.log(`├${"─".repeat(W)}┤`);
  line(`Total wall time ${(totalMs / 1000).toFixed(1)}s`);
  console.log(`└${"─".repeat(W)}┘\n`);
};
