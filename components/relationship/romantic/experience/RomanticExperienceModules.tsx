"use client";

import { useCallback, useState, type ReactNode } from "react";
import {
  PsychMatchRadarChart,
  RelationshipReportBody,
  RelationshipReportCard,
  RelationshipReportInset,
  RelationshipReportLabel,
  RelationshipReportParagraph,
  RelationshipScoreBoard,
  getTabTheme,
  useReportTone,
  type ScoreMetric,
} from "@/components/relationship/reportLayout";
import RelationshipHeadlineBanner from "@/components/relationship/reportLayout/RelationshipHeadlineBanner";
import {
  DIFFERENCE_BUCKET_LABELS,
  ROMANTIC_V2_MODULE_TITLES,
  SNAPSHOT_SIGNAL_LABELS,
} from "@/lib/relationship/romantic/experience/romanticModuleCopy";
import type {
  ActionAdviceItemVM,
  ConfidenceLevel,
  RomanticExperienceViewModel,
} from "@/lib/relationship/romantic/experience/romanticExperienceTypes";
import { useMessages } from "@/lib/i18n/LocaleProvider";

const ACCENT = "#E2C4A8";
const ROMANTIC_THEME = getTabTheme("romantic");
const CARD_ANCHOR = "scroll-mt-6";

/** Sprint 3 — editorial context line above the three guidance modules. */
function ModuleEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary/80">
      {children}
    </p>
  );
}

/** Sprint 3 — subtle confidence tag, visible only when evidence is thin. */
function ConfidenceNote({ confidence }: { confidence: ConfidenceLevel }) {
  if (confidence !== "low" && confidence !== "tentative") return null;
  return (
    <p className="mb-3 inline-flex items-center rounded-full border border-outline-variant/30 bg-surface-container-low/70 px-2.5 py-0.5 text-[11px] font-medium text-on-surface-variant/80">
      잠정적인 해석이에요
    </p>
  );
}

type ModuleProps = {
  vm: RomanticExperienceViewModel;
};

export function RomanticHeroSection({ vm }: ModuleProps) {
  if (!vm.opening.available) return null;
  const { opening, meta } = vm;

  return (
    <RelationshipHeadlineBanner
      kindLabel="Premium · 연인 관계"
      theme={ROMANTIC_THEME}
      variant="editorial"
      headline={{
        names: [meta.myName, meta.partnerName],
        title: opening.signature ?? "우리 관계",
        subtitle: opening.paradox ?? undefined,
      }}
    />
  );
}

/**
 * Sprint 5 — 30-second Premium Overview. Reuses RelationshipScoreBoard
 * unmodified; only maps raw event_scores numbers to labeled ScoreMetric
 * objects (label lookup needs useMessages(), which a plain projector cannot
 * call — same split already used for Horizon).
 * Preserves the gauges' original meaning: activation/benefit/risk, exactly
 * as legacy's extractRomanticScores computed them (same emoji, same
 * higher_worse polarity on risk).
 */
function useRomanticScoreMetrics(
  eventScores: { activation: number; benefit: number; risk: number } | null,
): ScoreMetric[] {
  const t = useMessages().relationshipDrilldown.romantic;
  if (!eventScores) return [];
  return [
    { emoji: "🔥", label: t.scoreLabelAffinity, value: eventScores.activation, polarity: "higher_better" },
    { emoji: "🧩", label: t.scoreLabelChemistry, value: eventScores.benefit, polarity: "higher_better" },
    { emoji: "⚡", label: t.scoreLabelSensitivity, value: eventScores.risk, polarity: "higher_worse" },
  ];
}

/**
 * Sprint 6 — first-screen content re-selected per the Product Bible / Romantic
 * Blueprint's M2 "Relationship Snapshot" (defining dynamic / stabilizing
 * resource / meaningful tension), not legacy's rule-screen-plan narrative
 * panel — that pipeline is not guaranteed to run for pure-V2 reports, and its
 * copy predates the current Blueprint vocabulary. The gauge stays
 * event_scores-driven (still the only deterministic numeric triplet
 * available; no new scoring invented). Reuses vm.snapshot, already computed
 * since Sprint 1 and previously orphaned by the Snapshot→Flow merge.
 */
