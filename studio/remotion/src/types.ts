import type { Caption } from "@remotion/captions";

export type Plan = {
  source: string | null;
  fps: number;
  durationSec: number;
  segments: { from: number; to: number }[];
  captions: Caption[];
  screenDrops: { keyword: string; file: string; startMs: number; endMs: number }[];
  audio: { music: string | null; cut: string | null; caption: string | null };
};

export type ReelProps = { hook: string; plan: Plan | null };
