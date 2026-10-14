import React from "react";
import type { Caption } from "@remotion/captions";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { easeIn, easeOut } from "../brand";

// Off by default (config/reel.json emojiPops.enabled): the W Héritage house style bans emoji pops.
// When enabled, they ease in without overshoot to stay on-brand.
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const EmojiPops: React.FC<{ captions: Caption[]; map: Record<string, string> }> = ({ captions, map }) => {
  const { fps } = useVideoConfig();
  const hits = Object.entries(map).flatMap(([word, emoji]) => {
    const c = captions.find((x) => norm(x.text).includes(norm(word)));
    return c ? [{ emoji, from: Math.round((c.startMs / 1000) * fps) }] : [];
  });
  return (
    <>
      {hits.map((h, i) => (
        <Sequence key={i} from={h.from} durationInFrames={Math.round(1.2 * fps)}>
          <Pop emoji={h.emoji} />
        </Sequence>
      ))}
    </>
  );
};

const Pop: React.FC<{ emoji: string }> = ({ emoji }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [0, 0.4 * fps], [0, 1], { easing: easeOut, extrapolateRight: "clamp" });
  const out = interpolate(frame, [durationInFrames - 0.26 * fps, durationInFrames], [0, 1], { easing: easeIn, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "flex-end", justifyContent: "center", paddingRight: 90 }}>
      <div style={{ fontSize: 140, transform: `scale(${0.7 + 0.3 * p})`, opacity: p * (1 - out) }}>{emoji}</div>
    </AbsoluteFill>
  );
};
