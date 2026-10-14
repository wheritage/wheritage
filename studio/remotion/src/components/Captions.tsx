import React, { useMemo } from "react";
import { createTikTokStyleCaptions, type Caption, type TikTokPage } from "@remotion/captions";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import reel from "../../config/reel.json";
import { BRAND, easeOut } from "../brand";

// Word-by-word captions: pages of a few words rise out of a mask; the word being said turns gold.
export const Captions: React.FC<{ captions: Caption[]; pageMs: number; popSfx: string | null }> = ({ captions, pageMs, popSfx }) => {
  const { fps } = useVideoConfig();
  const { pages } = useMemo(() => createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: pageMs }), [captions, pageMs]);
  return (
    <>
      {pages.map((page, i) => {
        const next = pages[i + 1];
        const from = Math.round((page.startMs / 1000) * fps);
        const endMs = next ? next.startMs : page.startMs + page.durationMs;
        const len = Math.max(1, Math.round((endMs / 1000) * fps) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={len}>
            <Page page={page} />
            {popSfx && <Audio src={staticFile(popSfx)} volume={reel.sfx.captionVolume} />}
          </Sequence>
        );
      })}
    </>
  );
};

const Page: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = page.startMs + (frame / fps) * 1000;
  const rise = interpolate(frame, [0, 0.4 * fps], [100, 0], { easing: easeOut, extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 520 }}>
      <div style={{ overflow: "hidden", padding: "0 80px" }}>
        <div
          style={{
            transform: `translateY(${rise}%)`, fontFamily: BRAND.bodyFont, fontWeight: 600, fontSize: 74,
            lineHeight: 1.15, textAlign: "center", color: BRAND.ivory, textShadow: "0 2px 12px rgba(8,8,8,.55)",
            whiteSpace: "pre-wrap",
          }}
        >
          {page.tokens.map((t, i) => (
            <span key={i} style={{ color: nowMs >= t.fromMs && nowMs < t.toMs ? BRAND.or : BRAND.ivory }}>{t.text}</span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
