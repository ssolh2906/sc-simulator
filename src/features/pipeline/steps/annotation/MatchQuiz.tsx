"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { TYPE_NAMES } from "@/lib/sim/annotation";

type Props = {
  ids: number[];
  answers: Record<number, string>;
  answerKey: Record<number, string>;
  onAnswer: (cluster: number, label: string) => void;
};

const OPTIONS = [...TYPE_NAMES].sort();

/** Pick a cell type for every cluster, then check. */
export function MatchQuiz({ ids, answers, answerKey, onAnswer }: Props) {
  const [checked, setChecked] = useState(false);
  const right = ids.filter((id) => answers[id] === answerKey[id]).length;
  const state = (id: number) => (!checked || !answers[id] ? "" : answers[id] === answerKey[id] ? "right" : "wrong");
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ids.map((id) => (
          <label key={id} className="flex min-w-0 flex-col gap-0.5 font-mono text-[11.5px] text-muted">
            cluster {id}
            <select
              value={answers[id] ?? ""}
              onChange={(e) => {
                setChecked(false);
                onAnswer(id, e.target.value);
              }}
              aria-invalid={state(id) === "wrong" || undefined}
              className={`w-full rounded-lg border bg-surface px-1.5 py-1 font-sans text-[13px] text-ink ${
                state(id) === "right" ? "border-good ring-1 ring-good" : state(id) === "wrong" ? "border-warn ring-1 ring-warn" : "border-line"
              }`}
            >
              <option value="">?</option>
              {OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={() => setChecked(true)}>
          Check labels
        </Button>
        {checked && <StatusChip ok={right === ids.length}>{right} / {ids.length} correct</StatusChip>}
      </div>
    </div>
  );
}
