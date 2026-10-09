import React, { useMemo } from "react";
import { Audio, Sequence, getStaticFiles, interpolate, staticFile, useVideoConfig } from "remotion";
import type { Caption } from "@remotion/captions";
import type { EditConfig, SoundPack } from "../lib/edit-schema";
import { AUDIO_EXT, soundRoleOf } from "../lib/sound-roles";

/**
 * Resolve the pack from the live public/assets/sound folder when Remotion can
 * list it (Studio and renders), falling back to what the pipeline recorded.
 */
const useSoundPack = (recorded: SoundPack): SoundPack =>
  useMemo(() => {
    let files: string[] = [];
    try {
      files = getStaticFiles()
        .map((f) => f.name)
        .filter((n) => n.startsWith("assets/sound/") && AUDIO_EXT.test(n))
        .sort();
    } catch {
      files = [];
    }
    if (!files.length) return recorded;
    const pack: SoundPack = { all: files };
    for (const f of files) {
      const role = soundRoleOf(f);
      if (role && !pack[role]) pack[role] = f;
    }
    return pack;
  }, [recorded]);

export type SoundLayerProps = {
  sounds: SoundPack;
  config: EditConfig["sound"];
  /** Output times (s) of every cut, for whooshes. */
  cuts: number[];
  words: Caption[];
};

/**
 * Sound map: intro riser over the first 2 s, lofi bed looped under everything
 * (ducked in and out), whoosh on cuts, pop on each caption word.
 */
export const SoundLayer: React.FC<SoundLayerProps> = ({ sounds: recorded, config, cuts, words }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const sounds = useSoundPack(recorded);
  const v = config.volumes;

  const whooshes = useMemo(() => {
    const out: number[] = [];
    for (const t of cuts) if (!out.length || t - out[out.length - 1] >= config.whooshMinGapSec) out.push(t);
    return out;
  }, [cuts, config.whooshMinGapSec]);

  const pops = useMemo(() => {
    const out: number[] = [];
    for (const w of words) {
      const t = w.startMs / 1000;
      if (!out.length || t - out[out.length - 1] >= config.popMinGapSec) out.push(t);
    }
    return out;
  }, [words, config.popMinGapSec]);

  const f = (s: number) => Math.round(s * fps);
  const fadeIn = f(1.5);
  const fadeOut = f(2);

  return (
    <>
      {sounds.intro ? (
        <Sequence durationInFrames={f(2)} name="SFX intro riser">
          <Audio
            src={staticFile(sounds.intro)}
            volume={(fr) => v.intro * interpolate(fr, [f(1.6), f(2)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
          />
        </Sequence>
      ) : null}
      {sounds.bed ? (
        <Audio
          name="Music lofi bed"
          src={staticFile(sounds.bed)}
          loop
          volume={(fr) =>
            v.bed *
            interpolate(fr, [0, fadeIn, durationInFrames - fadeOut, durationInFrames], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }
        />
      ) : null}
      {sounds.transition
        ? whooshes.map((t, i) => (
            // Whoosh peaks a few frames before the cut so it "pulls" into the next shot.
            <Sequence key={`w${i}`} from={Math.max(0, f(t) - 6)} durationInFrames={f(1)} name="SFX whoosh">
              <Audio src={staticFile(sounds.transition!)} volume={v.transition} />
            </Sequence>
          ))
        : null}
      {sounds.word
        ? pops.map((t, i) => (
            <Sequence key={`p${i}`} from={f(t)} durationInFrames={f(0.4)} name="SFX caption pop">
              <Audio src={staticFile(sounds.word!)} volume={v.word} />
            </Sequence>
          ))
        : null}
    </>
  );
};
