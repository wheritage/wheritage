import React from "react";
import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import reel from "../config/reel.json";
import hooks from "../config/hooks.json";
import { Reel } from "./Reel";
import type { Plan, ReelProps } from "./types";

// Shown in Studio until `npm run edit` has written public/edit/plan.json.
const EMPTY_PLAN: Plan = {
  source: null, fps: reel.fps, durationSec: 6, segments: [], captions: [], screenDrops: [],
  audio: { music: null, cut: null, caption: null },
};

const withPlan: CalculateMetadataFunction<ReelProps> = async ({ props }) => {
  let plan = EMPTY_PLAN;
  try {
    const res = await fetch(staticFile("edit/plan.json"));
    if (res.ok) plan = (await res.json()) as Plan;
  } catch {
    // no plan yet
  }
  return { durationInFrames: Math.max(1, Math.round(plan.durationSec * reel.fps)), props: { ...props, plan } };
};

export const RemotionRoot: React.FC = () => (
  <>
    {Object.entries(hooks).map(([id, h]) => (
      <Composition
        key={id}
        id={id}
        component={Reel}
        fps={reel.fps}
        width={reel.width}
        height={reel.height}
        durationInFrames={180}
        defaultProps={{ hook: h.text, plan: null } satisfies ReelProps}
        calculateMetadata={withPlan}
      />
    ))}
  </>
);
