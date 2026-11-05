"use client";

import { StatusChip } from "@/components/ui/StatusChip";
import { getDataset } from "@/lib/sim/cells";
import { int } from "@/lib/format";
import { MAX_BAD_KEPT, MAX_REAL_LOST, PAPER_QC, qcFeedback, summarizeQc, type QcParams, type QcSummary } from "@/lib/sim/qc";
import { usePipeline } from "../../PipelineProvider";

const BAD_LABEL: Record<keyof QcSummary["keptBad"], string> = {
  broken: "broken",
  rrna: "rRNA-heavy",
  multiplet: "multiplets",
  empty: "near-empty",
};

const HEAD = "px-2 py-1 text-left font-medium text-muted";
const CELL = "px-2 py-1 tabular-nums";

function Row({ label, params }: { label: string; params: QcParams }) {
  const s = summarizeQc(getDataset().qcCells, params);
  const bad = Object.entries(s.keptBad).filter(([, n]) => n > 0) as [keyof QcSummary["keptBad"], number][];
  const badTotal = bad.reduce((sum, [, n]) => sum + n, 0);
  return (
    <tr className="border-t border-line">
      <th scope="row" className="px-2 py-1 text-left font-semibold whitespace-nowrap text-ink">
        {label}
      </th>
      <td className={CELL}>{int(s.kept)}</td>
      <td className={`${CELL} ${badTotal > MAX_BAD_KEPT ? "text-warn" : "text-good"}`}>
        {badTotal}
        {bad.length > 0 && (
          <span className="text-ink-2"> ({bad.map(([kind, n]) => `${n} ${BAD_LABEL[kind]}`).join(", ")})</span>
        )}
      </td>
      <td className={`${CELL} ${s.realLost > MAX_REAL_LOST ? "text-warn" : "text-good"}`}>{s.realLost}</td>
    </tr>
  );
}

/** The count follows the sliders; the table holds the results the user asked to see. */
export function QcResult() {
  const { qc, qcTried, qcPaperSeen } = usePipeline();
  const { qcCells } = getDataset();
  const s = summarizeQc(qcCells, qc);
  const feedback = qcTried && qcFeedback(qcCells, qcTried);
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-sm tabular-nums">
        {int(s.total)} → {int(s.kept)} cells
      </p>
      {(qcTried || qcPaperSeen) && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr>
                <td />
                <th scope="col" className={HEAD}>kept</th>
                <th scope="col" className={HEAD}>bad cells kept</th>
                <th scope="col" className={HEAD}>real cells lost</th>
              </tr>
            </thead>
            <tbody>
              {qcTried && <Row label="Your cutoffs" params={qcTried} />}
              {qcPaperSeen && <Row label="Paper" params={PAPER_QC} />}
            </tbody>
          </table>
        </div>
      )}
      {feedback && (
        <p aria-live="polite" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink">
          <StatusChip ok={feedback.verdict === "Good balance"}>{feedback.verdict}</StatusChip>
          {feedback.hint}
        </p>
      )}
    </div>
  );
}
