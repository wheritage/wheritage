// STEP 05: output. Bundles once, then renders the landscape master, the 9:16
// vertical, and (optionally) hook variants.
//
//   npm run render                       16:9 + 9:16
//   npm run render -- --only=vertical
//   npm run variants                     5 vertical cuts, one per hook in edit.config.json
//   npm run variants -- "Hook one" "Hook *two*"
//
// The plain Remotion CLI works too:
//   npx remotion render src/index.ts MainVideo out.mp4

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EDIT_FILE, type EditConfig, type EditDecision } from "../src/lib/edit-schema";
import { printStats, type RenderResult } from "./lib/stats";

const ROOT = process.cwd();
// Same switch as remotion.config.ts: reuse an installed Chrome instead of downloading one.
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? null;
const OUT = path.join(ROOT, "out");

let bundlePromise: Promise<string> | null = null;
const getBundle = () => {
  bundlePromise ??= (async () => {
    process.stdout.write("● Bundling compositions… ");
    const { enableTailwind } = await import("@remotion/tailwind-v4");
    const url = await bundle({
      entryPoint: path.join(ROOT, "src/index.ts"),
      publicDir: path.join(ROOT, "public"),
      // Same as remotion.config.ts; bundlerOverride covers both webpack and rspack.
      bundlerOverride: (c) => enableTailwind(c),
      rspack: true,
    });
    console.log("done");
    return url;
  })();
  return bundlePromise;
};

export const readEdit = (): EditDecision | null => {
  const p = path.join(ROOT, "public", EDIT_FILE);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
};

const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

type Job = { id: "MainVideo" | "MainVideoVertical"; file: string; label: string; hook?: string; concurrency?: number };

const renderOne = async (job: Job): Promise<RenderResult> => {
  const serveUrl = await getBundle();
  const inputProps = job.hook ? { hook: job.hook } : {};
  const composition = await selectComposition({ serveUrl, id: job.id, inputProps, browserExecutable });
  mkdirSync(path.dirname(job.file), { recursive: true });
  const t0 = performance.now();
  let lastPct = -10;
  await renderMedia({
    serveUrl,
    composition,
    inputProps,
    codec: "h264",
    outputLocation: job.file,
    concurrency: job.concurrency ?? null,
    browserExecutable,
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 100);
      if (pct >= lastPct + 10) {
        lastPct = pct;
        console.log(`  ${job.label.padEnd(24)} ${String(pct).padStart(3)}%`);
      }
    },
  });
  return {
    label: job.label,
    file: path.relative(ROOT, job.file),
    width: composition.width,
    height: composition.height,
    frames: composition.durationInFrames,
    fps: composition.fps,
    bytes: statSync(job.file).size,
    renderMs: performance.now() - t0,
  };
};

/** Render several jobs side by side, sharing the machine's cores between them. */
const renderAll = async (jobs: Job[]) => {
  const t0 = performance.now();
  const per = Math.max(1, Math.floor(os.availableParallelism() / jobs.length));
  await getBundle();
  const results = await Promise.all(jobs.map((j) => renderOne({ ...j, concurrency: per })));
  printStats(results, readEdit(), performance.now() - t0);
  return results;
};

export const renderMain = (only?: "landscape" | "vertical") => {
  const jobs: Job[] = [];
  if (only !== "vertical") jobs.push({ id: "MainVideo", file: path.join(OUT, "MainVideo.mp4"), label: "16:9  1920x1080" });
  if (only !== "landscape") jobs.push({ id: "MainVideoVertical", file: path.join(OUT, "MainVideo-vertical.mp4"), label: "9:16  1080x1920" });
  return renderAll(jobs);
};

/**
 * Bulk render: one vertical cut per hook, all at once. Defaults to the five
 * hooks in edit.config.json.
 */
export async function renderVariants(hooks: string[]): Promise<RenderResult[]> {
  const list = hooks.slice(0, 5);
  if (!list.length) throw new Error("renderVariants() needs at least one hook");
  return renderAll(
    list.map((hook, i) => ({
      id: "MainVideoVertical",
      hook,
      label: `cut ${i + 1}: ${hook.replace(/\*/g, "").slice(0, 16)}`,
      file: path.join(OUT, "variants", `${i + 1}-${slug(hook.replace(/\*/g, ""))}.mp4`),
    })),
  );
}

const configHooks = (): string[] =>
  (JSON.parse(readFileSync(path.join(ROOT, "edit.config.json"), "utf8")) as EditConfig).hooks;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const only = args.find((a) => a.startsWith("--only="))?.split("=")[1] as "landscape" | "vertical" | undefined;
  if (!readEdit()) {
    console.error("No edit yet. Drop a take in raw-footage/ and run `npm run edit` first.");
    process.exit(1);
  }
  if (args.includes("--variants")) {
    const custom = args.filter((a) => !a.startsWith("--"));
    await renderVariants(custom.length ? custom : configHooks());
  } else {
    await renderMain(only);
  }
}
