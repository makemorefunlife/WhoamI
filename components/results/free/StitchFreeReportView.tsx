"use client";

import { FreeReportBody } from "@/components/results/free/FreeReportBody";
import { getFreeReportUiStrings } from "@/components/results/free/freeReportUiStrings";
import type { LiteSection } from "@/lib/v2/lite/types";
import type { PrimaryAxesScores } from "@/lib/v2/survey/types";
import type { Locale } from "@/lib/i18n/locale";

const serifStyle = { fontFamily: "var(--font-stitch-serif)" } as const;

/**
 * 무료 미리보기("Current") 전체 페이지 버전 — 로버블 "Inner Compass Free"
 * 디자인 이식. 유료 심화 리포트(StitchDeepEssenceView)와 같은 stitch 크림
 * 톤을 써서 무료→유료 퍼널이 같은 비주얼 언어로 이어지게 했다.
 * 본문(미니 인디케이터·태그 섹션·업셀)은 FreeReportBody를 공유하며,
 * 대시보드 인라인 패널(StitchLiteResultPanel)도 같은 컴포넌트를 쓴다.
 */
export function StitchFreeReportView({
  title,
  oneLineSummary,
  axesScores,
  sections,
  locale,
  onUpsellClick,
}: {
  title: string;
  oneLineSummary: string;
  axesScores: PrimaryAxesScores;
  sections: {
    pattern: LiteSection;
    strength: LiteSection;
    growth: LiteSection;
    hint: LiteSection;
    action: LiteSection;
  };
  locale: Locale;
  onUpsellClick: () => void;
}) {
  const t = getFreeReportUiStrings(locale);

  return (
    <div className="stitch-hero-panel rounded-extra-large p-5 sm:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="border-primary text-primary inline-flex items-center rounded-full border px-2.5 py-1 text-[9.5px] font-semibold tracking-[0.2em] uppercase">
          {t.badge}
        </div>
        <h1
          className="mt-4 text-[26px] leading-tight text-on-surface sm:text-[30px]"
          style={serifStyle}
        >
          {title}
        </h1>

        <div className="mt-6">
          <FreeReportBody
            oneLineSummary={oneLineSummary}
            axesScores={axesScores}
            sections={[
              { section: sections.pattern, tag: t.currentSectionTags.pattern, tone: "ink" },
              { section: sections.strength, tag: t.currentSectionTags.strength, tone: "accent" },
              { section: sections.growth, tag: t.currentSectionTags.growth, tone: "highlight" },
              { section: sections.hint, tag: t.currentSectionTags.hint, tone: "gold" },
              { section: sections.action, tag: t.currentSectionTags.action, tone: "accent" },
            ]}
            locale={locale}
            t={t}
            onUpsellClick={onUpsellClick}
          />
        </div>
      </div>
    </div>
  );
}
