// STEP 01: ingest. Reads everything in public/ and raw-footage/, logs each
// file's type, and writes public/edit/manifest.json: the source of truth the
// edit (and Claude) points at.
//
//   npm run ingest            one scan
//   npm run ingest -- --watch keep watching and log every file dropped in

import { existsSync, mkdirSync, readdirSync, statSync, watch, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatBytes, isIgnored, kindOf, type MediaKind, probe } from "./lib/media";
import { roleOf } from "./lib/sounds";

export const ROOT = process.cwd();
export const PUBLIC_DIR = path.join(ROOT, "public");
export const RAW_DIR = path.join(ROOT, "raw-footage");
const GENERATED = ["edit", "raw"]; // folders the pipeline writes into public/

export type ManifestEntry = {
  path: string;
  kind: MediaKind;
  bytes: number;
  duration?: number;
  width?: number;
  height?: number;
  role?: string;
};

const walk = (dir: string, base = dir): string[] => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    if (isIgnored(name)) return [];
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      if (base === PUBLIC_DIR && dir === base && GENERATED.includes(name)) return [];
      return walk(full, base);
    }
    return [full];
  });
};

const describe = (full: string, base: string): ManifestEntry => {
  const kind = kindOf(full);
  const entry: ManifestEntry = {
    path: path.relative(base, full).split(path.sep).join("/"),
    kind,
    bytes: statSync(full).size,
  };
  if (kind === "video" || kind === "audio") {
    try {
      const p = probe(full);
      entry.duration = Math.round(p.duration * 100) / 100;
      if (kind === "video") Object.assign(entry, { width: p.width, height: p.height });
    } catch {
      // Unreadable or still copying; the next scan will pick it up.
    }
  }
  if (kind === "audio" && entry.path.startsWith("assets/sound/")) {
    entry.role = roleOf(full) ?? "unassigned";
  }
  return entry;
};

const ICON: Record<MediaKind, string> = {
  video: "VIDEO", audio: "AUDIO", image: "IMAGE", captions: "CAPS ", data: "DATA ", other: "OTHER",
};

export const logEntry = (where: string, e: ManifestEntry) => {
  const meta = [
    formatBytes(e.bytes),
    e.duration !== undefined ? `${e.duration}s` : null,
    e.width ? `${e.width}x${e.height}` : null,
    e.role ? `role=${e.role}` : null,
  ].filter(Boolean);
  console.log(`  [${ICON[e.kind]}] ${where}/${e.path}  ${meta.join("  ")}`);
};

export const scan = (quiet = false) => {
  const pub = walk(PUBLIC_DIR).map((f) => describe(f, PUBLIC_DIR));
  const raw = walk(RAW_DIR).map((f) => describe(f, RAW_DIR));
  const manifest = { scannedAt: new Date().toISOString(), public: pub, rawFootage: raw };
  mkdirSync(path.join(PUBLIC_DIR, "edit"), { recursive: true });
  writeFileSync(path.join(PUBLIC_DIR, "edit", "manifest.json"), JSON.stringify(manifest, null, 2));
  if (!quiet) {
    console.log(`\n● Ingest  ${raw.length} in raw-footage/, ${pub.length} in public/`);
    raw.forEach((e) => logEntry("raw-footage", e));
    pub.forEach((e) => logEntry("public", e));
    const counts = [...raw, ...pub].reduce<Record<string, number>>((acc, e) => {
      acc[e.kind] = (acc[e.kind] ?? 0) + 1;
      return acc;
    }, {});
    console.log(`  types: ${Object.entries(counts).map(([k, n]) => `${k} ${n}`).join(", ") || "none"}`);
  }
  return manifest;
};

const watchMode = () => {
  scan();
  console.log("\n  Watching public/ and raw-footage/ (Ctrl+C to stop)…");
  const timers = new Map<string, NodeJS.Timeout>();
  for (const [dir, label] of [[PUBLIC_DIR, "public"], [RAW_DIR, "raw-footage"]] as const) {
    mkdirSync(dir, { recursive: true });
    watch(dir, { recursive: true }, (_event, name) => {
      if (!name || isIgnored(path.basename(name))) return;
      if (label === "public" && GENERATED.some((g) => name.startsWith(g + path.sep) || name === g)) return;
      // Debounce: big files fire many events while they copy.
      clearTimeout(timers.get(name));
      timers.set(
        name,
        setTimeout(() => {
          const full = path.join(dir, name);
          if (!existsSync(full)) {
            console.log(`  [ GONE] ${label}/${name}`);
          } else if (statSync(full).isFile()) {
            logEntry(label, describe(full, dir));
          }
          scan(true);
        }, 400),
      );
    });
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--watch")) watchMode();
  else scan();
}
