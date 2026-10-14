import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, easeIn, easeOut } from "../brand";

// The variant's hook line over the first beat: rises out of its mask (1.1 s), holds, exits faster.
export const HookTitle: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const inP = interpolate(frame, [0, 1.1 * fps], [0, 1], { easing: easeOut, extrapolateRight: "clamp" });
  const outP = interpolate(frame, [durationInFrames - 0.4 * fps, durationInFrames], [0, 1], { easing: easeIn, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", padding: "300px 80px 0", opacity: 1 - outP }}>
      <div style={{ overflow: "hidden" }}>
        <div
          style={{
            transform: `translateY(${(1 - inP) * 100}%)`, fontFamily: BRAND.titleFont, fontWeight: 600, fontSize: 104,
            lineHeight: 1.02, color: BRAND.ivory, textShadow: "0 2px 18px rgba(8,8,8,.6)",
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
