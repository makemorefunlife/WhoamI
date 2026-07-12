"use client";

import type { ConflictSituation } from "./conflictSituationTypes";
import {
  normalizeDialogueRows,
  speakerLabel,
} from "./conflictSituationTypes";

/** 목업 script-table 토큰 */
const LINE_SOFT = "rgba(34,31,43,0.10)";
const CREAM_DEEP = "#E9E1D0";
const PLUM = "#8C4A5C";
const TEAL = "#3F8477";

export type ConflictScriptTableProps = {
  conflictSituation: ConflictSituation;
};

export default function ConflictScriptTable({
  conflictSituation,
}: ConflictScriptTableProps) {
  const rows = normalizeDialogueRows(conflictSituation.dialogue_table);
  if (!rows.length) return null;

  return (
    <div
      className="mt-5 overflow-hidden rounded-2xl border bg-white"
      style={{ borderColor: LINE_SOFT }}
    >
      {rows.map((row, index) => (
        <div
          key={`${speakerLabel(row)}-${index}`}
          className="grid grid-cols-[58px_1fr] border-t first:border-t-0"
          style={{ borderColor: LINE_SOFT }}
        >
          <div
            className="flex items-center justify-center px-1 py-2.5 text-center text-[11.5px] font-bold leading-snug text-primary"
            style={{ backgroundColor: CREAM_DEEP }}
          >
            <span>
              {speakerLabel(row)}
              {row.emoji ? ` ${row.emoji}` : ""}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 bg-white px-3 py-2.5">
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
                className="text-[12.5px] font-semibold leading-relaxed"
                style={{ color: TEAL }}
              >
                {row.good_line}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
