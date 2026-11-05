import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { STEPS, stepHref } from "@/features/pipeline/registry";

export default function Home() {
  return (
    <main className="mx-auto max-w-[1180px]">
      <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted">Single-cell Lab</p>
      <h1 className="mt-1 max-w-3xl text-[clamp(28px,4.4vw,44px)] leading-[1.1] font-bold text-balance">
        Learn single-cell RNA-seq analysis by running it.
      </h1>
      <div className="mt-6 max-w-3xl border-l-[3px] border-accent py-1 pl-4">
        <p className="text-[clamp(17px,2.4vw,21px)] leading-snug font-semibold text-balance">
          How do immune cells in the blood of severe COVID-19 patients differ from healthy people?
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Chip>Wilk et al. · Nature Medicine · 2020</Chip>
          <Chip>PBMC</Chip>
          <Chip>Seq-Well scRNA-seq</Chip>
          <Chip>Synthetic data</Chip>
        </div>
      </div>

      <ul className="mt-6 grid max-w-3xl gap-2.5 text-[15px] sm:grid-cols-3">
        <li className="rounded-xl border border-line bg-surface p-3">
          <b className="block">Click to run</b>
          <span className="text-ink-2">Each step is one button or slider. Watch the result change.</span>
        </li>
        <li className="rounded-xl border border-line bg-surface p-3">
          <b className="block">Real code</b>
          <span className="text-ink-2">Every step shows the Seurat or Scanpy line that does it.</span>
        </li>
        <li className="rounded-xl border border-line bg-surface p-3">
          <b className="block">Paper used</b>
          <span className="text-ink-2">Compare the tutorial default with what the study actually did.</span>
        </li>
      </ul>

      <Link
        href={stepHref("question")}
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-semibold text-accent-ink hover:brightness-110"
      >
        Start the lab →
      </Link>

      <h2 className="mt-10 font-mono text-xs uppercase tracking-[0.08em] text-muted">The pipeline</h2>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.slug}>
            <Link
              href={stepHref(s.slug)}
              className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3 hover:border-accent"
            >
              <span className="grid size-7 flex-none place-items-center rounded-full border-2 border-line font-mono text-[11px] font-semibold text-muted">
                {i}
              </span>
              <span className="min-w-0">
                <b className="block leading-tight">{s.title}</b>
                <span className="text-[13px] text-ink-2">{s.subtitle}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
