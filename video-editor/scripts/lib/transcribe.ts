// STEP 02b: word-level transcription with Whisper (whisper.cpp, runs locally).
// Results are cached next to the raw take as <name>.captions.json, so a second
// `npm run edit` is instant and you (or Claude) can hand-fix a misheard word in
// that file and re-run.

import type { Caption } from "@remotion/captions";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { runFf } from "./media";

export const WHISPER_DIR = path.join(process.cwd(), "whisper.cpp");

export const captionsPathFor = (rawFile: string) =>
  rawFile.replace(/\.[^.]+$/, ".captions.json");

export type TranscribeOptions = { model: string; language: string; version: string };

export const transcribeTake = async (
  rawFile: string,
  opts: TranscribeOptions,
): Promise<{ captions: Caption[]; cached: boolean } | null> => {
  const cache = captionsPathFor(rawFile);
  if (existsSync(cache)) {
    return { captions: JSON.parse(readFileSync(cache, "utf8")), cached: true };
  }

  const { installWhisperCpp, downloadWhisperModel, transcribe, toCaptions } = await import(
    "@remotion/install-whisper-cpp"
  );
  const tmpDir = path.join(process.cwd(), ".tmp");
  mkdirSync(tmpDir, { recursive: true });
  const wav = path.join(tmpDir, `${path.basename(rawFile)}.16k.wav`);
  try {
    await installWhisperCpp({ to: WHISPER_DIR, version: opts.version, printOutput: true });
    await downloadWhisperModel({
      folder: WHISPER_DIR,
      model: opts.model as Parameters<typeof downloadWhisperModel>[0]["model"],
      printOutput: true,
    });
    runFf("ffmpeg", ["-v", "error", "-y", "-i", rawFile, "-vn", "-ac", "1", "-ar", "16000", wav]);
    const whisperCppOutput = await transcribe({
      inputPath: wav,
      whisperPath: WHISPER_DIR,
      whisperCppVersion: opts.version,
      model: opts.model as Parameters<typeof transcribe>[0]["model"],
      tokenLevelTimestamps: true,
      splitOnWord: true,
      printOutput: false,
      translateToEnglish: false,
      language: opts.language as Parameters<typeof transcribe>[0]["language"],
    });
    const { captions } = toCaptions({ whisperCppOutput });
    writeFileSync(cache, JSON.stringify(captions, null, 2));
    return { captions, cached: false };
  } catch (err) {
    console.warn(
      `  ! Whisper unavailable (${(err as Error).message.split("\n")[0]}).\n` +
        `    The edit continues without captions. To add them, fix the error above or drop a\n` +
        `    Remotion Caption[] JSON at ${path.relative(process.cwd(), cache)} and re-run.`,
    );
    return null;
  } finally {
    rmSync(wav, { force: true });
  }
};
