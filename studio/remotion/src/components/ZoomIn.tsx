import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { easeOut } from "../brand";

// Static punch-in for a jump cut (scale), plus an optional slow push (drift) across the shot.
// `ease` > 0 eases into the scale instead of cutting to it, for an emphasis zoom on one word.
export const ZoomIn: React.FC<{ scale?: number; drift?: number; ease?: number; children: React.ReactNode }> = ({
  scale = 1, drift = 0.015, ease = 0, children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const easedIn = ease > 0 ? interpolate(frame, [0, ease * fps], [1, scale], { easing: easeOut, extrapolateRight: "clamp" }) : scale;
  const push = interpolate(frame, [0, durationInFrames], [0, drift], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ transform: `scale(${easedIn + push})`, overflow: "hidden" }}>{children}</AbsoluteFill>;
};
