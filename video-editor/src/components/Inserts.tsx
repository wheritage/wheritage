import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Insert } from "../lib/edit-schema";
import { inOut, springIn } from "../lib/motion";
import { ZoomPan } from "./ZoomPan";

const Media: React.FC<{ insert: Insert; fit: "cover" | "contain" }> = ({ insert, fit }) =>
  insert.media === "video" ? (
    <OffthreadVideo src={staticFile(insert.src)} muted style={{ width: "100%", height: "100%", objectFit: fit }} />
  ) : (
    <Img src={staticFile(insert.src)} style={{ width: "100%", height: "100%", objectFit: fit }} />
  );

/**
 * B-roll overlay: full-bleed, muted (the voice keeps running underneath), slow
 * push-in, cross-fades in and out.
 */
export const BRoll: React.FC<{ insert: Insert }> = ({ insert }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vis = inOut(frame, fps, Math.round(insert.duration * fps), Math.round(fps * 0.35));
  return (
    <AbsoluteFill style={{ opacity: vis }}>
      <ZoomPan mode="zoom-in" from={1.02} to={1.1} durationInFrames={Math.round(insert.duration * fps)}>
        <Media insert={insert} fit="cover" />
      </ZoomPan>
    </AbsoluteFill>
  );
};

/**
 * Screen recording on cue: slides up as a framed window over a dimmed talking
 * head, then pushes in so UI text stays legible on a phone.
 */
export const ScreenInsert: React.FC<{ insert: Insert; vertical: boolean }> = ({ insert, vertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = Math.round(insert.duration * fps);
  const vis = inOut(frame, fps, total, Math.round(fps * 0.5));
  const enter = springIn(frame, fps, 0, Math.round(fps * 0.6));
  const y = interpolate(enter, [0, 1], [8, 0]);
  return (
    <AbsoluteFill>
      <AbsoluteFill className="bg-black" style={{ opacity: vis * 0.72 }} />
      <AbsoluteFill className="items-center justify-center" style={{ opacity: vis, transform: `translateY(${y}%)` }}>
        <div
          className="border-accent relative overflow-hidden border-4 bg-black shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
          style={vertical ? { width: 980, height: 1240 } : { width: 1560, height: 880 }}
        >
          <ZoomPan mode="zoom-in" from={1} to={1.08} delay={Math.round(fps * 0.5)} durationInFrames={total}>
            <Media insert={insert} fit={vertical ? "cover" : "contain"} />
          </ZoomPan>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
