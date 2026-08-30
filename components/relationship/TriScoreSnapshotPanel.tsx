"use client";

import type { SnapshotTopicNarrative } from "@/lib/relationship/romanticSnapshot/buildSnapshotNarrative";
import type { TriScoreSnapshotPanel } from "@/lib/relationship/triScoreSnapshot/types";
import {
  getTriScoreKindConfig,
  type TriScoreLegendItem,
  type TriScoreSnapshotKind,
} from "@/lib/relationship/triScoreSnapshot/kinds";
import { resolveScoreBarAppearance } from "@/lib/relationship/scoreBarAppearance";
import { useReportTone } from "@/components/relationship/reportLayout/ReportSurface";
import RelationshipScoreDefinitions from "@/components/relationship/reportLayout/RelationshipScoreDefinitions";
import { useLocale } from "@/lib/i18n/LocaleProvider";

function legendGlance(item: TriScoreLegendItem): string {
  if (item.glance?.trim()) return item.glance.trim();
  const head = item.meaning.split(/[·.]/)[0]?.trim();
  return head || item.meaning;
}

function ScoreKeyStrip({
  items,
}: {
  items: readonly TriScoreLegendItem[];
}) {
  const tone = useReportTone();
  const stitch = tone.surface === "stitch";
  const wrapClass = stitch
    ? "border-outline-variant/30 bg-surface-container-low/50"
    : "border-white/10 bg-black/20";
  const labelClass = stitch ? "text-primary" : "text-white/88";
  const glanceClass = stitch
    ? "text-on-surface-variant"
    : "text-white/55";

  return (
    <ul
      className={`grid gap-2 rounded-xl border px-3 py-2.5 sm:grid-cols-3 ${wrapClass}`}
      aria-label="Score key"
    >
      {items.map((item) => (
        <li key={item.label} className="min-w-0">
          <p className={`text-[12px] font-semibold tracking-tight ${labelClass}`}>
            {item.emoji} {item.label}
          </p>
          <p className={`mt-0.5 text-[10px] leading-snug ${glanceClass}`}>
            {legendGlance(item)}
          </p>
        </li>
      ))}
    </ul>
  );
}

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
  const { locale } = useLocale();
  const stitch = reportTone.surface === "stitch";
  const pct = Math.max(0, Math.min(100, value));
  const appearance = resolveScoreBarAppearance(pct, polarity, locale);
  const labelClass = stitch ? "text-on-surface-variant" : "text-[var(--space-text)]";
  const valueClass = stitch ? "text-primary" : "text-[var(--space-text)]";
  const trackClass = stitch ? "bg-outline-variant/25" : "bg-white/8";
  const hintClass = stitch
    ? "text-on-surface-variant/75"
    : "text-[var(--space-text-muted)]";

  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className={`w-[4.5rem] shrink-0 font-medium ${labelClass}`}>
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
      <span className={`w-12 shrink-0 text-[10px] ${hintClass}`}>
        {appearance.hint}
      </span>
    </div>
  );
}

export function TopicCard({
  topic,
  kind,
  singlePrimaryMetric,
}: {
  topic: SnapshotTopicNarrative;
  kind: TriScoreSnapshotKind;
  singlePrimaryMetric?: boolean;
}) {
  const tone = useReportTone();
  const { locale } = useLocale();
  const labels = getTriScoreKindConfig(kind, locale).labels;

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
      <div className="mb-3 space-y-1.5">
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
      {topic.axisNote ? (
        <p className={`mt-2 text-xs leading-relaxed ${subtitleClass}`}>{topic.axisNote}</p>
      ) : null}
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
  const { locale } = useLocale();
  const config = getTriScoreKindConfig(kind, locale);
  const topics = panel.narrative?.topics ?? [];
  const singlePrimaryMetric = kind === "cohabitation";

  return (
    <div className="space-y-3">
      {!singlePrimaryMetric ? <ScoreKeyStrip items={config.legendItems} /> : null}
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
