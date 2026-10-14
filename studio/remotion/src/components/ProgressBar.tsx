import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "../brand";

export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill>
      <div style={{ height: 6, background: "rgba(244,239,227,.15)" }}>
        <div style={{ height: "100%", background: BRAND.or, transform: `scaleX(${frame / Math.max(1, durationInFrames - 1)})`, transformOrigin: "left" }} />
      </div>
    </AbsoluteFill>
  );
};
