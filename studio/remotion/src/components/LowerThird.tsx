import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, easeIn, easeOut } from "../brand";

// Gold hairline draws, then name and role rise out of their masks (80 ms stagger). Exit accelerates, ~35% shorter.
export const LowerThird: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = (delay: number, dur = 0.6) =>
    interpolate(frame, [delay * fps, (delay + dur) * fps], [0, 1], { easing: easeOut, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exitDur = 0.39 * fps;
  const exit = interpolate(frame, [durationInFrames - exitDur, durationInFrames], [0, 1], { easing: easeIn, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line = enter(0, 0.5);
  const t1 = enter(0.15);
  const t2 = enter(0.23);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 72px 300px", opacity: 1 - exit }}>
      <div style={{ height: 1, width: 360, background: BRAND.or, transform: `scaleX(${line})`, transformOrigin: "left", marginBottom: 22 }} />
      <div style={{ overflow: "hidden" }}>
        <div style={{ transform: `translateY(${(1 - t1) * 100}%)`, fontFamily: BRAND.titleFont, fontWeight: 600, fontSize: 64, color: BRAND.ivory }}>{title}</div>
      </div>
      <div style={{ overflow: "hidden", marginTop: 6 }}>
        <div style={{ transform: `translateY(${(1 - t2) * 100}%)`, fontFamily: BRAND.bodyFont, fontSize: 28, letterSpacing: 3, textTransform: "uppercase", color: BRAND.or }}>{subtitle}</div>
      </div>
    </AbsoluteFill>
  );
};
