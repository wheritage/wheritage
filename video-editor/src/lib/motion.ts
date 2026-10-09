import { Easing, interpolate, spring } from "remotion";

/** Critically damped: settles without overshoot. The default for camera moves. */
export const SMOOTH = { damping: 200, mass: 1, stiffness: 100 } as const;
/** A little life for pops (emoji, active caption word). */
export const SNAPPY = { damping: 14, mass: 0.6, stiffness: 180 } as const;

type SpringConfig = { damping: number; mass: number; stiffness: number };

export const springIn = (
  frame: number,
  fps: number,
  delay = 0,
  durationInFrames?: number,
  config: SpringConfig = SMOOTH,
) =>
  spring({ frame: frame - delay, fps, config, durationInFrames });

/** Entrance 0→1 then accelerated exit 1→0 that runs ~35% shorter. */
export const inOut = (frame: number, fps: number, total: number, inFrames = Math.round(fps * 0.5)) => {
  const outFrames = Math.max(1, Math.round(inFrames * 0.65));
  const enter = springIn(frame, fps, 0, inFrames);
  const exit = interpolate(frame, [total - outFrames, total], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });
  return enter * (1 - exit);
};
