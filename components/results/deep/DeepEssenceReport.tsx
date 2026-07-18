"use client";

import { DeepEssenceToggleSection } from "@/components/results/deep/DeepEssenceToggleSection";
import { DeepEssencePartOne } from "@/components/results/deep/DeepEssencePartOne";
import { DeepEssencePartTwo } from "@/components/results/deep/DeepEssencePartTwo";
import { DeepEssencePartThree } from "@/components/results/deep/DeepEssencePartThree";
import { DeepEssencePartFour } from "@/components/results/deep/DeepEssencePartFour";
import { DeepEssencePartFive } from "@/components/results/deep/DeepEssencePartFive";
import { DeepEssenceChecklist } from "@/components/results/deep/DeepEssenceChecklist";
import { getDeepEssenceUiStrings } from "@/components/results/deep/deepEssenceUiStrings";
import type { DeepEssenceStructuredReport } from "@/lib/report/runDeepEssenceStructuredLlm";
import type { PrimaryAxesScores } from "@/lib/v2/survey/types";
import type { Locale } from "@/lib/i18n/locale";

/**
 * 로버블 "Inner Compass" 디자인 전체(Part 01~05 + 부록) 조립.
 * Part 01은 기본으로 펼쳐져 있고, Part 02~05는 로버블 원본처럼 접힌 상태로
 * 시작한다 — 헤더를 누르면 펼쳐지는 ToggleSection/PartHeader를 그대로 이식했다.
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

  return (
    <div>
      <DeepEssenceToggleSection
        number={t.part1.num}
        label={t.part1.label}
        subtitle={t.part1.subtitle}
        title={t.part1.title}
        metaTone="gold"
        defaultOpen
      >
        <DeepEssencePartOne structured={structured} radarCurrent={radarCurrent} locale={locale} t={t} />
      </DeepEssenceToggleSection>

      <DeepEssenceToggleSection
        number={t.part2.num}
        label={t.part2.label}
        subtitle={t.part2.subtitle}
        title={t.part2.title}
        meta={`${t.part2.metaPrefix} ${relationalSpendPct}%`}
        metaTone="highlight"
      >
        <DeepEssencePartTwo energy={structured.energy} t={t} />
      </DeepEssenceToggleSection>

      <DeepEssenceToggleSection
        number={t.part3.num}
        label={t.part3.label}
        subtitle={t.part3.subtitle}
        title={t.part3.title}
        meta={t.part3.meta}
        metaTone="gold"
      >
        <DeepEssencePartThree relationships={structured.relationships} t={t} />
      </DeepEssenceToggleSection>

      <DeepEssenceToggleSection
        number={t.part4.num}
        label={t.part4.label}
        subtitle={t.part4.subtitle}
        title={t.part4.title}
        meta={t.part4.meta}
        metaTone="accent"
      >
        <DeepEssencePartFour playbook={structured.playbook} t={t} />
      </DeepEssenceToggleSection>

      <DeepEssenceToggleSection
        number={t.part5.num}
        label={t.part5.label}
        subtitle={t.part5.subtitle}
        title={t.part5.title}
        meta={t.part5.meta}
        metaTone="accent"
      >
        <DeepEssencePartFive future={structured.future} closing={structured.closing} t={t} />
      </DeepEssenceToggleSection>

      <div className="mt-10">
        <DeepEssenceChecklist items={structured.checklist} t={t} />
      </div>
    </div>
  );
}
