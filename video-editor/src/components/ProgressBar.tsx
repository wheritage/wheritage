import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

/** Thin accent bar along the bottom edge showing how much of the video is left. */
export const ProgressBar: React.FC<{ height?: number }> = ({ height = 10 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = Math.min(1, (frame + 1) / durationInFrames);
  return (
    <div className="absolute bottom-0 left-0 w-full bg-white/15" style={{ height }}>
      <div className="bg-accent h-full" style={{ width: `${p * 100}%` }} />
    </div>
  );
};
