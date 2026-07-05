"use client";

import type { SnapshotTopicNarrative } from "@/lib/relationship/romanticSnapshot/buildSnapshotNarrative";
import type { TriScoreSnapshotPanel } from "@/lib/relationship/triScoreSnapshot/types";
import {
  getTriScoreKindConfig,
  type TriScoreSnapshotKind,
} from "@/lib/relationship/triScoreSnapshot/kinds";

function MiniScoreBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "warm" | "cool" | "alert";
}) {
  const pct = Math.max(0, Math.min(100, value));
  const barClass =
    tone === "alert"
      ? "from-amber-400/60 to-orange-400/70"
      : tone === "cool"
        ? "from-[#67b7ff]/70 to-[#67b7ff]/50"
        : "from-[#ffd6a5]/70 to-[#ff9f6b]/80";
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-[3.25rem] shrink-0 font-medium text-[var(--space-text)]">
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 shrink-0 text-right tabular-nums text-[var(--space-text)]">
        {pct}
      </span>
    </div>
  );
}

function ScoreLegend({
  kind,
}: {
  kind: TriScoreSnapshotKind;
}) {
  const config = getTriScoreKindConfig(kind);
  return (
    <div className="border-t border-white/8 pt-3 text-[10px] leading-relaxed text-[var(--space-text-muted)]">
      <p className="mb-1.5 font-medium text-[var(--space-text)]">
        점수가 의미하는 것
      </p>
      <ul className="space-y-1">
        {config.legendItems.map((item) => (
          <li key={item.label}>
            <span className="text-[var(--space-text)]">
              {item.emoji} {item.label}
            </span>
            {" — "}
            {item.meaning}
          </li>
        ))}
      </ul>
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
  const labels = getTriScoreKindConfig(kind).labels;
  const primary =
    topic.topic === "intimacy"
      ? { label: labels.activation.short, value: topic.activation }
      : topic.topic === "stability"
        ? { label: labels.benefit.short, value: topic.benefit }
        : { label: labels.risk.short, value: topic.risk };

  return (
    <div
      className={`rounded-lg border p-3 ${
        topic.isWarning
          ? "border-amber-400/25 bg-amber-950/15"
          : "border-white/8 bg-black/10"
      }`}
    >
      <p className="mb-2 text-xs font-semibold text-[var(--space-text)]">
        {topic.title}
      </p>
      <p className="mb-2 text-[10px] text-[var(--space-text-muted)]">
        {topic.subtitle}
      </p>
      <div className="mb-2 space-y-1.5">
        {singlePrimaryMetric ? (
          <MiniScoreBar
            label={primary.label}
            value={primary.value}
            tone={topic.topic === "conflict" ? "alert" : undefined}
          />
        ) : (
          <>
            <MiniScoreBar
              label={labels.activation.short}
              value={topic.activation}
            />
            <MiniScoreBar
              label={labels.benefit.short}
              value={topic.benefit}
              tone="cool"
            />
            <MiniScoreBar
              label={labels.risk.short}
              value={topic.risk}
              tone={topic.isWarning ? "alert" : undefined}
            />
          </>
        )}
      </div>
      <p className="text-[11px] leading-relaxed text-[var(--space-text-muted)]">
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
      {!singlePrimaryMetric ? <ScoreLegend kind={kind} /> : null}
    </div>
  );
}
