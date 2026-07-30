"use client";

import React, { Fragment, useCallback, useState, type ReactNode } from "react";
import Image from "next/image";
import {
  PsychMatchRadarChart,
  RelationshipReportBody,
  RelationshipReportCard,
  RelationshipReportInset,
  RelationshipReportLabel,
  RelationshipReportParagraph,
  getTabTheme,
  useReportTone,
} from "@/components/relationship/reportLayout";
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
import { SECONDARY_AXIS_KEYS, type SecondaryAxisKey } from "@/lib/v2/survey/types";
import { useMessages } from "@/lib/i18n/LocaleProvider";

const ACCENT = "#E2C4A8";
const CARD_ANCHOR = "scroll-mt-6";

function resolveAxisLabel(
  axisKey: string,
  labels: Record<string, string>,
): string {
  if ((SECONDARY_AXIS_KEYS as readonly string[]).includes(axisKey)) {
    return labels[axisKey as SecondaryAxisKey] ?? axisKey;
  }
  return labels[axisKey] ?? axisKey;
}

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
    <section
      data-romantic-chapter="hero"
      className="relative flex flex-col items-center justify-center px-6 pb-12 pt-20 text-center sm:pb-16 sm:pt-24"
    >
      <div className="absolute inset-0 -z-10 bg-[#FAF9F6]" />

      <p className="mb-8 text-[11px] font-bold uppercase tracking-[0.3em] text-[#8C7A6B]">
        {meta.myName} & {meta.partnerName}
      </p>

      <h1 className="mb-6 whitespace-pre-wrap font-serif text-[32px] leading-snug text-[#2c3e35] sm:text-[40px]">
        {opening.signature ?? "우리의 관계"}
      </h1>

      {opening.paradox ? (
        <p className="max-w-md text-[15px] leading-relaxed text-[#5c544e] sm:text-base">
          {opening.paradox}
        </p>
      ) : null}
    </section>
  );
}

/**
 * Snapshot — orientation beats only (no gauges). Replaces score-led Premium Overview
 * on the default V2 journey.
 */
