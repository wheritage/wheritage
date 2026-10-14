import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import reel from "../config/reel.json";
import { BRAND } from "./brand";
import { Captions } from "./components/Captions";
import { EmojiPops } from "./components/EmojiPop";
import { Footage } from "./components/Footage";
import { HookTitle } from "./components/HookTitle";
import { LowerThird } from "./components/LowerThird";
import { ProgressBar } from "./components/ProgressBar";
import { ScreenDrop } from "./components/ScreenDrop";
import type { ReelProps } from "./types";

export const Reel: React.FC<ReelProps> = ({ hook, plan }) => {
  const { fps } = useVideoConfig();
  if (!plan) return null;
  const f = (sec: number) => Math.round(sec * fps);
  const lt = reel.lowerThird;

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.noir }}>
      <Footage plan={plan} punchInScale={reel.punchInScale} />

      {plan.screenDrops.map((d) => (
        <Sequence key={d.keyword} from={f(d.startMs / 1000)} durationInFrames={f((d.endMs - d.startMs) / 1000)}>
          <ScreenDrop file={d.file} />
        </Sequence>
      ))}

      <Sequence from={f(lt.atSec)} durationInFrames={f(lt.durationSec)}>
        <LowerThird title={lt.title} subtitle={lt.subtitle} />
      </Sequence>

      <Captions captions={plan.captions} pageMs={reel.captionPageMs} popSfx={plan.audio.caption} />
      {reel.emojiPops.enabled && <EmojiPops captions={plan.captions} map={reel.emojiPops.map} />}

      <Sequence durationInFrames={f(2.6)}>
        <HookTitle text={hook} />
      </Sequence>

      <ProgressBar />

      {plan.audio.music && <Audio src={staticFile(plan.audio.music)} volume={reel.music.volume} loop />}
    </AbsoluteFill>
  );
};
