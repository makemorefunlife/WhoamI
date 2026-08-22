"use client";

import type { CanonicalRomanticV4Report } from "@/lib/relationship/romantic/prototypeV4/buildCanonicalRomanticV4Report";
import type { CanonicalSection } from "@/lib/relationship/romantic/prototypeV4/composeCanonicalSectionNarratives";
import type { RomanticV4PrototypePayload } from "@/lib/relationship/romantic/prototypeV4/types";
import {
  HeroSection,
  AttractionSection,
  DynamicsSection,
  ConflictSection,
  MisunderstandingSection,
} from "./ChaptersA";
import {
  HiddenHeartsSection,
  RepairSection,
  ExpectationsSection,
  StrengthVulnerabilitySection,
  FutureTimingSection,
  ChoiceSection,
} from "./ChaptersB";
import { OverviewSection } from "../../shared/overview/OverviewSection";
import React from "react";

type Props = {
  report: CanonicalRomanticV4Report;
  payload: RomanticV4PrototypePayload;
  debug?: boolean;
};

/**
 * Presentation-only chapter title overrides — applied once here so the nav
 * and the in-page chapter header never disagree.
 */
const TITLE_OVERRIDES_KO: Partial<Record<CanonicalSection["chapterId"] | "c8_3_expectations", string>> = {
  c3_dynamics: "우리가 연결되는 방식",
  c2_attraction: "서로를 선택한 이유",
  c4_conflict: "마찰이 생기는 지점",
  c5_misunderstanding: "다름을 번역하는 법",
  c6_hidden_hearts: "오해 너머의 진심",
  c7_repair: "관계를 위한 액션 플랜",
  c8_3_expectations: "서로에게 내려놓아야 할 기대",
  c8_strength_vulnerability: "시너지와 취약점",
  c10_future_timing: "올해 우리 관계의 흐름",
  c12_choice: "우리의 넥스트 챕터",
};

const TITLE_OVERRIDES_EN: Partial<Record<CanonicalSection["chapterId"] | "c8_3_expectations", string>> = {
  c3_dynamics: "How We Connect",
  c2_attraction: "Why We Chose Each Other",
  c4_conflict: "Friction Points",
  c5_misunderstanding: "Translating Differences",
  c6_hidden_hearts: "Beneath the Surface",
  c7_repair: "Action Plan",
  c8_3_expectations: "What Not to Expect",
  c8_strength_vulnerability: "Synergy & Vulnerability",
  c10_future_timing: "Timing & Flow This Year",
  c12_choice: "Our Next Chapter",
};

/**
 * Display order of all core numbered chapters ("Chapter 01".."Chapter 10").
 * c1_hero sits outside as the cover page.
 */
const CORE_CHAPTER_ORDER: (CanonicalSection["chapterId"] | "c8_3_expectations")[] = [
  "c3_dynamics",
  "c2_attraction",
  "c4_conflict",
  "c5_misunderstanding",
  "c6_hidden_hearts",
  "c7_repair",
  "c8_3_expectations",
  "c8_strength_vulnerability",
  "c10_future_timing",
  "c12_choice",
];

function reorderForDisplay(
  sections: CanonicalSection[],
  payload: RomanticV4PrototypePayload,
): CanonicalSection[] {
  const locale = payload.locale;
  const titleOverrides = locale === "en-US" ? TITLE_OVERRIDES_EN : TITLE_OVERRIDES_KO;

  // Final Cleanup pass, item 4 — whatNotToExpect is always an object (even
  // when both directions abstained to []), so a bare truthiness check here
  // always evaluated true regardless of real content, leaving a nav link
  // pointing at a chapter that renders nothing. Check actual list lengths.
  const wnte = payload.storyPlan?.romanticGapBatch?.whatNotToExpect;
  const hasExpectations = Boolean(
    (wnte?.notToExpectAFromB?.length ?? 0) > 0 || (wnte?.notToExpectBFromA?.length ?? 0) > 0,
  );
  const expectationsSection: CanonicalSection = {
    chapterId: "c8_3_expectations" as any,
    title: locale === "en-US" ? "What Not to Expect" : "서로에게 내려놓아야 할 기대",
    userQuestion: locale === "en-US" ? "What expectations should be set aside?" : "서로를 위해 비워두어야 할 영역",
    visible: hasExpectations,
    blocks: [],
    primaryEvidenceIds: [],
  };

  let list = sections.filter(
    (s) => s.chapterId !== "c9_daily_life" && s.chapterId !== "c11_reflection",
  );
  if (hasExpectations && !list.some((s) => s.chapterId === ("c8_3_expectations" as any))) {
    list = [...list, expectationsSection];
  }

  const orderMap = new Map(CORE_CHAPTER_ORDER.map((id, index) => [id, index]));
  const c1 = list.find((s) => s.chapterId === "c1_hero");
  const core = list.filter((s) => s.chapterId !== "c1_hero");
  core.sort((a, b) => {
    const ia = orderMap.get(a.chapterId) ?? 99;
    const ib = orderMap.get(b.chapterId) ?? 99;
    return ia - ib;
  });

  const result = c1 ? [c1, ...core] : core;

  return result.map((s) =>
    titleOverrides[s.chapterId] ? { ...s, title: titleOverrides[s.chapterId]! } : s,
  );
}

