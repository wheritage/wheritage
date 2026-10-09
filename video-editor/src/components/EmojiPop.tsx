import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SNAPPY, springIn } from "../lib/motion";

export type EmojiPopProps = {
  emoji: string;
  /** Frames on screen. */
  durationInFrames: number;
  size?: number;
  /** Small horizontal offset so consecutive pops do not stack. */
  offsetX?: number;
};

/** An emoji that pops in on its caption word, floats up, and fades. */
export const EmojiPop: React.FC<EmojiPopProps> = ({ emoji, durationInFrames, size = 150, offsetX = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = springIn(frame, fps, 0, undefined, SNAPPY);
  const rise = interpolate(frame, [0, durationInFrames], [0, -40]);
  const fade = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tilt = interpolate(pop, [0, 1], [-14, offsetX >= 0 ? 6 : -6]);
  return (
    <div
      className="pointer-events-none absolute bottom-0 left-1/2 select-none"
      style={{
        fontSize: size,
        lineHeight: 1,
        opacity: fade,
        transform: `translate(calc(-50% + ${offsetX}px), ${rise}px) scale(${pop}) rotate(${tilt}deg)`,
        filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.35))",
      }}
    >
      {emoji}
    </div>
  );
};
