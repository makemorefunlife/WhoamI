"use client";

import type { DialogueTableRow } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import type { ConflictSituation } from "./conflictSituationTypes";
import {
  normalizeDialogueRows,
  speakerLabel,
} from "./conflictSituationTypes";

const LINE_SOFT = "rgba(34,31,43,0.10)";
const CREAM_DEEP = "#E9E1D0";
const PLUM = "#8C4A5C";
const TEAL = "#3F8477";
const TERRA = "#C1663F";

export type ConflictTriggerBannerProps = {
  conflictSituation: ConflictSituation;
};

function SpeakerCard({ row }: { row: DialogueTableRow }) {
  return (
    <div
      className="flex min-w-0 flex-1 flex-col rounded-2xl border bg-white p-4"
      style={{ borderColor: LINE_SOFT }}
    >
      <p
        className="mb-3 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
        style={{ backgroundColor: CREAM_DEEP, color: "#221F2B" }}
      >
        {speakerLabel(row)}
        {row.emoji ? <span aria-hidden>{row.emoji}</span> : null}
      </p>
      {row.bad_line ? (
        <p
          className="text-xs leading-relaxed line-through decoration-[rgba(140,74,92,0.4)]"
          style={{ color: PLUM }}
        >
          {row.bad_line}
        </p>
      ) : null}
      {row.good_line ? (
        <p
          className="mt-2 text-[12.5px] font-semibold leading-relaxed"
          style={{ color: TEAL }}
        >
          {row.good_line}
        </p>
      ) : null}
    </div>
  );
}

export default function ConflictTriggerBanner({
  conflictSituation,
}: ConflictTriggerBannerProps) {
  const rows = normalizeDialogueRows(conflictSituation.dialogue_table);
  const title = conflictSituation.title?.trim();
  if (!title && rows.length === 0) return null;

  return (
    <div className="space-y-4">
      {title ? (
        <span
          className="inline-flex rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide text-white"
          style={{ backgroundColor: TERRA }}
        >
          {title}
        </span>
      ) : null}

      {rows.length > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          {rows.slice(0, 2).map((row, index) => (
            <SpeakerCard key={`${speakerLabel(row)}-${index}`} row={row} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