export function RomanticPremiumOverviewSection({ vm }: ModuleProps) {
  const { premiumOverview, snapshot } = vm;
  const scores = useRomanticScoreMetrics(premiumOverview.eventScores);
  if (!premiumOverview.available || scores.length === 0) return null;

  return (
    <div id="romantic-premium-overview" className={CARD_ANCHOR}>
      <ConfidenceNote confidence={premiumOverview.confidence} />
      <RelationshipScoreBoard
        scores={scores}
        theme={ROMANTIC_THEME}
        showTriScoreInsight
      />
      {snapshot.available && snapshot.signals.length > 0 ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-1">
          {snapshot.signals.map((signal) => (
            <li key={signal.kind}>
              <RelationshipReportInset>
                <RelationshipReportLabel>
                  {SNAPSHOT_SIGNAL_LABELS[signal.kind] ?? signal.label}
                </RelationshipReportLabel>
                <p className="mt-1.5 text-[15px] leading-relaxed text-on-surface">
                  {signal.summary}
                </p>
              </RelationshipReportInset>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Radar Reading Aid — shared 11-axis comparison, radar form. Reuses
 * PsychMatchRadarChart (components/relationship/reportLayout — already
 * shared cross-domain, already used by Family/Friend/Marriage/Work and by
 * legacy Romantic) bound to meta.psych_match. Deliberately reads only
 * axisComparison.axisResults — the chart's own built-in "biggest gaps" list
 * (translated straight from the axis data it's already showing) is the
 * entire reading aid. It must never reach into Difference Map, Relationship
 * Dynamics, Frames, or Hidden Heart: those sections own their own reveal —
 * see docs/dev/decisions (Romantic architecture review) for why a prior
 * version of this section leaked their content here, ahead of the reader
 * reaching them. Romantic-specific framing is only the intro line and card
 * title; the chart itself owns no domain logic.
 */
export function RomanticAxisComparisonSection({ vm }: ModuleProps) {
  const messages = useMessages();
  const layoutT = messages.relationshipDrilldown.layout;
  const romanticT = messages.relationshipDrilldown.romantic;
  const { axisComparison, meta } = vm;
  if (!axisComparison.available) return null;

  return (
    <RelationshipReportCard
      id="romantic-axis-comparison"
      title={layoutT.psychMatchCardTitle}
      accentColor={ACCENT}
      className={CARD_ANCHOR}
    >
      <RelationshipReportBody>
        <RelationshipReportParagraph muted>
          {romanticT.psychMatchIntro}
        </RelationshipReportParagraph>
        <ConfidenceNote confidence={axisComparison.confidence} />
        <div className="rounded-2xl border border-white/10 bg-[#f8f6f3] p-3 sm:p-4">
          <PsychMatchRadarChart
            axisResults={axisComparison.axisResults}
            personALabel={meta.myName}
            personBLabel={meta.partnerName}
          />
        </div>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

/**
 * Sprint 2 — full-width editorial chapter shell (no RelationshipReportCard
 * wrapper, tinted background, generous whitespace). Used for prose-heavy
 * chapters only (Essence, Hidden Heart, Special Dynamics); structured/list
 * modules keep RelationshipReportCard.
 */
function EditorialChapter({
  id,
  eyebrow,
  tint = true,
  children,
}: {
  id?: string;
  eyebrow: string;
  tint?: boolean;
  children: ReactNode;
}) {
  const tone = useReportTone();
  return (
    <section
      id={id}
      className={[
        "rounded-[28px] px-6 py-10 sm:px-12 sm:py-14",
        CARD_ANCHOR,
        tint ? (tone.surface === "stitch" ? "bg-secondary/6" : "bg-white/[0.04]") : "",
      ].join(" ")}
    >
      <p
        className={[
          "mb-7 text-center text-xs font-semibold uppercase tracking-[0.3em]",
          tone.muted,
        ].join(" ")}
      >
        {eyebrow}
      </p>
      {children}
    </section>
  );
}

function EssencePersonBlock({
  person,
}: {
  person: { name: string; imageMetaphor: string | null; narrative: string | null };
}) {
  return (
    <div className="space-y-2.5 text-center sm:text-left">
      <p className="text-base font-semibold text-primary">{person.name}</p>
      {person.imageMetaphor ? (
        <p className="text-sm text-secondary">{person.imageMetaphor}</p>
      ) : null}
      {person.narrative ? (
        <p className="text-[15px] leading-relaxed text-on-surface">{person.narrative}</p>
      ) : null}
    </div>
  );
}

export function RomanticEssenceSection({ vm }: ModuleProps) {
  if (!vm.essence.available) return null;
  const { essence } = vm;

  return (
    <EditorialChapter id="romantic-essence" eyebrow={ROMANTIC_V2_MODULE_TITLES.essence}>
      <div className="space-y-9 sm:space-y-10">
        <ConfidenceNote confidence={essence.confidence} />
        {essence.me ? <EssencePersonBlock person={essence.me} /> : null}
        {essence.partner ? <EssencePersonBlock person={essence.partner} /> : null}
      </div>
    </EditorialChapter>
  );
}

/**
 * Presentation-only helpers for the merged Snapshot→Flow narrative. Do not
 * touch projector output shape/logic — these only reshape already-projected
 * strings for display.
 */
const FLOW_SIGNAL_PREFIX_RE = /^.{0,14}신호\s*[:：]\s*/u;

function stripFlowSignalPrefix(text: string): string {
  return text.replace(FLOW_SIGNAL_PREFIX_RE, "").trim();
}

const FLOW_CONNECTORS = ["", "그 흐름 속에서, ", "동시에, ", "그리고 여기서, "];

function buildFlowNarrative(vm: RomanticExperienceViewModel): string[] {
  const paragraphs: string[] = [];
  if (vm.snapshot.available) {
    const lead =
      vm.snapshot.signals.find((s) => s.kind === "defining_dynamic")?.summary ??
      vm.snapshot.signals[0]?.summary ??
      null;
    if (lead) paragraphs.push(lead);
  }
  vm.flow.nodes
    .map((node) => stripFlowSignalPrefix(node.body ?? ""))
    .filter(Boolean)
    .forEach((beat, idx) => {
      paragraphs.push(`${FLOW_CONNECTORS[idx % FLOW_CONNECTORS.length]}${beat}`);
    });
  return paragraphs;
}

/**
 * M2 Snapshot has no dedicated card in the render order — its signals are
 * owned by Premium Overview (first-screen list) and Relationship Flow (lead
 * paragraph). Kept only as computed VM data; do not add a standalone card
 * here without removing it from those two consumers first (see Romantic
 * architecture review — duplicated-ownership finding).
 */

function DifferenceItemRow({
  item,
}: {
  item: { aspect: string; me: string; partner: string };
}) {
  return (
    <li className="rounded-xl border border-outline-variant/20 px-3.5 py-3 text-sm leading-relaxed">
      <span className="font-medium text-primary">{item.aspect}</span>
      <div className="mt-1.5 grid gap-1 text-on-surface-variant sm:grid-cols-2">
        <span>나: {item.me}</span>
        <span>상대: {item.partner}</span>
      </div>
    </li>
  );
}

export function RomanticDifferenceMapSection({ vm }: ModuleProps) {
  if (!vm.differenceMap.available) return null;
  const { differenceMap } = vm;
  const allItems = differenceMap.buckets.flatMap((bucket) => bucket.items);
  const topItems = allItems.slice(0, 3);
  const hasMore = allItems.length > topItems.length;

  return (
    <RelationshipReportCard
      id="romantic-m3-difference"
      title={ROMANTIC_V2_MODULE_TITLES.differenceMap}
      accentColor={ACCENT}
      className={CARD_ANCHOR}
    >
      <RelationshipReportBody>
        <ConfidenceNote confidence={differenceMap.confidence} />
        {differenceMap.openingContrast ? (
          <RelationshipReportParagraph>
            {differenceMap.openingContrast}
          </RelationshipReportParagraph>
        ) : null}
        {differenceMap.dynamicsNarrative?.balance ? (
          <RelationshipReportParagraph muted>
            {differenceMap.dynamicsNarrative.balance}
          </RelationshipReportParagraph>
        ) : null}
        {differenceMap.dynamicsNarrative?.recovery ? (
          <RelationshipReportParagraph muted>
            {differenceMap.dynamicsNarrative.recovery}
          </RelationshipReportParagraph>
        ) : null}
        <ul className="space-y-2">
          {topItems.map((item) => (
            <DifferenceItemRow key={item.aspect} item={item} />
          ))}
        </ul>
        {hasMore ? (
          <details className="mt-1">
            <summary className="cursor-pointer text-sm font-medium text-secondary">
              전체 비교 더 보기
            </summary>
            <div className="mt-3 space-y-5">
              {differenceMap.buckets.map((bucket) => (
                <section key={bucket.kind} className="space-y-2.5">
                  <p className="text-sm font-semibold text-primary">
                    {DIFFERENCE_BUCKET_LABELS[bucket.kind] ?? bucket.label}
                  </p>
                  <ul className="space-y-2">
                    {bucket.items.map((item) => (
                      <DifferenceItemRow
                        key={`${bucket.kind}-${item.aspect}`}
                        item={item}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </details>
        ) : null}
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

export function RomanticFlowSection({ vm }: ModuleProps) {
  if (!vm.flow.available) return null;
  const { flow } = vm;
  const narrative = buildFlowNarrative(vm);

  return (
    <RelationshipReportCard
      id="romantic-m4-flow"
      title={ROMANTIC_V2_MODULE_TITLES.flow}
      accentColor={ACCENT}
      className={CARD_ANCHOR}
    >
      <RelationshipReportBody>
        <ConfidenceNote confidence={flow.confidence} />
        {flow.signalChips.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {flow.signalChips.map((chip) => (
              <span
                key={chip.key}
                className="rounded-full border border-outline-variant/30 bg-surface-container-high/50 px-2.5 py-1 text-xs font-medium text-on-surface-variant"
              >
                {chip.label}
              </span>
            ))}
          </div>
        ) : null}
        <div className="space-y-3">
          {narrative.map((paragraph, idx) => (
            <p key={idx} className="text-[15px] leading-relaxed text-on-surface">
              {paragraph}
            </p>
          ))}
        </div>
        {flow.interrupt ? (
          <RelationshipReportInset className="mt-1 border-secondary/25 bg-secondary/5">
            <p className="text-sm leading-relaxed text-on-surface">
              <span className="font-semibold text-secondary">끊기는 지점 · </span>
              {flow.interrupt.label}
            </p>
          </RelationshipReportInset>
        ) : null}
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

export function RomanticHiddenHeartSection({ vm }: ModuleProps) {
  if (!vm.hiddenHeart.available) return null;
  const { hiddenHeart } = vm;

  function personText(
    person: NonNullable<typeof hiddenHeart.me>,
  ): string {
    return person.voice ?? person.need ?? person.reason ?? "";
  }

  return (
    <EditorialChapter id="romantic-m5-hidden" eyebrow={ROMANTIC_V2_MODULE_TITLES.hiddenHeart}>
      <div className="space-y-8 sm:space-y-9">
        <ConfidenceNote confidence={hiddenHeart.confidence} />
        {hiddenHeart.me ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-primary">{hiddenHeart.me.name}</p>
            <p className="text-[15px] leading-relaxed italic text-on-surface">
              {personText(hiddenHeart.me)}
            </p>
          </div>
        ) : null}
        {hiddenHeart.partner ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-primary">{hiddenHeart.partner.name}</p>
            <p className="text-[15px] leading-relaxed italic text-on-surface">
              {personText(hiddenHeart.partner)}
            </p>
          </div>
        ) : null}
        {hiddenHeart.mutualGift ? (
          <p className="text-center text-sm leading-relaxed text-on-surface-variant">
            {hiddenHeart.mutualGift}
          </p>
        ) : null}
      </div>
    </EditorialChapter>
  );
}

/**
 * Sprint 4 — strict visible-content check for Special Dynamics.
 * `available` alone is insufficient: the projector can flag availability
 * from frameDirectionLabel (an internal canonical direction value) even
 * when nothing else qualifies, but this component never renders that
 * label — so a heading + confidence note alone must not count as content.
 */
export function hasSpecialContent(vm: RomanticExperienceViewModel): boolean {
  const s = vm.specialDynamics;
  if (!s.available) return false;
  return Boolean(
    s.gifts.length > 0 ||
      s.onlyTogether ||
      s.framesNarrative?.reassurance ||
      s.framesNarrative?.rolePlay ||
      s.whySpecial,
  );
}

export function RomanticSpecialSection({ vm }: ModuleProps) {
  if (!hasSpecialContent(vm)) return null;
  const { specialDynamics } = vm;

  return (
    <EditorialChapter id="romantic-m6-special" eyebrow={ROMANTIC_V2_MODULE_TITLES.specialDynamics}>
      <div className="space-y-6">
        <ConfidenceNote confidence={specialDynamics.confidence} />
        {specialDynamics.gifts.map((gift, idx) => (
          <div key={`${gift.from}-${gift.to}-${idx}`} className="space-y-1.5">
            <p className="text-sm font-semibold text-primary">
              {gift.from} → {gift.to}
            </p>
            {gift.body ? (
              <p className="text-[15px] leading-relaxed">{gift.body}</p>
            ) : null}
          </div>
        ))}
        {specialDynamics.onlyTogether ? (
          <p className="text-[15px] leading-relaxed">{specialDynamics.onlyTogether}</p>
        ) : null}
        {specialDynamics.framesNarrative?.reassurance ? (
          <p className="text-[15px] leading-relaxed text-on-surface-variant">
            {specialDynamics.framesNarrative.reassurance}
          </p>
        ) : null}
        {specialDynamics.framesNarrative?.rolePlay ? (
          <p className="text-[15px] leading-relaxed text-on-surface-variant">
            {specialDynamics.framesNarrative.rolePlay}
          </p>
        ) : null}
        {specialDynamics.whySpecial ? (
          <p className="text-[15px] leading-relaxed text-on-surface-variant">
            {specialDynamics.whySpecial}
          </p>
        ) : null}
      </div>
    </EditorialChapter>
  );
}

export function RomanticConflictSection({ vm }: ModuleProps) {
  if (!vm.conflictTranslation.available) return null;
  const { conflictTranslation } = vm;

  return (
    <RelationshipReportCard
      id="romantic-m7-conflict"
      title={ROMANTIC_V2_MODULE_TITLES.conflictTranslation}
      accentColor={ACCENT}
      className={CARD_ANCHOR}
    >
      <RelationshipReportBody>
        <ConfidenceNote confidence={conflictTranslation.confidence} />
        {conflictTranslation.situationTitle ? (
          <RelationshipReportParagraph className="font-medium">
            {conflictTranslation.situationTitle}
          </RelationshipReportParagraph>
        ) : null}
        <div className="space-y-4">
          {conflictTranslation.rows.map((row, idx) => (
            <div
              key={`${row.speakerLabel}-${idx}`}
              className="overflow-hidden rounded-xl border border-outline-variant/25 bg-white"
            >
              <div className="border-b border-outline-variant/20 bg-surface-container-low px-3.5 py-2 text-sm font-semibold text-primary">
                {row.speakerLabel}
              </div>
              <div className="space-y-2.5 px-3.5 py-3.5">
                {row.said ? (
                  <p>
                    <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant/70">
                      말하기 전
                    </span>
                    <span className="text-sm leading-relaxed text-on-surface-variant line-through decoration-[rgba(140,74,92,0.35)]">
                      {row.said}
                    </span>
                  </p>
                ) : null}
                {row.better ? (
                  <p>
                    <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#3F8477]/80">
                      → 이렇게
                    </span>
                    <span className="text-[15px] font-medium leading-relaxed text-[#3F8477]">
                      {row.better}
                    </span>
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

export function RomanticRepairSection({ vm }: ModuleProps) {
  if (!vm.repairGuide.available) return null;

  return (
    <RelationshipReportCard
      id="romantic-m8-repair"
      title={ROMANTIC_V2_MODULE_TITLES.repairGuide}
      accentColor={ACCENT}
      className={CARD_ANCHOR}
    >
      <RelationshipReportBody>
        <ModuleEyebrow>지금 이 순간</ModuleEyebrow>
        <ConfidenceNote confidence={vm.repairGuide.confidence} />
        <ol className="space-y-4">
          {vm.repairGuide.stages.map((stage, idx) => (
            <li key={stage.id} className="flex gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-sm font-bold text-secondary"
                aria-hidden
              >
                {idx + 1}
              </span>
              <div>
                <p className="font-medium text-primary">{stage.title}</p>
                <p className="mt-1 text-[15px] leading-relaxed">{stage.body}</p>
                {stage.speakable ? (
                  <p className="mt-1.5 text-sm italic text-on-surface-variant">
                    “{stage.speakable}”
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function DoDontChecklist({
  variant,
  title,
  items,
}: {
  variant: "do" | "dont";
  title: string;
  items: string[];
}) {
  const isDo = variant === "do";
  return (
    <div
      className={[
        "rounded-xl border p-3.5",
        isDo
          ? "border-emerald-400/30 bg-emerald-50/60"
          : "border-rose-400/30 bg-rose-50/50",
      ].join(" ")}
    >
      <p
        className={[
          "text-sm font-bold",
          isDo ? "text-emerald-800" : "text-rose-800",
        ].join(" ")}
      >
        {title}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((item, idx) => (
          <li key={`${variant}-${idx}`} className="flex gap-2 text-sm leading-relaxed">
            <span aria-hidden className="shrink-0 font-bold">
              {isDo ? "✓" : "✕"}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RomanticDoDontSection({ vm }: ModuleProps) {
  if (!vm.doDont.available || !vm.doDont.pack) return null;
  const { pack } = vm.doDont;

  return (
    <RelationshipReportCard
      id="romantic-m9-dodont"
      title={ROMANTIC_V2_MODULE_TITLES.doDont}
      accentColor={ACCENT}
      className={CARD_ANCHOR}
    >
      <RelationshipReportBody>
        <ModuleEyebrow>평소에</ModuleEyebrow>
        <ConfidenceNote confidence={vm.doDont.confidence} />
        {pack.intro_line ? (
          <RelationshipReportParagraph muted>{pack.intro_line}</RelationshipReportParagraph>
        ) : null}
        <div className="space-y-4">
          {pack.items.map((item) => (
            <section key={item.topic} className="space-y-3">
              <p className="text-base font-semibold text-primary">{item.headline}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <DoDontChecklist variant="do" title="도움이 되는 것" items={item.do_list} />
                <DoDontChecklist variant="dont" title="피할 것" items={item.dont_list} />
              </div>
            </section>
          ))}
        </div>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function ActionAdviceList({
  title,
  items,
}: {
  title: string;
  items: ActionAdviceItemVM[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      <RelationshipReportLabel>{title}</RelationshipReportLabel>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li
            key={`${item.title}-${idx}`}
            className="rounded-xl border border-outline-variant/20 px-3.5 py-3"
          >
            {item.title ? (
              <p className="text-sm font-semibold text-primary">{item.title}</p>
            ) : null}
            {item.reason ? (
              <p className="mt-1 text-[15px] leading-relaxed text-on-surface-variant">
                {item.reason}
              </p>
            ) : null}
            {item.speechTip ? (
              <p className="mt-1.5 text-sm italic text-on-surface-variant">
                “{item.speechTip}”
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RomanticActionAdviceSection({ vm }: ModuleProps) {
  if (!vm.actionAdvice.available) return null;
  const { actionAdvice, meta } = vm;

  return (
    <RelationshipReportCard
      id="romantic-action-advice"
      title={ROMANTIC_V2_MODULE_TITLES.actionAdvice}
      accentColor={ACCENT}
      className={CARD_ANCHOR}
    >
      <RelationshipReportBody>
        <ModuleEyebrow>앞으로</ModuleEyebrow>
        <ConfidenceNote confidence={actionAdvice.confidence} />
        <ActionAdviceList title={meta.myName} items={actionAdvice.me} />
        <ActionAdviceList title={meta.partnerName} items={actionAdvice.partner} />
        {actionAdvice.together ? (
          <div className="space-y-2 border-t border-outline-variant/30 pt-5">
            <RelationshipReportLabel>함께 해볼 것</RelationshipReportLabel>
            <p className="text-[15px] leading-relaxed">{actionAdvice.together}</p>
            {actionAdvice.togetherStarter ? (
              <p className="text-sm leading-relaxed text-on-surface-variant">
                “{actionAdvice.togetherStarter}”
              </p>
            ) : null}
          </div>
        ) : null}
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

/**
 * M10 Next Step has no dedicated card — Do/Don't is the single owner of
 * "what to do this week" (its checklist already includes this exact first
 * action). Kept only as computed VM data; do not add a standalone card here
 * without first removing the duplicate text from Do/Don't (see Romantic
 * architecture review — duplicated-ownership finding).
 */

export function RomanticHorizonSection({ vm }: ModuleProps) {
  const t = useMessages().relationshipDrilldown.romantic;
  if (!vm.horizon.available) return null;

  return (
    <RelationshipReportCard
      id="romantic-m11-horizon"
      title={ROMANTIC_V2_MODULE_TITLES.horizon}
      accentColor={ACCENT}
      className={CARD_ANCHOR}
    >
      <RelationshipReportBody>
        <ConfidenceNote confidence={vm.horizon.confidence} />
        <p className="text-sm text-on-surface-variant">{t.timelineCardTitle}</p>
        <div className="-mx-1 mt-3 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-px-4">
          {vm.horizon.waypoints.map((waypoint, idx) => (
            <article
              key={`${waypoint.period}-${idx}`}
              className="min-w-[min(85vw,240px)] shrink-0 snap-start rounded-xl border border-outline-variant/25 bg-surface-container-low/70 p-4"
            >
              <p className="text-sm font-semibold text-secondary">{waypoint.period}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-on-surface">
                {waypoint.body}
              </p>
              {waypoint.sub ? (
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  {waypoint.sub}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

/**
 * M12 Reflection — reads vm.reflection directly (single source of truth;
 * no parallel component-level computation). realization is sourced from
 * Repair Guide's interrupt point, not Opening or Do/Don't, so it never
 * restates text already shown earlier in the page. Do/Don't remains the
 * sole owner of "what to do this week" — Reflection does not echo it.
 */
export function RomanticReflectionSection({ vm }: ModuleProps) {
  const { reflection } = vm;
  if (!reflection.available || !reflection.realization) return null;

  return (
    <section
      id="romantic-m12-reflection"
      className={["mx-auto max-w-lg space-y-6 px-4 py-10 text-center", CARD_ANCHOR].join(" ")}
    >
      <p className="font-serif text-xl font-medium leading-relaxed text-primary sm:text-2xl">
        {reflection.realization}
      </p>
      {reflection.prompt ? (
        <p className="font-serif text-base italic leading-relaxed text-on-surface-variant">
          {reflection.prompt}
        </p>
      ) : null}
    </section>
  );
}

export function RomanticSaveShareSection({ vm }: ModuleProps) {
  const tone = useReportTone();
  const [copied, setCopied] = useState(false);
  const { saveShare } = vm;
  if (!saveShare.available || !saveShare.signatureLine) return null;

  const handleCopy = useCallback(async () => {
    const text = [
      saveShare.signatureLine,
      ...saveShare.insightLines,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [saveShare.insightLines, saveShare.signatureLine]);

  return (
    <RelationshipReportCard
      id="romantic-m12-save"
      title={ROMANTIC_V2_MODULE_TITLES.saveShare}
      accentColor={ACCENT}
      className={CARD_ANCHOR}
    >
      <RelationshipReportBody>
        <div
          className="rounded-2xl px-5 py-5"
          style={{
            background:
              "radial-gradient(130% 100% at 20% 100%, rgba(58,42,42,0.08) 0%, rgba(34,31,43,0.04) 55%)",
          }}
        >
          <p className={tone.label}>Relationship Signature</p>
          <p className="mt-3 text-lg font-semibold leading-snug text-primary">
            {saveShare.signatureLine}
          </p>
          {saveShare.insightLines.map((line, idx) => (
            <p key={idx} className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              {line}
            </p>
          ))}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="mt-3 w-full rounded-xl border border-outline-variant/35 bg-surface-container-high/60 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-surface-container-high"
        >
          {copied ? "복사했어요" : "한 줄 요약 복사하기"}
        </button>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}
