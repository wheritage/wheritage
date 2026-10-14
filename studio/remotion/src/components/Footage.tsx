import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useVideoConfig } from "remotion";
import reel from "../../config/reel.json";
import { BRAND } from "../brand";
import type { Plan } from "../types";
import { ZoomIn } from "./ZoomIn";

// The kept segments, butted end to end. Every other segment is punched in so jump cuts read as
// deliberate reframes; a soft whoosh sits on each cut.
export const Footage: React.FC<{ plan: Plan; punchInScale: number }> = ({ plan, punchInScale }) => {
  const { fps } = useVideoConfig();
  if (!plan.source) {
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", color: BRAND.or, fontFamily: BRAND.bodyFont, fontSize: 34, letterSpacing: 2 }}>
        Drop a take in public/raw-footage, then run npm run edit
      </AbsoluteFill>
    );
  }
  let at = 0;
  return (
    <>
      {plan.segments.map((s, i) => {
        const len = Math.max(1, Math.round((s.to - s.from) * fps));
        const from = at;
        at += len;
        return (
          <Sequence key={i} from={from} durationInFrames={len}>
            <ZoomIn scale={i % 2 ? punchInScale : 1}>
              <OffthreadVideo
                src={staticFile(plan.source!)}
                trimBefore={Math.round(s.from * fps)}
                trimAfter={Math.round(s.from * fps) + len}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </ZoomIn>
            {i > 0 && plan.audio.cut && <Audio src={staticFile(plan.audio.cut)} volume={reel.sfx.cutVolume} />}
          </Sequence>
        );
      })}
    </>
  );
};