/**
 * Sequential "01".."10" computed directly from actual visible display order.
 * Ensures 1:1 exact match between rendered DOM order and Chapter Number badges.
 */
function computeChapterNumbers(
  visible: CanonicalSection[],
): Partial<Record<CanonicalSection["chapterId"], string>> {
  const numbers: Partial<Record<CanonicalSection["chapterId"], string>> = {};
  const coreVisible = visible.filter((s) => s.chapterId !== "c1_hero");
  coreVisible.forEach((s, i) => {
    numbers[s.chapterId] = String(i + 1).padStart(2, "0");
  });
  return numbers;
}

export function CanonicalReportView({ report, payload: rawPayload, debug = false }: Props) {
  const axisOverview =
    rawPayload?.axisOverview && rawPayload.axisOverview.length > 0
      ? rawPayload.axisOverview
      : report?.storyPlan?.axisOverview ?? [];

  const selectedAxisInsights =
    rawPayload?.selectedAxisInsights && rawPayload.selectedAxisInsights.length > 0
      ? rawPayload.selectedAxisInsights
      : report?.storyPlan?.selectedAxisInsights ?? [];

  const comparisonTable =
    rawPayload?.comparisonTable && rawPayload.comparisonTable.length > 0
      ? rawPayload.comparisonTable
      : report?.storyPlan?.comparisonTable ?? [];

  const payload = {
    ...rawPayload,
    axisOverview,
    selectedAxisInsights,
    comparisonTable,
  };

  const visible = reorderForDisplay(report.sections.filter((s) => s.visible), payload);
  const chapterNumbers = computeChapterNumbers(visible);
  const dailyLifeSection = report.sections.find((s) => s.chapterId === "c9_daily_life");
  const { a, b } = report.names;

  const sectionProps = (s: CanonicalSection) => ({
    section: s,
    payload,
    personA: a,
    personB: b,
    n: chapterNumbers[s.chapterId],
    debug,
    ...(s.chapterId === "c7_repair" ? { dailyLifeSection } : {}),
  });

  return (
    <div data-canonical-report className="bg-rel-bg font-rel-sans text-rel-ink antialiased">
      <nav
        className="sticky top-0 z-50 w-full border-b border-rel-line bg-rel-bg/90 backdrop-blur-md px-4 py-3"
        aria-label="Chapters"
      >
        <div className="mx-auto flex max-w-5xl items-center gap-4 overflow-x-auto no-scrollbar">
          {visible.map((s, i) => (
            <a
              key={s.chapterId}
              href={`#${s.chapterId}`}
              className="shrink-0 whitespace-nowrap px-2 font-rel-sans text-[10.5px] tracking-[0.1em] text-rel-ink-mute transition-colors hover:text-rel-deep"
            >
              {i + 1}. {s.title}
            </a>
          ))}
        </div>
      </nav>

      {visible.map((section) => {
        switch (section.chapterId) {
          case "c1_hero":
            return (
              <React.Fragment key={section.chapterId}>
                <HeroSection {...sectionProps(section)} />
                {report.overviewCards?.length > 0 && (
                  <OverviewSection
                    locale={payload.locale}
                    eyebrow="OVERVIEW"
                    title={payload.locale === "en-US" ? "At a Glance" : "한눈에 보기"}
                    lead=""
                    cards={report.overviewCards}
                  />
                )}
              </React.Fragment>
            );
          case "c2_attraction":
            return <AttractionSection key={section.chapterId} {...sectionProps(section)} />;
          case "c3_dynamics":
            return <DynamicsSection key={section.chapterId} {...sectionProps(section)} />;
          case "c4_conflict":
            return <ConflictSection key={section.chapterId} {...sectionProps(section)} />;
          case "c5_misunderstanding":
            return <MisunderstandingSection key={section.chapterId} {...sectionProps(section)} />;
          case "c6_hidden_hearts":
            return <HiddenHeartsSection key={section.chapterId} {...sectionProps(section)} />;
          case "c7_repair":
            return <RepairSection key={section.chapterId} {...sectionProps(section)} />;
          case "c8_3_expectations" as any:
            return <ExpectationsSection key={section.chapterId} {...sectionProps(section)} />;
          case "c8_strength_vulnerability":
            return <StrengthVulnerabilitySection key={section.chapterId} {...sectionProps(section)} />;
          case "c10_future_timing":
            return <FutureTimingSection key={section.chapterId} {...sectionProps(section)} />;
          case "c12_choice":
            return <ChoiceSection key={section.chapterId} {...sectionProps(section)} />;
          default:
            return null;
        }
      })}

      {debug || !report.validation.ok ? (
        <aside className="mx-auto max-w-3xl px-6 py-10">
          <div className="rounded-2xl border border-rel-line bg-rel-surface p-6 text-sm">
            <p className="font-semibold text-rel-ink">
              Validation: {report.validation.ok ? "ok" : "issues"}
            </p>
            {report.hiddenChapters.length ? (
              <p className="mt-2 text-rel-ink-mute">
                Hidden:{" "}
                {report.hiddenChapters.map((h) => `${h.chapterId} (${h.reason})`).join("; ")}
              </p>
            ) : null}
            {!report.validation.ok ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-v4-bad">
                {report.validation.issues.map((issue) => (
                  <li key={`${issue.code}-${issue.message}`}>
                    {issue.code}: {issue.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </aside>
      ) : null}
    </div>
  );
}
