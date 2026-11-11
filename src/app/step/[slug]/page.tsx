import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pager } from "@/components/layout/Pager";
import { StepHeader } from "@/components/layout/StepHeader";
import { STORY, type StorySlug } from "@/content/steps";
import { STEPS, stepBySlug } from "@/features/pipeline/registry";
import { STEP_COMPONENTS } from "@/features/pipeline/stepComponents";
import { StepTask } from "@/features/pipeline/steps/StepStory";

export const dynamicParams = false;

// QC walks the user through its own staged guide, so it skips the generic "do this now" box.
const OWN_GUIDE = new Set<string>(["qc"]);

export function generateStaticParams() {
  return STEPS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/step/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: stepBySlug(slug)?.title };
}

/** Layout: task (goal + next action) → step body (results) → folded code & paper inside the body. */
export default async function StepPage({ params }: PageProps<"/step/[slug]">) {
  const { slug } = await params;
  const meta = stepBySlug(slug);
  if (!meta) notFound();
  const Body = STEP_COMPONENTS[meta.slug];
  const hasStory = meta.slug in STORY;
  return (
    <>
      <StepHeader meta={meta} />
      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-3.5 sm:p-[18px]">
        {hasStory && <StepTask step={meta.slug as StorySlug} hint={!OWN_GUIDE.has(meta.slug)} />}
        <Body />
      </section>
      <Pager slug={meta.slug} />
    </>
  );
}
