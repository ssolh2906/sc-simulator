import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pager } from "@/components/layout/Pager";
import { StepHeader } from "@/components/layout/StepHeader";
import { CodeLine } from "@/components/ui/CodeLine";
import { DoCard } from "@/components/ui/StoryCards";
import { STORY } from "@/content/steps";
import { STEPS, stepBySlug } from "@/features/pipeline/registry";
import { STEP_COMPONENTS } from "@/features/pipeline/stepComponents";

export const dynamicParams = false;

export function generateStaticParams() {
  return STEPS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/step/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: stepBySlug(slug)?.title };
}

export default async function StepPage({ params }: PageProps<"/step/[slug]">) {
  const { slug } = await params;
  const meta = stepBySlug(slug);
  if (!meta) notFound();
  const Body = STEP_COMPONENTS[meta.slug];
  const story = meta.slug in STORY ? STORY[meta.slug as keyof typeof STORY] : undefined;
  return (
    <>
      <StepHeader meta={meta} />
      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-3.5 sm:p-[18px]">
        {story && <DoCard>{story.do}</DoCard>}
        <CodeLine step={meta.slug} />
        <Body />
      </section>
      <Pager slug={meta.slug} />
    </>
  );
}
