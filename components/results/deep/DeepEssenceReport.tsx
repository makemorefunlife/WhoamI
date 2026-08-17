"use client";

import type { ReactNode } from "react";
import { DeepEssenceToggleSection } from "@/components/results/deep/DeepEssenceToggleSection";
import { DeepEssencePartOne } from "@/components/results/deep/DeepEssencePartOne";
import { DeepEssencePartTwo } from "@/components/results/deep/DeepEssencePartTwo";
import { DeepEssencePartThree } from "@/components/results/deep/DeepEssencePartThree";
import { DeepEssencePartFive } from "@/components/results/deep/DeepEssencePartFive";
import {
  DeepEssenceLayeredIdentity,
  hasLayeredIdentityContent,
} from "@/components/results/deep/DeepEssenceLayeredIdentity";
import {
  DeepEssenceAxisInterpretation,
  hasAxisInterpretationContent,
} from "@/components/results/deep/DeepEssenceAxisInterpretation";
import {
  DeepEssenceAdaptationStory,
  hasAdaptationStoryContent,
} from "@/components/results/deep/DeepEssenceAdaptationStory";
import { DeepEssenceChecklist } from "@/components/results/deep/DeepEssenceChecklist";
import { getDeepEssenceUiStrings } from "@/components/results/deep/deepEssenceUiStrings";
import type { DeepEssenceStructuredReport } from "@/lib/report/runDeepEssenceStructuredLlm";
import type { PrimaryAxesScores } from "@/lib/v2/survey/types";
import type { Locale } from "@/lib/i18n/locale";

type MetaTone = "accent" | "highlight" | "gold";

type Section = {
  key: string;
  label: string;
  title: string;
  subtitle?: string;
  meta?: string;
  metaTone?: MetaTone;
  defaultOpen?: boolean;
  content: ReactNode;
};

/**
 * IA Batch 1 — Personal Premium redesign: "정보 모음" → "나를 이해해가는 이야기".
 *
 * The old fixed Part 01~05 assembly (each a hardcoded <DeepEssenceToggleSection
 * number="Part 0N">) is replaced with an ordered `sections` array, built once
 * per render and filtered to only the sections that actually have content —
 * the displayed "Part 0N" number is then the section's INDEX IN THAT FILTERED
 * LIST, not a value baked into any one section. This is what keeps the
 * user-visible numbering gap-free (01, 02, 03... never "01 02 03 05") even
 * though layered_identity, axis_interpretations, and adaptation_story
 * (IA Batch 3 — Part 04, "그래서 나는 왜 이렇게 살아왔을까요?") are each
 * independently optional. All three follow the same `hasX ? [...] : []`
 * pattern — no per-Part number is ever hardcoded, so adding/removing any of
 * them never requires touching how the others are numbered.
 *
 * Old Part 04 (playbook) is not part of this array — see
 * DeepEssencePartFour.tsx's own doc comment (data/schema/prompt kept,
 * UI Part removed, may be reused in a future batch).
 */
export function DeepEssenceReport({
  structured,
  radarCurrent,
  locale,
}: {
  structured: DeepEssenceStructuredReport;
  radarCurrent: PrimaryAxesScores;
  locale: Locale;
}) {
  const t = getDeepEssenceUiStrings(locale);
  const relationalSpendPct = structured.energy.bars[0]?.value ?? structured.energy.balance_pct;
  const hasLayered = hasLayeredIdentityContent(structured.layered_identity);
  const hasAxis = hasAxisInterpretationContent(structured.axis_interpretations);
  const hasAdaptationStory = hasAdaptationStoryContent(structured.adaptation_story);

  const sections: Section[] = [
    {
      key: "current-self",
      label: t.part1.label,
      title: t.part1.title,
      subtitle: t.part1.subtitle,
      metaTone: "gold",
      defaultOpen: true,
      content: (
        <DeepEssencePartOne
          structured={structured}
          radarCurrent={radarCurrent}
          locale={locale}
          t={t}
        />
      ),
    },
    ...(hasLayered
      ? [
          {
            key: "layered-identity",
            label: t.layeredIdentity.sectionTag,
            title: t.layeredIdentity.sectionTitle,
            metaTone: "highlight" as const,
            content: (
              <DeepEssenceLayeredIdentity
                layeredIdentity={structured.layered_identity}
                t={t.layeredIdentity}
              />
            ),
          },
        ]
      : []),
    ...(hasAxis
      ? [
          {
            key: "axis-interpretation",
            label: t.axisInterpretation.sectionTag,
            title: t.axisInterpretation.sectionTitle,
            metaTone: "gold" as const,
            content: (
              <DeepEssenceAxisInterpretation
                axisInterpretations={structured.axis_interpretations}
                locale={locale}
                t={t.axisInterpretation}
              />
            ),
          },
        ]
      : []),
    // IA Batch 3 — Part 04 ("그래서 나는 왜 이렇게 살아왔을까요?"), guarded the
    // exact same way as layered-identity/axis-interpretation above.
    ...(hasAdaptationStory
      ? [
          {
            key: "adaptation-story",
            label: t.adaptationStory.sectionTag,
            title: t.adaptationStory.sectionTitle,
            metaTone: "highlight" as const,
            content: <DeepEssenceAdaptationStory adaptationStory={structured.adaptation_story} />,
          },
        ]
      : []),
    {
      key: "energy-strengths",
      label: t.part2.label,
      title: t.part2.title,
      subtitle: t.part2.subtitle,
      meta: `${t.part2.metaPrefix} ${relationalSpendPct}%`,
      metaTone: "highlight",
      content: (
        <DeepEssencePartTwo
          energy={structured.energy}
          strengths={structured.strengths}
          watchouts={structured.watchouts}
          t={t}
        />
      ),
    },
    {
      key: "relationships-environment",
      label: t.part3.label,
      title: t.part3.title,
      subtitle: t.part3.subtitle,
      meta: t.part3.meta,
      metaTone: "accent",
      content: (
        <DeepEssencePartThree
          relationships={structured.relationships}
          optimal={structured.energy.optimal}
          t={t}
        />
      ),
    },
    {
      key: "future-choices",
      label: t.part5.label,
      title: t.part5.title,
      subtitle: t.part5.subtitle,
      meta: t.part5.meta,
      metaTone: "accent",
      content: <DeepEssencePartFive future={structured.future} closing={structured.closing} t={t} />,
    },
  ];

  return (
    <div>
      {sections.map((section, i) => (
        <DeepEssenceToggleSection
          key={section.key}
          number={`Part ${String(i + 1).padStart(2, "0")}`}
          label={section.label}
          subtitle={section.subtitle}
          title={section.title}
          meta={section.meta}
          metaTone={section.metaTone}
          defaultOpen={section.defaultOpen}
        >
          {section.content}
        </DeepEssenceToggleSection>
      ))}

      <div className="mt-10">
        <DeepEssenceChecklist items={structured.checklist} t={t} />
      </div>
    </div>
  );
}
