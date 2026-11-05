import { Badge } from "@/components/ui/Badge";
import { LAST_STEP, stepIndex, type StepMeta } from "@/features/pipeline/registry";

export function StepHeader({ meta }: { meta: StepMeta }) {
  return (
    <header className="mb-3.5">
      <p className="font-mono text-xs uppercase tracking-[0.06em] text-accent">
        Step {stepIndex(meta.slug)} / {LAST_STEP}
      </p>
      <h1 className="mt-0.5 text-[clamp(24px,3.4vw,32px)] leading-tight font-bold text-balance">
        {meta.title} {meta.badge && <Badge kind={meta.badge} />}
      </h1>
      <p className="mt-0.5 text-ink-2">{meta.subtitle}</p>
    </header>
  );
}
