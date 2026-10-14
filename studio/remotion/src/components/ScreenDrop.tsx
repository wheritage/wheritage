import React from "react";
import { AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, easeIn, easeOut } from "../brand";

// A screen recording that drops in on its keyword: a square-cornered card with a gold hairline,
// rising from below over the speaker. Muted: the voice keeps talking underneath.
export const ScreenDrop: React.FC<{ file: string }> = ({ file }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const inP = interpolate(frame, [0, 0.55 * fps], [0, 1], { easing: easeOut, extrapolateRight: "clamp" });
  const outP = interpolate(frame, [durationInFrames - 0.36 * fps, durationInFrames], [0, 1], { easing: easeIn, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 260 }}>
      <div
        style={{
          width: "86%", aspectRatio: "9 / 10", border: `1px solid ${BRAND.or}`, background: BRAND.noir, overflow: "hidden",
          transform: `translateY(${(1 - inP) * 120 + outP * 60}px)`, opacity: Math.min(inP, 1 - outP),
        }}
      >
        <OffthreadVideo src={staticFile(file)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </AbsoluteFill>
  );
};
