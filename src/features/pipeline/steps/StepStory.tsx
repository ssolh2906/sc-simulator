"use client";

import { StoryCards } from "@/components/ui/StoryCards";
import { STORY, type StorySlug } from "@/content/steps";
import { useStepDone } from "../PipelineProvider";

/** DO / SEE for a step, unlocked once the step is done. */
export function StepStory({ step }: { step: StorySlug }) {
  const done = useStepDone(step);
  const s = STORY[step];
  return <StoryCards do={s.do} see={s.see} unlocked={done} lockedHint={s.locked} />;
}
