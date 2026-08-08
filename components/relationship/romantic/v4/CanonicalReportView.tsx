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
  StrengthVulnerabilitySection,
  FutureTimingSection,
  ChoiceSection,
} from "./ChaptersB";

type Props = {
  report: CanonicalRomanticV4Report;
  payload: RomanticV4PrototypePayload;
  debug?: boolean;
};

/**
 * The canonical engine's chapter order is c1_hero, c2_attraction, c3_dynamics, ...
 * The display order matches product direction, not the engine's list:
 *  - Dynamics renders right after Hero, ahead of Attraction.
 *  - Strength & Vulnerability renders right before Repair (not after).
 * This reorders the DISPLAY sequence only — chapter ownership, content, and
 * the engine's own section list (report.sections) are untouched.
 */
function moveBefore(
  sections: CanonicalSection[],
  moveId: string,
  beforeId: string,
): CanonicalSection[] {
  const moveIndex = sections.findIndex((s) => s.chapterId === moveId);
  if (moveIndex === -1) return sections;
  const without = sections.filter((s) => s.chapterId !== moveId);
  const targetIndex = without.findIndex((s) => s.chapterId === beforeId);
  const insertAt = targetIndex === -1 ? without.length : targetIndex;
  const reordered = [...without];
  reordered.splice(insertAt, 0, sections[moveIndex]);
  return reordered;
}

/**
 * Presentation-only chapter title overrides — applied once here so the nav
 * and the in-page chapter header never disagree. The engine's own
 * section.title (used elsewhere, e.g. evidence trace / debug views) is
 * untouched; this only affects what this view renders.
 *
 * Wellness-tone copy for a sophisticated, self-aware audience — chosen to
 * read as insight rather than diagnosis. Keyed by the SAME 8 chapterIds that
 * make up CORE_CHAPTER_ORDER below (c10_future_timing intentionally has no
 * entry — it renders as an unnumbered bonus chapter, see reorderForDisplay).
 */
const TITLE_OVERRIDES_KO: Partial<Record<CanonicalSection["chapterId"], string>> = {
  c3_dynamics: "우리가 연결되는 방식",
  c2_attraction: "서로를 선택한 이유",
  c4_conflict: "마찰이 생기는 지점",
  c5_misunderstanding: "다름을 번역하는 법",
  c6_hidden_hearts: "오해 너머의 진심",
  c8_strength_vulnerability: "시너지와 취약점",
  c7_repair: "관계를 위한 액션 플랜",
  c12_choice: "우리의 넥스트 챕터",
};

const TITLE_OVERRIDES_EN: Partial<Record<CanonicalSection["chapterId"], string>> = {
  c3_dynamics: "How We Connect",
  c2_attraction: "Why We Chose Each Other",
  c4_conflict: "Friction Points",
  c5_misunderstanding: "Translating Differences",
  c6_hidden_hearts: "Beneath the Surface",
  c8_strength_vulnerability: "Synergy & Vulnerability",
  c7_repair: "Action Plan",
  c12_choice: "Our Next Chapter",
};

/**
 * Display order of the 8 core numbered chapters ("Chapter 01".."Chapter
 * 08"). c1_hero and c10_future_timing sit outside this sequence and render
 * without a number badge — Hero as a cover, Future/Timing as an optional
 * bonus chapter that only appears when timing data is available, so it can
 * never leave a gap in the core numbering.
 */
const CORE_CHAPTER_ORDER: CanonicalSection["chapterId"][] = [
  "c3_dynamics",
  "c2_attraction",
  "c4_conflict",
  "c5_misunderstanding",
  "c6_hidden_hearts",
  "c8_strength_vulnerability",
  "c7_repair",
  "c12_choice",
];

/**
 * Repair and Daily Life render as one merged chapter ("관계를 위한 액션
 * 플랜"/"Action Plan"), and Reflection has been dropped from the flow
 * entirely — both are presentation-only decisions; the engine's own section
 * list is untouched.
 */
function reorderForDisplay(
  sections: CanonicalSection[],
  locale: "ko-KR" | "en-US",
): CanonicalSection[] {
  const titleOverrides = locale === "en-US" ? TITLE_OVERRIDES_EN : TITLE_OVERRIDES_KO;
  let result = sections;
  result = moveBefore(result, "c3_dynamics", "c2_attraction");
  result = moveBefore(result, "c8_strength_vulnerability", "c7_repair");
  result = result.filter(
    (s) => s.chapterId !== "c9_daily_life" && s.chapterId !== "c11_reflection",
  );
  return result.map((s) =>
    titleOverrides[s.chapterId] ? { ...s, title: titleOverrides[s.chapterId]! } : s,
  );
}

/**
 * Sequential "01".."08" for whichever of the 8 core chapters are actually
 * visible, computed fresh from the real display order every render — never
 * hardcoded per-component, so a hidden chapter (e.g. Future/Timing, which
 * isn't part of this sequence at all) can never cause a skipped number.
 */
function computeChapterNumbers(
  visible: CanonicalSection[],
): Partial<Record<CanonicalSection["chapterId"], string>> {
  const numbers: Partial<Record<CanonicalSection["chapterId"], string>> = {};
  const coreVisible = visible.filter((s) => CORE_CHAPTER_ORDER.includes(s.chapterId));
  coreVisible
    .sort((a, b) => CORE_CHAPTER_ORDER.indexOf(a.chapterId) - CORE_CHAPTER_ORDER.indexOf(b.chapterId))
    .forEach((s, i) => {
      numbers[s.chapterId] = String(i + 1).padStart(2, "0");
    });
  return numbers;
}

export function CanonicalReportView({ report, payload, debug = false }: Props) {
  const visible = reorderForDisplay(report.sections.filter((s) => s.visible), payload.locale);
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
            return <HeroSection key={section.chapterId} {...sectionProps(section)} />;
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
