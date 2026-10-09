import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { springIn } from "../lib/motion";

export type ZoomPanProps = {
  children: React.ReactNode;
  /** "zoom-in" pushes toward the subject; "pan-out" starts tight and pulls back. */
  mode?: "zoom-in" | "pan-out" | "hold";
  /** Scale at the start and the end of the move. */
  from?: number;
  to?: number;
  /** Horizontal drift in % of the frame across the move (pan). */
  driftX?: number;
  driftY?: number;
  /** Frames the spring takes to settle. */
  durationInFrames?: number;
  delay?: number;
  /** Transform origin, e.g. "50% 35%" to keep a face in frame. */
  origin?: string;
};

/**
 * Spring-driven zoom ins and pan outs. Wrap any layer (the talking head, a
 * screen recording, an image) and it moves with a settle, no overshoot.
 */
export const ZoomPan: React.FC<ZoomPanProps> = ({
  children,
  mode = "zoom-in",
  from,
  to,
  driftX = 0,
  driftY = 0,
  durationInFrames,
  delay = 0,
  origin = "50% 40%",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = from ?? (mode === "pan-out" ? 1.18 : 1);
  const end = to ?? (mode === "pan-out" ? 1.04 : mode === "hold" ? start : 1.12);
  const p = springIn(frame, fps, delay, durationInFrames ?? Math.round(fps * 1.2));
  const scale = interpolate(p, [0, 1], [start, end]);
  const x = interpolate(p, [0, 1], [0, driftX]);
  const y = interpolate(p, [0, 1], [0, driftY]);
  return (
    <AbsoluteFill style={{ transform: `translate(${x}%, ${y}%) scale(${scale})`, transformOrigin: origin }}>
      {children}
    </AbsoluteFill>
  );
};
