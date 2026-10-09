import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";

export type SceneTransitionProps = {
  /** Frames the wipe covers; centre it on the cut. */
  durationInFrames: number;
  /** Whoosh file relative to public/. Omit for a silent wipe. */
  sound?: string;
  volume?: number;
  /** Draw the accent wipe (false = sound only, for plain jump cuts). */
  visual?: boolean;
  direction?: "left" | "right";
};

/**
 * Accent panel that sweeps across the frame, covering the cut at its midpoint,
 * with the whoosh from the sound pack.
 */
export const SceneTransition: React.FC<SceneTransitionProps> = ({
  durationInFrames,
  sound,
  volume = 0.5,
  visual = true,
  direction = "left",
}) => {
  const frame = useCurrentFrame();
  const sign = direction === "left" ? -1 : 1;
  const half = durationInFrames / 2;
  // In: decelerate onto the frame. Out: accelerate away.
  const x =
    frame < half
      ? interpolate(frame, [0, half], [100, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.exp) })
      : interpolate(frame, [half, durationInFrames], [0, -100], { extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });

  return (
    <>
      {sound ? <Audio src={staticFile(sound)} volume={volume} /> : null}
      {visual ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <AbsoluteFill className="bg-accent" style={{ transform: `translateX(${-sign * x}%) skewX(-8deg) scaleX(1.2)` }} />
        </AbsoluteFill>
      ) : null}
    </>
  );
};
