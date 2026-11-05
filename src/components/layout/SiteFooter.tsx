import { CITATION } from "@/content/paperFacts";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-10 max-w-[1180px] border-t border-line pt-4 text-[13px] text-ink-2">
      <p>
        Based on: {CITATION.authors} <i>{CITATION.title}</i> {CITATION.journal}{" "}
        <a href={CITATION.doi} target="_blank" rel="noopener noreferrer" className="text-accent underline">
          doi.org/10.1038/s41591-020-0944-y
        </a>
      </p>
      <p className="mt-1.5 text-muted">
        Educational simulation with synthetic data. Not affiliated with the authors or the publisher. Built with AI
        assistance.
      </p>
    </footer>
  );
}
