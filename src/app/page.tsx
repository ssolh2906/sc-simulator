import Link from "next/link";
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
      </div>

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
