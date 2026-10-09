import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { inOut, springIn } from "../lib/motion";

export type LowerThirdProps = {
  name: string;
  title: string;
  /** Total frames on screen, including the exit. */
  durationInFrames: number;
  vertical?: boolean;
};

/** Name + role card: an accent bar draws, then the two lines rise out of a mask. */
export const LowerThird: React.FC<LowerThirdProps> = ({ name, title, durationInFrames, vertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vis = inOut(frame, fps, durationInFrames, Math.round(fps * 0.6));
  const bar = springIn(frame, fps, 0, Math.round(fps * 0.6));
  const line1 = springIn(frame, fps, 4, Math.round(fps * 0.7));
  const line2 = springIn(frame, fps, 7, Math.round(fps * 0.7));

  return (
    <div
      className="absolute flex items-stretch gap-5"
      style={{
        left: vertical ? 64 : 96,
        bottom: vertical ? 1180 : 70,
        opacity: Math.min(1, vis * 1.5),
        transform: `translateX(${interpolate(vis, [0, 1], [-30, 0])}px)`,
      }}
    >
      <div className="w-2 bg-accent" style={{ transform: `scaleY(${bar})`, transformOrigin: "bottom" }} />
      <div className="flex flex-col gap-1">
        <div className="overflow-hidden">
          <div
            className="font-display text-ink font-extrabold tracking-tight"
            style={{ fontSize: vertical ? 54 : 46, transform: `translateY(${(1 - line1) * 110}%)` }}
          >
            {name}
          </div>
        </div>
        <div className="overflow-hidden">
          <div
            className="font-display text-accent font-semibold uppercase tracking-[0.18em]"
            style={{ fontSize: vertical ? 28 : 24, transform: `translateY(${(1 - line2) * 110}%)` }}
          >
            {title}
          </div>
        </div>
      </div>
    </div>
  );
};
