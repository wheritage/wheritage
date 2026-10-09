import type { Caption } from "@remotion/captions";
import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { normalizeWord, paginate, type CaptionPage } from "../lib/captions";
import { SNAPPY, springIn } from "../lib/motion";
import { EmojiPop } from "./EmojiPop";

export type CaptionsProps = {
  words: Caption[];
  wordsPerPage: number;
  uppercase: boolean;
  /** Normalised word -> emoji. Empty to disable emoji pops. */
  emoji: Record<string, string>;
  vertical: boolean;
};

const Page: React.FC<{ page: CaptionPage; uppercase: boolean; vertical: boolean }> = ({ page, uppercase, vertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = page.startMs + (frame / fps) * 1000;

  return (
    <div
      className={[
        "font-display flex flex-wrap justify-center text-center font-black leading-[1.05]",
        "tracking-tight [text-shadow:0_4px_0_rgba(0,0,0,0.55),0_10px_28px_rgba(0,0,0,0.5)]",
        uppercase ? "uppercase" : "",
        vertical ? "text-[96px] gap-x-[0.24em] max-w-[960px]" : "text-[76px] gap-x-[0.22em] max-w-[1500px]",
      ].join(" ")}
    >
      {page.words.map((w, i) => {
        const spoken = nowMs >= w.startMs;
        const active = spoken && (nowMs < w.endMs || i === page.words.length - 1 || nowMs < page.words[i + 1].startMs);
        const local = Math.round(((w.startMs - page.startMs) / 1000) * fps);
        const pop = springIn(frame, fps, local, undefined, SNAPPY);
        return (
          <span
            key={i}
            className={[
              "inline-block",
              active ? "text-accent" : "text-ink",
              spoken ? "opacity-100" : "opacity-0",
            ].join(" ")}
            style={{ transform: `translateY(${(1 - pop) * 18}px) scale(${active ? 0.92 + pop * 0.12 : 1})` }}
          >
            {w.text.trim().replace(/[,;:]$/, "")}
          </span>
        );
      })}
    </div>
  );
};

/** Word-by-word captions: each word lands as it is spoken, the live word in the accent. */
export const Captions: React.FC<CaptionsProps> = ({ words, wordsPerPage, uppercase, emoji, vertical }) => {
  const { fps } = useVideoConfig();
  const pages = useMemo(() => paginate(words, wordsPerPage), [words, wordsPerPage]);
  const pops = useMemo(
    () =>
      words.flatMap((w, i) => {
        const e = emoji[normalizeWord(w.text)];
        return e ? [{ e, startMs: w.startMs, i }] : [];
      }),
    [words, emoji],
  );
  const toFrame = (ms: number) => Math.round((ms / 1000) * fps);

  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const from = toFrame(page.startMs);
        const next = pages[i + 1] ? toFrame(pages[i + 1].startMs) : from + toFrame(page.endMs - page.startMs + 600);
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, next - from)} layout="none" name={`Caption ${i + 1}`}>
            <div className="absolute flex w-full justify-center" style={{ bottom: vertical ? 560 : 230 }}>
              <Page page={page} uppercase={uppercase} vertical={vertical} />
            </div>
          </Sequence>
        );
      })}
      {pops.map(({ e, startMs, i }) => (
        <Sequence key={`emoji-${i}`} from={toFrame(startMs)} durationInFrames={Math.round(fps * 0.9)} layout="none" name={`Emoji ${e}`}>
          <div className="absolute w-full" style={{ bottom: vertical ? 780 : 400 }}>
            <EmojiPop emoji={e} durationInFrames={Math.round(fps * 0.9)} size={vertical ? 170 : 130} offsetX={i % 2 ? 90 : -90} />
          </div>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
