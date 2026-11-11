"use client";

import { NextAction } from "@/components/ui/NextAction";
import { DoCard, SeeCard } from "@/components/ui/StoryCards";
import { STORY, type StorySlug } from "@/content/steps";
import { useStepDone } from "../PipelineProvider";

/** Top tier: the goal, then the one thing to do now. `hint={false}` for steps with their own guide. */
export function StepTask({ step, hint = true }: { step: StorySlug; hint?: boolean }) {
  const done = useStepDone(step);
  const s = STORY[step];
  return (
    <>
      <DoCard>{s.do}</DoCard>
      {hint && <NextAction>{done ? "✓ Done. Read what you saw below, then go to the next step." : s.locked}</NextAction>}
    </>
  );
}

/** SEE for a step, shown under the results once the step is done. */
export function StepStory({ step }: { step: StorySlug }) {
  const done = useStepDone(step);
  return <SeeCard see={STORY[step].see} unlocked={done} />;
}
