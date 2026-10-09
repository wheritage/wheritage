import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { inOut, springIn } from "../lib/motion";

export type AnimatedTitleProps = {
  /** Wrap words in *stars* to paint them in the accent colour. */
  text: string;
  durationInFrames: number;
  vertical?: boolean;
};

const parse = (text: string) =>
  text
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .flatMap((chunk) => {
      const accent = chunk.startsWith("*") && chunk.endsWith("*");
      return chunk
        .replace(/\*/g, "")
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => ({ word, accent }));
    });

/**
 * The hook. Each word rises out of its own mask (staggered), accented words are
 * terracotta and get an underline that wipes in once the line has landed.
 */
export const AnimatedTitle: React.FC<AnimatedTitleProps> = ({ text, durationInFrames, vertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = parse(text);
  const vis = inOut(frame, fps, durationInFrames, Math.round(fps * 0.4));
  const stagger = Math.round(fps * 0.07);
  const underline = springIn(frame, fps, words.length * stagger + 6, Math.round(fps * 0.6));

  return (
    <AbsoluteFill className="items-center justify-center" style={{ opacity: vis, padding: vertical ? 80 : 160 }}>
      <div
        className="font-display text-ink flex flex-wrap justify-center text-center font-black uppercase leading-[1.02]"
        style={{
          fontSize: vertical ? 118 : 108,
          columnGap: "0.28em",
          textShadow: "0 6px 30px rgba(0,0,0,0.45)",
          maxWidth: vertical ? 920 : 1500,
        }}
      >
        {words.map(({ word, accent }, i) => {
          const p = springIn(frame, fps, i * stagger, Math.round(fps * 0.9));
          return (
            <span key={i} className="relative inline-block overflow-hidden pb-[0.08em]">
              <span
                className={accent ? "text-accent inline-block" : "inline-block"}
                style={{ transform: `translateY(${(1 - p) * 105}%)` }}
              >
                {word}
              </span>
              {accent ? (
                <span
                  className="bg-accent absolute bottom-0 left-0 h-[0.09em] w-full"
                  style={{ transform: `scaleX(${underline})`, transformOrigin: "left" }}
                />
              ) : null}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
