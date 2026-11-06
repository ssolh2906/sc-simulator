"use client";

import { SeeCard } from "@/components/ui/StoryCards";
import { STORY, type StorySlug } from "@/content/steps";
import { useStepDone } from "../PipelineProvider";

/** SEE for a step, unlocked once the step is done. DO is rendered above the step body by the page. */
export function StepStory({ step }: { step: StorySlug }) {
  const done = useStepDone(step);
  const s = STORY[step];
  return <SeeCard see={s.see} unlocked={done} lockedHint={s.locked} />;
}