export function RomanticSnapshotSection({ vm }: ModuleProps) {
  const { snapshot } = vm;
  if (!snapshot.available || snapshot.signals.length === 0) return null;

  return (
    <section data-romantic-chapter="snapshot" className={`px-6 py-12 sm:py-16 ${CARD_ANCHOR}`}>
      <div className="mx-auto max-w-xl">
        <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#b58c67]">
          {ROMANTIC_V2_MODULE_TITLES.snapshot}
        </p>
        <h2 className="mb-10 text-center font-serif text-[26px] text-[#2c3e35] sm:text-[30px]">
          이미 아는 세 장면
        </h2>
        <ul className="space-y-4">
          {snapshot.signals.map((signal) => (
            <li key={signal.kind}>
              <div className="rounded-3xl border border-[#E2C4A8]/20 bg-white p-5 sm:p-6">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#8C7A6B]">
                  {SNAPSHOT_SIGNAL_LABELS[signal.kind] ?? signal.label}
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-[#2c3e35]">
                  {signal.summary}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Retired from default V2 mount — gauges violate assessment philosophy. Kept export for legacy callers. */
export function RomanticPremiumOverviewSection({ vm }: ModuleProps) {
  void vm;
  return null;
}

export function RomanticAxisComparisonSection({ vm }: ModuleProps) {
  const { axisComparison, meta } = vm;
  const messages = useMessages();
  const axisLabels = messages.relationshipDrilldown.layout.psychAxisLabels;
  if (!axisComparison.available) return null;

  return (
    <section
      data-romantic-chapter="axisComparison"
      className={`bg-[#FAF9F6] px-6 py-14 sm:py-16 ${CARD_ANCHOR}`}
    >
      <div className="mx-auto max-w-4xl">
        <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#b58c67]">
          참고 지표
        </p>
        <h2 className="mb-4 text-center font-serif text-[26px] text-[#2c3e35] sm:text-[30px]">
          성향 비교 보조 지도
        </h2>
        <p className="mb-10 text-center text-sm text-[#8C7A6B]">
          앞선 차이를 뒷받침하는 심리 축입니다. 점수는 관계의 등급이 아닙니다.
        </p>

        <div className="mb-6 flex items-center justify-center gap-6 text-[11px] font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#2c3e35]" />
            <span className="text-[#2c3e35]">{meta.myName}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#b58c67]" />
            <span className="text-[#b58c67]">{meta.partnerName}</span>
          </div>
        </div>

        <div className="mb-8 hidden rounded-3xl border border-[#E2C4A8]/20 bg-white p-8 shadow-sm sm:block">
          <PsychMatchRadarChart
            axisResults={axisComparison.axisResults}
            personALabel={meta.myName}
            personBLabel={meta.partnerName}
          />
        </div>

        <div className="space-y-6 rounded-3xl border border-[#E2C4A8]/20 bg-white p-6 shadow-sm sm:p-8">
          {axisComparison.axisResults.map((axis, i) => {
            const label = resolveAxisLabel(axis.axis_key, axisLabels);
            return (
              <div
                key={`${axis.axis_key}-${i}`}
                className="flex flex-col gap-4 border-b border-[#FAF9F6] pb-6 last:border-0 last:pb-0"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                    <span className="shrink-0 text-[#2c3e35]">{meta.myName}</span>
                    <span className="rounded-full bg-[#FAF9F6] px-3 py-1 text-center text-[#8C7A6B]">
                      {label}
                    </span>
                    <span className="shrink-0 text-[#b58c67]">{meta.partnerName}</span>
                  </div>
                  <div className="relative h-1.5 w-full rounded-full bg-[#E2C4A8]/20">
                    <div
                      className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#2c3e35] shadow"
                      style={{ left: `calc(${Math.min(100, Math.max(0, axis.score_a))}% - 6px)` }}
                    />
                    <div
                      className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#b58c67] shadow"
                      style={{ left: `calc(${Math.min(100, Math.max(0, axis.score_b))}% - 6px)` }}
                    />
                  </div>
                </div>
                <p className="rounded-xl bg-[#FAF9F6] p-4 text-[13px] leading-relaxed text-[#5c544e]">
                  {label}에서 두 사람의 경향 차이는 일상 선택과 태도에서 서로 다른 방식으로
                  나타날 수 있습니다. 어느 쪽이 더 옳다는 뜻이 아닙니다.
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
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
  chapterNumber,
  variant = "default",
  children,
}: {
  id?: string;
  eyebrow: string;
  chapterNumber?: string;
  variant?: "default" | "climax";
  children: ReactNode;
}) {
  const tone = useReportTone();
  let bgClass = "";
  if (variant === "default") {
    bgClass = tone.surface === "stitch" ? "bg-secondary/6" : "bg-white/[0.04]";
  } else if (variant === "climax") {
    bgClass = "bg-[#E2C4A8]/15 border border-[#E2C4A8]/20";
  }

  return (
    <section
      id={id}
      className={[
        "rounded-[28px] px-6 py-10 sm:px-12 sm:py-16",
        CARD_ANCHOR,
        bgClass,
      ].join(" ")}
    >
      <div className="mb-7 flex items-center justify-center gap-3">
        {chapterNumber && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary/10 text-[11px] font-bold text-secondary">
            {chapterNumber}
          </span>
        )}
        <p className={["text-xs font-semibold uppercase tracking-[0.3em]", tone.muted].join(" ")}>
          {eyebrow}
        </p>
      </div>
      {children}
    </section>
  );
}

export function RomanticEssenceSection({ vm }: ModuleProps) {
  if (!vm.essence.available) return null;
  const { me, partner } = vm.essence;

  return (
    <section className="pt-24 pb-8 px-6 bg-[#FAF9F6]">
      <div className="mx-auto max-w-4xl flex flex-col md:flex-row gap-12 md:gap-8 items-center md:items-start justify-center">
        {me && (
          <div className="flex-1 text-center md:text-right flex flex-col items-center md:items-end">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8C7A6B]">{me.name}</p>
            {me.imageMetaphor && (
              <h2 className="mb-4 font-serif text-[28px] text-[#2c3e35]">{me.imageMetaphor}</h2>
            )}
            {me.narrative && (
              <p className="max-w-xs text-[14px] leading-relaxed text-[#5c544e]">
                {me.narrative}
              </p>
            )}
          </div>
        )}
        
        <div className="w-px h-16 md:h-32 bg-[#E2C4A8]/40 hidden md:block mt-8"></div>
        <div className="h-px w-16 bg-[#E2C4A8]/40 block md:hidden"></div>

        {partner && (
          <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8C7A6B]">{partner.name}</p>
            {partner.imageMetaphor && (
              <h2 className="mb-4 font-serif text-[28px] text-[#2c3e35]">{partner.imageMetaphor}</h2>
            )}
            {partner.narrative && (
              <p className="max-w-xs text-[14px] leading-relaxed text-[#5c544e]">
                {partner.narrative}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
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

function buildFlowNarrative(vm: RomanticExperienceViewModel): string[] {
  return vm.flow.nodes
    .map((node) => stripFlowSignalPrefix(node.body ?? ""))
    .filter((text) => {
      if (!text) return false;
      // Hide internal/debug phrasing from user-facing Flow copy.
      if (/primary\s*vs|saju\s*frame|canonical|debug/i.test(text)) return false;
      return true;
    });
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
    <li className="space-y-4 rounded-3xl bg-surface-container-low p-6">
      <p className="text-center text-[13px] font-bold text-secondary">{item.aspect}</p>
      <div className="relative flex items-center justify-between gap-4">
        <div className="absolute left-1/2 top-1/2 -z-10 w-full -translate-x-1/2 -translate-y-1/2 border-t border-dashed border-outline-variant/50"></div>
        <div className="absolute left-1/2 top-1/2 -z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-outline-variant/30 bg-surface"></div>
        <div className="flex w-[48%] flex-col items-center space-y-2 text-center py-1">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">나</span>
          <span className="text-[13px] font-medium leading-tight text-on-surface">{item.me}</span>
        </div>
        <div className="flex w-[48%] flex-col items-center space-y-2 text-center py-1">
          <span className="rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-bold text-secondary">상대</span>
          <span className="text-[13px] font-medium leading-tight text-on-surface">{item.partner}</span>
        </div>
      </div>
    </li>
  );
}

export function RomanticDifferenceMapSection({ vm }: ModuleProps) {
  if (!vm.differenceMap.available) return null;
  const { differenceMap, meta } = vm;
  const allItems = differenceMap.buckets.flatMap((bucket) =>
    bucket.items.map((item) => ({ ...item, bucketKind: bucket.kind, bucketLabel: bucket.label })),
  );
  const topItems = allItems.slice(0, 4);

  return (
    <section
      data-romantic-chapter="differenceMap"
      className={`bg-[#FAF9F6] px-6 py-14 sm:py-16 ${CARD_ANCHOR}`}
    >
      <div className="mx-auto max-w-2xl">
        <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#b58c67]">
          {ROMANTIC_V2_MODULE_TITLES.differenceMap}
        </p>
        <h2 className="mb-4 text-center font-serif text-[26px] text-[#2c3e35] sm:text-[30px]">
          우리가 만나고 어긋나는 지점
        </h2>

        {differenceMap.openingContrast ? (
          <p className="mb-12 text-center text-base leading-relaxed text-[#5c544e]">
            {differenceMap.openingContrast}
          </p>
        ) : (
          <p className="mb-12 text-center text-base leading-relaxed text-[#5c544e]">
            서로의 작은 차이가 오해를 만들기도 합니다.
          </p>
        )}

        <div className="space-y-8">
          {topItems.map((item, idx) => (
            <div
              key={`${item.rowKey ?? item.aspect}-${idx}`}
              className="flex flex-col rounded-3xl border border-[#E2C4A8]/20 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-[#E2C4A8]/20 pb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#8C7A6B]">
                  {item.aspect}
                </h3>
                <span className="rounded-full bg-[#FAF9F6] px-2.5 py-0.5 text-[11px] text-[#8C7A6B]">
                  {item.bucketLabel}
                </span>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-4">
                  <div className="mt-2 h-1.5 w-1.5 rounded-full bg-[#2c3e35]" />
                  <div>
                    <p className="mb-1 text-[11px] font-bold text-[#2c3e35]/60">{meta.myName}</p>
                    <p className="text-[15px] font-medium leading-relaxed text-[#2c3e35]">{item.me}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-2 h-1.5 w-1.5 rounded-full bg-[#b58c67]" />
                  <div>
                    <p className="mb-1 text-[11px] font-bold text-[#b58c67]/60">{meta.partnerName}</p>
                    <p className="text-[15px] font-medium leading-relaxed text-[#2c3e35]">
                      {item.partner}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-xl bg-gray-50/50 p-5">
                <p className="mb-2 text-[11px] font-bold text-[#8C7A6B]">이 차이가 관계에서 뜻하는 것</p>
                <p className="text-[14px] leading-relaxed text-[#5c544e]">{item.relationshipMeaning}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
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
    <EditorialChapter id="romantic-m5-hidden" eyebrow={ROMANTIC_V2_MODULE_TITLES.hiddenHeart} variant="climax">
      <div className="space-y-10 sm:space-y-12">
        <div className="flex justify-center">
          <ConfidenceNote confidence={hiddenHeart.confidence} />
        </div>
        <div className="flex flex-col gap-6 rounded-3xl bg-white/40 p-6 sm:p-8">
          {hiddenHeart.me ? (
            <div className="space-y-2">
              <p className="text-[13px] font-bold text-[#b58c67]">{hiddenHeart.me.name} 쪽은</p>
              <p className="text-lg font-medium leading-relaxed italic text-on-surface sm:text-xl">
                “{personText(hiddenHeart.me)}”
              </p>
            </div>
          ) : null}
          {hiddenHeart.partner ? (
            <div className="space-y-2 border-t border-[#E2C4A8]/30 pt-6">
              <p className="text-[13px] font-bold text-[#b58c67]">{hiddenHeart.partner.name} 쪽은</p>
              <p className="text-lg font-medium leading-relaxed italic text-on-surface sm:text-xl">
                “{personText(hiddenHeart.partner)}”
              </p>
            </div>
          ) : null}
        </div>
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
    <EditorialChapter
      id="romantic-m6-special"
      eyebrow={ROMANTIC_V2_MODULE_TITLES.specialDynamics}
    >
      <div className="flex flex-col items-center space-y-8 py-2">
        <ConfidenceNote confidence={specialDynamics.confidence} />

        <div className="flex w-full flex-col items-center gap-6">
          {specialDynamics.gifts.map((gift, idx) => (
            <div
              key={`${gift.from}-${gift.to}-${idx}`}
              className="w-full rounded-3xl bg-surface-container-low p-6 text-center shadow-sm"
            >
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-primary/60">
                {gift.from}이 관계에 더하는 것
              </p>
              {gift.body ? (
                <p className="text-[15px] font-medium leading-relaxed text-on-surface">{gift.body}</p>
              ) : null}
            </div>
          ))}

          <div className="w-full space-y-4 rounded-[32px] border border-primary/10 bg-primary/5 p-8 text-center shadow-sm">
            {specialDynamics.onlyTogether ? (
              <p className="text-lg font-bold leading-relaxed text-primary">
                {specialDynamics.onlyTogether}
              </p>
            ) : null}
            {specialDynamics.whySpecial ? (
              <p className="text-[15px] leading-relaxed text-on-surface-variant">
                {specialDynamics.whySpecial}
              </p>
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
          </div>
        </div>
      </div>
    </EditorialChapter>
  );
}

function ConflictTranslationRow({ row }: { row: any }) {
  const [translated, setTranslated] = useState(false);
  return (
    <div className="flex flex-col space-y-5 rounded-[28px] bg-surface-container-low/30 p-5 sm:p-7">
      <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
        <span className="text-[13px] font-bold text-secondary">{row.speakerLabel} 쪽의 갈등 패턴</span>
        <button 
          onClick={() => setTranslated(!translated)}
          className="rounded-full bg-secondary/10 px-3 py-1.5 text-[11px] font-bold text-secondary transition-colors hover:bg-secondary/20"
        >
          {translated ? "원래 대화 보기" : "속마음 번역하기"}
        </button>
      </div>
      
      <div className="relative pt-2">
        <div className={`transition-all duration-300 ease-in-out ${translated ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
           <div className="flex flex-col items-start space-y-1.5">
             <span className="pl-1 text-[11px] font-medium text-rose-800/60">실제로 한 말</span>
             <div className="rounded-2xl rounded-tl-sm bg-rose-50 px-4 py-3 text-[15px] leading-relaxed text-rose-900/80">
               {row.said}
             </div>
           </div>
        </div>
        
        <div className={`transition-all duration-300 ease-in-out ${!translated ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
          <div className="flex flex-col items-start gap-4">
             {row.meant ? (
               <div className="flex flex-col space-y-1.5 w-full">
                 <span className="pl-1 text-[11px] font-medium text-secondary/70">사실 하고 싶었던 말</span>
                 <div className="rounded-2xl rounded-tl-sm bg-surface-container px-4 py-3 text-[15px] leading-relaxed text-on-surface">
                   {row.meant}
                 </div>
               </div>
             ) : null}
             {row.better ? (
               <div className="flex flex-col space-y-1.5 w-full items-end">
                 <span className="pr-1 text-[11px] font-medium text-emerald-700/70">이렇게 말해보세요</span>
                 <div className="rounded-2xl rounded-tr-sm bg-emerald-50 px-4 py-3 text-base font-medium leading-relaxed text-emerald-800">
                   {row.better}
                 </div>
               </div>
             ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export function RomanticConflictSection({ vm }: ModuleProps) {
  if (!vm.conflictTranslation.available) return null;
  const { conflictTranslation } = vm;

  return (
    <section className="px-6 py-16 bg-[#FAF9F6]">
      <div className="mx-auto max-w-xl">
        <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#b58c67]">
          Conflict Translation
        </p>
        <h2 className="mb-4 text-center font-serif text-[28px] sm:text-[32px] text-[#2c3e35]">
          서로의 언어 번역기
        </h2>
        <p className="mb-12 text-center text-sm text-[#8C7A6B]">
          갈등 상황에서 오가는 말의 진짜 의미를 통역합니다.
        </p>
        
        <div className="space-y-12">
          {conflictTranslation.rows.map((row, idx) => {
            const speaker = row.speakerLabel;
            
            return (
              <div key={idx} className="flex flex-col bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E2C4A8]/20">
                {/* 1. What was said */}
                <div className="flex flex-col gap-2 mb-6">
                   <p className="text-[11px] font-bold text-red-900/60 uppercase tracking-widest">실제로 나온 말</p>
                   <p className="text-[17px] leading-snug font-medium text-red-950">“{row.said}”</p>
                </div>
                
                {/* Visual Connector Line */}
                <div className="ml-2 w-px h-8 bg-gradient-to-b from-red-900/10 to-[#E2C4A8]/40 my-2"></div>
                
                {/* 2. True Intent — projectConflictPattern never invents meant/heard (no
                    invention rule); only render this block on the rows where it's
                    actually populated. */}
                {row.meant ? (
                  <div className="flex flex-col gap-2 mb-6 pl-4 border-l-2 border-[#E2C4A8]/40">
                     <p className="text-[11px] font-bold text-[#b58c67] uppercase tracking-widest">그 말 뒤에 있던 마음</p>
                     <p className="text-[15px] leading-relaxed text-[#5c544e]">{row.meant}</p>
                  </div>
                ) : null}

                {/* 3. Better Wording — only when populated */}
                {row.better ? (
                  <div className="mt-2 flex flex-col gap-2 rounded-xl border border-[#E2C4A8]/20 bg-[#FAF9F6] p-5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#2c3e35]/80">
                      이렇게 말하면 더 잘 전달돼요
                    </p>
                    <p className="text-[16px] font-medium leading-relaxed text-[#2c3e35]">
                      “{row.better}”
                    </p>
                  </div>
                ) : null}
                {row.heard ? (
                  <div className="mt-4 flex flex-col gap-2 pl-4 border-l-2 border-outline-variant/30">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#8C7A6B]">
                      상대가 듣기 쉬운 말
                    </p>
                    <p className="text-[15px] leading-relaxed text-[#5c544e]">{row.heard}</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}



export function RomanticRepairSection({ vm }: ModuleProps) {
  if (!vm.repairGuide.available || vm.repairGuide.stages.length === 0) return null;
  const { repairGuide } = vm;

  const bucketStages = [
    { label: "멈추기", items: repairGuide.stages.filter(s => s.id === "pause" || s.id === "re_entry") },
    { label: "다시 연결하기", items: repairGuide.stages.filter(s => s.id === "acknowledgement" || s.id === "clarification") },
    { label: "닫기", items: repairGuide.stages.filter(s => s.id === "reassurance" || s.id === "closure") }
  ].filter(b => b.items.length > 0);

  return (
    <section id="romantic-m8-repair" className={CARD_ANCHOR}>
      <div className="px-2 space-y-8">
        <div className="mb-4 flex items-center justify-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary/60">
            {ROMANTIC_V2_MODULE_TITLES.repairGuide}
          </p>
        </div>
        <div className="flex justify-center">
          <ConfidenceNote confidence={repairGuide.confidence} />
        </div>
        <div className="relative space-y-12 pl-2">
          <div className="absolute bottom-8 left-[17px] top-4 -z-10 border-l border-dashed border-outline-variant/30"></div>
          {bucketStages.map((bucket, bIdx) => (
            <div key={bIdx} className="relative space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-4 border-secondary bg-surface shadow-sm"></div>
                <h3 className="text-lg font-bold text-primary">{bucket.label}</h3>
              </div>
              <div className="space-y-4 pl-8">
                {bucket.items.map((stage) => (
                  <div key={stage.id} className="rounded-xl bg-surface-container-low p-5 shadow-sm">
                    <p className="font-semibold text-secondary">{stage.title}</p>
                    <p className="mt-2 text-[15px] leading-relaxed text-on-surface">{stage.body}</p>
                    {stage.speakable ? (
                      <p className="mt-2 text-sm italic text-on-surface-variant">
                        “{stage.speakable}”
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
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
  const allThemes = pack.items;
  const topThemes = allThemes.slice(0, 2);
  const hiddenThemes = allThemes.slice(2);

  const renderTheme = (item: any) => (
    <div key={item.topic} className="space-y-4 rounded-2xl bg-secondary/5 p-5">
      <h4 className="font-semibold text-primary">{item.headline}</h4>
      <div className="grid gap-4 sm:grid-cols-2">
        {item.do_list.length > 0 && (
          <div className="space-y-1.5 pl-2 border-l-2 border-emerald-200/60">
            <span className="text-[11px] font-bold text-emerald-700/60 tracking-wider">DO</span>
            <p className="text-[15px] leading-relaxed text-on-surface-variant">{item.do_list[0]}</p>
          </div>
        )}
        {item.dont_list.length > 0 && (
          <div className="space-y-1.5 pl-2 border-l-2 border-rose-200/60">
            <span className="text-[11px] font-bold text-rose-700/60 tracking-wider">DON'T</span>
            <p className="text-[15px] leading-relaxed text-on-surface-variant">{item.dont_list[0]}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section id="romantic-m10-dodont" className={CARD_ANCHOR}>
      <div className="px-2 space-y-6">
        <div className="mb-4 flex items-center justify-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary/60">
            {ROMANTIC_V2_MODULE_TITLES.doDont}
          </p>
        </div>
        <div className="flex justify-center">
          <ConfidenceNote confidence={vm.doDont.confidence} />
        </div>
        <div className="space-y-6">
          {allThemes.map(renderTheme)}
        </div>
      </div>
    </section>
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

/**
 * Horizon mounts only when projector has content and no fate-language waypoints remain.
 * Projector already filters fate phrases; this guards empty available shells.
 */
export function isHorizonSafeToShow(vm: RomanticExperienceViewModel): boolean {
  return (
    vm.horizon.available &&
    vm.horizon.waypoints.length > 0 &&
    vm.horizon.waypoints.every(
      (w) =>
        typeof w.body === "string" &&
        w.body.trim().length > 0 &&
        !/운명|반드시 헤어|보장된 미래|destined|fated/i.test(w.body),
    )
  );
}

export function RomanticHorizonSection({ vm }: ModuleProps) {
  const t = useMessages().relationshipDrilldown.romantic;
  if (!isHorizonSafeToShow(vm)) return null;

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
  const { saveShare, meta } = vm;
  if (!saveShare.available || !saveShare.signatureLine) return null;

  return (
    <section
      data-romantic-chapter="saveShare"
      id="romantic-m12-save"
      className={`${CARD_ANCHOR} mt-12 mb-24 px-4`}
    >
      <div className="mx-auto max-w-sm rounded-[32px] border border-outline-variant/10 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] sm:p-10">
        <div className="flex flex-col items-center space-y-10">
          <div className="space-y-5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary/50">
              {meta.myName} × {meta.partnerName}
            </p>
            <p className="font-serif text-2xl font-medium italic leading-relaxed text-primary sm:text-3xl">
              {saveShare.signatureLine}
            </p>
          </div>
          {saveShare.insightLines.length > 0 ? (
            <>
              <div className="w-8 border-t border-outline-variant/30" />
              <div className="space-y-3 text-center">
                {saveShare.insightLines.map((line, idx) => (
                  <p key={idx} className="text-[14px] leading-relaxed text-on-surface-variant">
                    {line}
                  </p>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
