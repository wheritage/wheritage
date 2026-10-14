// Bulk render: one MP4 per hook variant (config/hooks.json) from the same edit plan.
//
//   node scripts/render-variants.mjs hook1 hook2 hook3 hook4 hook5
//   import { renderVariants } from "./scripts/render-variants.mjs"; await renderVariants(["hook1", "hook2"]);
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function renderVariants(ids, { outDir = path.join(ROOT, "out") } = {}) {
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "public") });
  const browserExecutable = process.env.REMOTION_BROWSER ?? null;
  const outputs = [];
  for (const id of ids) {
    const composition = await selectComposition({ serveUrl, id, browserExecutable });
    const outputLocation = path.join(outDir, `${id}.mp4`);
    let last = -1;
    await renderMedia({
      serveUrl, composition, codec: "h264", outputLocation, browserExecutable,
      onProgress: ({ progress }) => {
        const pct = Math.floor(progress * 10) * 10;
        if (pct !== last) { last = pct; process.stdout.write(`\r${id}: ${pct}%`); }
      },
    });
    process.stdout.write(`\r${id}: done -> ${path.relative(process.cwd(), outputLocation)}\n`);
    outputs.push(outputLocation);
  }
  return outputs;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ids = process.argv.slice(2);
  renderVariants(ids.length ? ids : ["hook1", "hook2", "hook3", "hook4", "hook5"]).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
