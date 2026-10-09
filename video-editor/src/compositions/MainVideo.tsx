import React, { useMemo } from "react";
import {
  AbsoluteFill,
  type CalculateMetadataFunction,
  OffthreadVideo,
  Sequence,
  Audio,
  staticFile,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { AnimatedTitle } from "../components/AnimatedTitle";
import { Captions } from "../components/Captions";
import { BRoll, ScreenInsert } from "../components/Inserts";
import { LowerThird } from "../components/LowerThird";
import { ProgressBar } from "../components/ProgressBar";
import { SceneTransition } from "../components/SceneTransition";
import { SoundLayer } from "../components/SoundLayer";
import { ZoomPan } from "../components/ZoomPan";
import { normalizeWord } from "../lib/captions";
import { EDIT_FILE, type EditDecision, type Segment } from "../lib/edit-schema";
import "../lib/fonts";

export const mainVideoSchema = z.object({
  /** Overrides the config hook; renderVariants() sets this per cut. */
  hook: z.string().optional(),
});

type Props = z.infer<typeof mainVideoSchema> & { edit?: EditDecision | null };

const PLACEHOLDER_SECONDS = 6;

export const calculateMainVideoMetadata: CalculateMetadataFunction<Props> = async ({ props, abortSignal }) => {
  let edit: EditDecision | null = null;
  try {
    const res = await fetch(staticFile(EDIT_FILE), { signal: abortSignal, cache: "no-store" });
    if (res.ok) edit = await res.json();
  } catch {
    edit = null;
  }
  const fps = edit?.fps ?? 30;
  return {
    fps,
    durationInFrames: Math.max(1, Math.ceil((edit?.duration ?? PLACEHOLDER_SECONDS) * fps)),
    props: { ...props, edit },
  };
};

/** One kept stretch of the raw take, framed by an alternating spring zoom that hides the jump cut. */
const TalkingHead: React.FC<{ src: string; seg: Segment; index: number; fps: number; frames: number }> = ({
  src,
  seg,
  index,
  fps,
  frames,
}) => {
  const video = (
    <OffthreadVideo
      src={staticFile(src)}
      trimBefore={Math.round(seg.srcStart * fps)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
  // Even segments push in slowly; odd ones open tight and pull back.
  return index % 2 === 0 ? (
    <ZoomPan mode="zoom-in" from={1} to={1.06} durationInFrames={frames}>
      {video}
    </ZoomPan>
  ) : (
    <ZoomPan mode="pan-out" from={1.16} to={1.1} durationInFrames={Math.min(frames, Math.round(fps * 1.5))}>
      {video}
    </ZoomPan>
  );
};

const NoEdit: React.FC = () => (
  <AbsoluteFill className="bg-stage items-center justify-center p-24 text-center">
    <div className="font-display text-ink text-6xl font-black uppercase">No edit yet</div>
    <div className="font-display text-accent mt-6 text-3xl font-semibold">
      Drop a take in raw-footage/ and run npm run edit
    </div>
  </AbsoluteFill>
);

export const MainVideo: React.FC<Props> = ({ edit, hook }) => {
  const { fps, width, height } = useVideoConfig();
  const vertical = height > width;

  const cuts = useMemo(() => {
    if (!edit) return [];
    const insertEdges = edit.inserts.flatMap((i) => [i.start, i.start + i.duration]);
    const segmentEdges = edit.segments.slice(1).map((s) => s.outStart);
    return (edit.config.sound.whooshOn === "inserts" ? insertEdges : [...segmentEdges, ...insertEdges]).sort((a, b) => a - b);
  }, [edit]);

  const emoji = useMemo(() => {
    if (!edit?.config.features.emojiPops) return {};
    return Object.fromEntries(Object.entries(edit.config.emoji).map(([k, v]) => [normalizeWord(k), v]));
  }, [edit]);

  if (!edit) return <NoEdit />;

  const { config, segments, inserts, source } = edit;
  const f = (s: number) => Math.round(s * fps);
  const isAudioOnly = !source.width;
  const titleFrames = f(2.6);
  const theme = {
    "--color-accent": config.theme.accent,
    "--color-ink": config.theme.text,
    "--color-stage": config.theme.background,
    "--font-display": `"${config.theme.font}", system-ui, sans-serif`,
  } as React.CSSProperties;

  return (
    <AbsoluteFill className="bg-stage" style={theme}>
      {/* Layer 1: the raw take with dead air removed. */}
      {segments.map((seg, i) => {
        const from = f(seg.outStart);
        const to = f(seg.outStart + (seg.srcEnd - seg.srcStart));
        const frames = Math.max(1, to - from);
        return (
          <Sequence key={i} from={from} durationInFrames={frames} premountFor={fps} name={`Take ${i + 1}`}>
            {isAudioOnly ? (
              <Audio src={staticFile(source.src)} trimBefore={Math.round(seg.srcStart * fps)} />
            ) : config.features.zoom ? (
              <TalkingHead src={source.src} seg={seg} index={i} fps={fps} frames={frames} />
            ) : (
              <OffthreadVideo
                src={staticFile(source.src)}
                trimBefore={Math.round(seg.srcStart * fps)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </Sequence>
        );
      })}

      {/* Layer 2: b-roll overlays and screen recordings on cue. */}
      {inserts.map((ins, i) => (
        <Sequence key={`ins${i}`} from={f(ins.start)} durationInFrames={f(ins.duration)} premountFor={fps} name={`${ins.kind}: ${ins.keyword}`}>
          {ins.kind === "broll" ? <BRoll insert={ins} /> : <ScreenInsert insert={ins} vertical={vertical} />}
        </Sequence>
      ))}

      {/* Layer 3: graphics. */}
      {config.features.title ? (
        <Sequence durationInFrames={titleFrames} name="Title">
          <AbsoluteFill className="bg-black/35" />
          <AbsoluteFill style={vertical ? { top: -260 } : undefined}>
            <AnimatedTitle text={hook ?? config.hook} durationInFrames={titleFrames} vertical={vertical} />
          </AbsoluteFill>
        </Sequence>
      ) : null}
      {config.features.lowerThird && edit.duration > 6 ? (
        <Sequence from={f(3)} durationInFrames={f(4)} name="Lower third">
          <LowerThird name={config.speaker.name} title={config.speaker.title} durationInFrames={f(4)} vertical={vertical} />
        </Sequence>
      ) : null}
      <Captions
        words={edit.words}
        wordsPerPage={config.captions.wordsPerPage}
        uppercase={config.captions.uppercase}
        emoji={emoji}
        vertical={vertical}
      />
      {config.features.transitions
        ? inserts.flatMap((ins, i) =>
            [ins.start, ins.start + ins.duration].map((t, k) => (
              <Sequence key={`tr${i}-${k}`} from={Math.max(0, f(t) - 6)} durationInFrames={12} name="Transition">
                <SceneTransition durationInFrames={12} direction={k ? "right" : "left"} />
              </Sequence>
            )),
          )
        : null}
      {config.features.progressBar ? <ProgressBar height={vertical ? 14 : 10} /> : null}

      {/* Layer 4: sound pack. */}
      <SoundLayer sounds={edit.sounds} config={config.sound} cuts={cuts} words={edit.words} />
    </AbsoluteFill>
  );
};
