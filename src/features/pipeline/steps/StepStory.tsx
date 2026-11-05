"use client";

import { StoryCards } from "@/components/ui/StoryCards";
import { STORY } from "@/content/steps";
import { useStepDone } from "../PipelineProvider";
import type { StepSlug } from "../registry";

/** DO / SEE / NEXT for a step, unlocked once the step is done. */
export function StepStory({ step }: { step: StepSlug }) {
  const done = useStepDone(step);
  const s = STORY[step];
  return <StoryCards do={s.do} see={s.see} next={s.next} unlocked={done} lockedHint={s.locked} />;
}
