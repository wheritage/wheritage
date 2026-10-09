// File-type detection and ffprobe helpers shared by every pipeline step.

import { execFileSync } from "node:child_process";
import path from "node:path";

export type MediaKind = "video" | "audio" | "image" | "captions" | "data" | "other";

const EXT: Record<string, MediaKind> = {
  ".mp4": "video", ".mov": "video", ".m4v": "video", ".webm": "video", ".mkv": "video", ".avi": "video",
  ".mp3": "audio", ".wav": "audio", ".m4a": "audio", ".aac": "audio", ".ogg": "audio", ".flac": "audio",
  ".png": "image", ".jpg": "image", ".jpeg": "image", ".webp": "image", ".gif": "image", ".svg": "image",
  ".srt": "captions", ".vtt": "captions",
  ".json": "data", ".txt": "data", ".md": "data",
};

export const kindOf = (file: string): MediaKind =>
  EXT[path.extname(file).toLowerCase()] ?? "other";

export const isIgnored = (name: string) =>
  name.startsWith(".") || name.endsWith(".part") || name.endsWith(".crdownload");

export type Probe = {
  duration: number;
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
  codec: string | null;
};

const resolved: Record<string, string[]> = {};

/**
 * ffmpeg / ffprobe command. Uses the system binary when there is one, otherwise
 * the copy that ships with Remotion (`npx remotion ffmpeg`), so nothing extra
 * needs installing.
 */
export const ffCmd = (bin: "ffmpeg" | "ffprobe"): string[] => {
  if (resolved[bin]) return resolved[bin];
  try {
    execFileSync(bin, ["-version"], { stdio: "ignore" });
    resolved[bin] = [bin];
  } catch {
    resolved[bin] = ["npx", "remotion", bin];
  }
  return resolved[bin];
};

export const runFf = (bin: "ffmpeg" | "ffprobe", args: string[], opts: { maxBuffer?: number } = {}) => {
  const [cmd, ...pre] = ffCmd(bin);
  return execFileSync(cmd, [...pre, ...args], {
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: opts.maxBuffer ?? 64 * 1024 * 1024,
  });
};

type Stream = {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  avg_frame_rate?: string;
  duration?: string;
  tags?: { rotate?: string };
  side_data_list?: Array<{ rotation?: number }>;
};

/** ffprobe a file. Returns zeros for fields that do not apply (e.g. audio-only). */
export const probe = (file: string): Probe => {
  const out = runFf("ffprobe", ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", file]).toString();
  const json = JSON.parse(out.slice(out.indexOf("{")));
  const streams: Stream[] = json.streams ?? [];
  const v = streams.find((s) => s.codec_type === "video");
  const a = streams.find((s) => s.codec_type === "audio");
  const [num, den] = String(v?.avg_frame_rate ?? "0/1").split("/").map(Number);
  // Phone footage stores rotation as metadata; report what the viewer actually sees.
  const rotation = Math.abs(Number(v?.tags?.rotate ?? v?.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? 0));
  const rotated = rotation === 90 || rotation === 270;
  const w = Number(v?.width ?? 0);
  const h = Number(v?.height ?? 0);
  return {
    duration: Number(json.format?.duration ?? v?.duration ?? a?.duration ?? 0),
    width: rotated ? h : w,
    height: rotated ? w : h,
    fps: den ? num / den : 0,
    hasAudio: Boolean(a),
    codec: v?.codec_name ?? a?.codec_name ?? null,
  };
};

export const formatBytes = (n: number) =>
  n > 1e9 ? `${(n / 1e9).toFixed(2)} GB` : n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${(n / 1e3).toFixed(0)} KB`;

export const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}:${r.toFixed(1).padStart(4, "0")}`;
};
