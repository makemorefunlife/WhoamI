"use client";

import { useId, useState } from "react";
import type { TriScoreSnapshotKind } from "@/lib/relationship/triScoreSnapshot/kinds";
import { getTriScoreKindConfig } from "@/lib/relationship/triScoreSnapshot/kinds";
import { useReportTone } from "./ReportSurface";
import { useMessages } from "@/lib/i18n/LocaleProvider";

export default function RelationshipScoreDefinitions({
  kind,
}: {
  kind: TriScoreSnapshotKind;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const tone = useReportTone();
  const t = useMessages().relationshipDrilldown.layout;
  const config = getTriScoreKindConfig(kind);
  const stitch = tone.surface === "stitch";
  const labelClass = stitch ? "text-on-surface-variant" : "text-white/55";
  const bodyClass = stitch
    ? "text-on-surface-variant/85"
    : "text-[var(--space-text-muted)]";
  const borderClass = stitch ? "border-outline-variant/30" : "border-white/8";

  return (
    <div
      className={`border-t pt-3 text-[10px] leading-relaxed ${bodyClass} ${borderClass}`}
    >
      <button
        type="button"
        className={`flex w-full items-center justify-between gap-2 text-left ${labelClass}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="font-medium">
          {open ? t.toggleOpenLabel : t.toggleClosedLabel}
        </span>
        <span className="shrink-0 text-[10px] opacity-70" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open ? (
        <ul id={panelId} className="mt-2 space-y-1">
          {config.legendItems.map((item) => (
            <li key={item.label}>
              <span className={stitch ? "text-on-surface-variant" : "text-white/60"}>
                {item.emoji} {item.label}
              </span>
              {" — "}
              {item.meaning}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
