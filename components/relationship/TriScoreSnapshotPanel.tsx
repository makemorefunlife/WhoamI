"use client";

import type { SnapshotTopicNarrative } from "@/lib/relationship/romanticSnapshot/buildSnapshotNarrative";
import type { TriScoreSnapshotPanel } from "@/lib/relationship/triScoreSnapshot/types";
import {
  getTriScoreKindConfig,
  type TriScoreSnapshotKind,
} from "@/lib/relationship/triScoreSnapshot/kinds";
import { resolveScoreBarAppearance } from "@/lib/relationship/scoreBarAppearance";
import { useReportTone } from "@/components/relationship/reportLayout/ReportSurface";
import RelationshipScoreDefinitions from "@/components/relationship/reportLayout/RelationshipScoreDefinitions";

function MiniScoreBar({
  label,
  value,
  polarity = "higher_better",
}: {
  label: string;
  value: number;
  polarity?: "higher_better" | "higher_worse";
}) {
  const reportTone = useReportTone();
  const stitch = reportTone.surface === "stitch";
  const pct = Math.max(0, Math.min(100, value));
  const appearance = resolveScoreBarAppearance(pct, polarity);
  const labelClass = stitch ? "text-on-surface-variant" : "text-[var(--space-text)]";
  const valueClass = stitch ? "text-primary" : "text-[var(--space-text)]";
  const trackClass = stitch ? "bg-outline-variant/25" : "bg-white/8";

  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className={`w-[3.25rem] shrink-0 font-medium ${labelClass}`}>
        {label}
      </span>
      <div className={`h-1.5 flex-1 overflow-hidden rounded-full ${trackClass}`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${appearance.barGradient}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-6 shrink-0 text-right tabular-nums ${valueClass}`}>
        {pct}
      </span>
    </div>
  );
}

function TopicCard({
  topic,
  kind,
  singlePrimaryMetric,
}: {
  topic: SnapshotTopicNarrative;
  kind: TriScoreSnapshotKind;
  singlePrimaryMetric?: boolean;
}) {
  const tone = useReportTone();
  const labels = getTriScoreKindConfig(kind).labels;
  const primary =
    topic.topic === "intimacy"
      ? { label: labels.activation.short, value: topic.activation }
      : topic.topic === "stability"
        ? { label: labels.benefit.short, value: topic.benefit }
        : { label: labels.risk.short, value: topic.risk };

  const cardClass =
    tone.surface === "stitch"
      ? topic.isWarning
        ? "border-amber-400/35 bg-amber-50/80"
        : "border-outline-variant/30 bg-surface-container-low/70"
      : topic.isWarning
        ? "border-amber-400/25 bg-amber-950/15"
        : "border-white/10 bg-black/15";
  const titleClass =
    tone.surface === "stitch" ? "text-primary" : "text-white/92";
  const subtitleClass =
    tone.surface === "stitch" ? "text-on-surface-variant" : "text-white/55";
  const bodyClass =
    tone.surface === "stitch" ? "text-on-surface" : "text-white/72";

  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${cardClass}`}>
      <p className={`mb-2 text-sm font-semibold ${titleClass}`}>{topic.title}</p>
      <p className={`mb-3 text-xs leading-relaxed ${subtitleClass}`}>
        {topic.subtitle}
      </p>
      <div className="mb-2 space-y-1.5">
        {singlePrimaryMetric ? (
          <MiniScoreBar
            label={primary.label}
            value={primary.value}
            polarity={topic.topic === "conflict" ? "higher_worse" : "higher_better"}
          />
        ) : (
          <>
            <MiniScoreBar
              label={labels.activation.short}
              value={topic.activation}
              polarity="higher_better"
            />
            <MiniScoreBar
              label={labels.benefit.short}
              value={topic.benefit}
              polarity="higher_better"
            />
            <MiniScoreBar
              label={labels.risk.short}
              value={topic.risk}
              polarity="higher_worse"
            />
          </>
        )}
      </div>
      <p className={`text-[15px] leading-[1.7] ${bodyClass}`}>
        {topic.interpretation}
      </p>
    </div>
  );
}

/** 관계 스냅샷 — 주제별 신호 3카드 + 하단 범례 (연인·동료 공통) */
export default function TriScoreSnapshotPanel({
  panel,
  kind,
}: {
  panel: TriScoreSnapshotPanel;
  kind: TriScoreSnapshotKind;
}) {
  const topics = panel.narrative?.topics ?? [];
  const singlePrimaryMetric = kind === "cohabitation";

  return (
    <div className="space-y-3">
      {topics.map((topic) => (
        <TopicCard
          key={topic.topic}
          topic={topic}
          kind={kind}
          singlePrimaryMetric={singlePrimaryMetric}
        />
      ))}
      {!singlePrimaryMetric ? <RelationshipScoreDefinitions kind={kind} /> : null}
    </div>
  );
}
