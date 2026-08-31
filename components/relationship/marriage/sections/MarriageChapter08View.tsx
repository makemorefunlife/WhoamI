import React from "react";
import type { MarriageChapter08Intelligence } from "@/lib/relationship/marriage/marriageChapter08Intelligence";
import { NameChip } from "@/components/relationship/shared/editorial/EditorialPrimitives";
import { User } from "lucide-react";

type Props = {
  ch08?: MarriageChapter08Intelligence;
  canonicalNames: [string, string];
  isEn?: boolean;
};

const ACCENT = "#1b3b2b";

function PersonBadge() {
  return (
    <span
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
    >
      <User className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
    </span>
  );
}

/**
 * Marriage Chapter 08 Renderer.
 * "앞으로 우리에게 어떤 시간이 찾아올까?"
 * DESIGN UNIFICATION: Subtitles render OUTSIDE and ABOVE content blocks.
 * Content renders inside separate dedicated white blocks underneath.
 */
export function MarriageChapter08View({ ch08, canonicalNames, isEn }: Props) {
  if (!ch08) return null;

  const [nameA, nameB] = canonicalNames;
  const {
    introSentence,
    section01CurrentPeriod,
    section02RelationshipThemes,
    section03ThreeYearForecast,
    section04TurningPoint,
    section05ActionGuide,
  } = ch08;

  return (
    <div className="space-y-8">
      {/* Intro Banner */}
      <div className="rounded-xl border border-[#e6e2dc] bg-[#f9f8f6] p-4 text-[#2c2b29] shadow-2xs">
        <p className="text-xs sm:text-sm font-medium leading-relaxed">{introSentence}</p>
      </div>

      {/* 01. 지금 우리는 어떤 시기를 지나고 있을까? */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <span className="text-base font-bold text-[#8c7c72]">◤ 01.</span>
          <h3 className="text-base sm:text-lg font-bold text-[#2c2b29]">
            {isEn ? "What season are we in right now?" : "지금 우리는 어떤 시기를 지나고 있을까?"}
          </h3>
        </div>
        <div className="rounded-xl border border-[#e6e2dc] bg-white p-5 space-y-4 shadow-2xs">
          <div className="grid gap-3 md:grid-cols-2">
            {/* Person A */}
            <div className="rounded-lg border border-[#e6e2dc]/80 bg-[#f9f8f6] p-4 space-y-2">
              <div className="flex items-center gap-1.5 border-b border-[#e6e2dc]/40 pb-2">
                <NameChip name={nameA} side="a" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#1b3b2b]">
                {section01CurrentPeriod.personA.headline}
              </p>
              <p className="text-xs leading-relaxed text-[#5e5b56]">
                {section01CurrentPeriod.personA.description}
              </p>
            </div>

            {/* Person B */}
            <div className="rounded-lg border border-[#e6e2dc]/80 bg-[#f9f8f6] p-4 space-y-2">
              <div className="flex items-center gap-1.5 border-b border-[#e6e2dc]/40 pb-2">
                <NameChip name={nameB} side="b" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#1b3b2b]">
                {section01CurrentPeriod.personB.headline}
              </p>
              <p className="text-xs leading-relaxed text-[#5e5b56]">
                {section01CurrentPeriod.personB.description}
              </p>
            </div>
          </div>

          {/* Pair Context */}
          <div className="rounded-lg border border-[#d6e2d8] bg-[#f4f7f4] p-3.5 space-y-1">
            <span className="text-xs font-bold text-[#1b3b2b]">
              {isEn ? `[Your shared flow] ${section01CurrentPeriod.pair.headline}` : `[우리 둘의 흐름] ${section01CurrentPeriod.pair.headline}`}
            </span>
            <p className="text-xs leading-relaxed text-[#5e5b56]">
              {section01CurrentPeriod.pair.description}
            </p>
          </div>
        </div>
      </div>

      {/* 02. 올해 우리 관계에서 무엇이 중요해질까? */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <span className="text-base font-bold text-[#1b3b2b]">◤ 02.</span>
          <h3 className="text-base sm:text-lg font-bold text-[#2c2b29]">
            {isEn ? "What will matter most in your relationship this year?" : "올해 우리 관계에서 무엇이 중요해질까?"}
          </h3>
        </div>
        <div className="rounded-xl border border-[#e6e2dc] bg-white p-5 space-y-3 shadow-2xs">
          {section02RelationshipThemes.map((theme, idx) => (
            <div
              key={theme.id}
              className="rounded-lg border border-[#e6e2dc]/80 bg-[#f9f8f6] p-4 space-y-1.5"
            >
              <span className="text-xs font-bold text-[#1b3b2b]">
                0{idx + 1}. {theme.title}
              </span>
              <p className="text-xs leading-relaxed text-[#5e5b56]">
                {theme.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 03. 앞으로 3년, 우리 관계의 흐름 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <span className="text-base font-bold text-[#1b3b2b]">◤ 03.</span>
          <h3 className="text-base sm:text-lg font-bold text-[#2c2b29]">
            {isEn ? "The next 3 years: how your relationship flows" : "앞으로 3년, 우리 관계의 흐름"}
          </h3>
        </div>
        <div className="rounded-xl border border-[#e6e2dc] bg-white p-5 space-y-4 shadow-2xs">
          <div className="grid gap-4 md:grid-cols-3">
            {section03ThreeYearForecast.map((fc) => (
              <div
                key={fc.year}
                className="rounded-lg border border-[#e6e2dc]/80 bg-[#f9f8f6] p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-[#e6e2dc]/50 pb-2">
                    <span className="font-serif text-sm font-bold text-[#1b3b2b]">
                      {isEn ? fc.year : `${fc.year}년`}
                    </span>
                    {fc.badge && (
                      <span className="rounded-full bg-[#1b3b2b]/10 px-2 py-0.5 text-[10px] font-semibold text-[#1b3b2b]">
                        {fc.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-[#2c2b29]">
                    {fc.yearLabel}
                  </p>

                  <div className="space-y-2 pt-1 text-[11px]">
                    <div>
                      <span className="font-semibold text-[#1b3b2b]">{isEn ? `${nameA}: ` : `${nameA}님: `}</span>
                      <span className="text-[#5e5b56]">{fc.personA.summary}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#1b3b2b]">{isEn ? `${nameB}: ` : `${nameB}님: `}</span>
                      <span className="text-[#5e5b56]">{fc.personB.summary}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded bg-white p-2.5 border border-[#e6e2dc]/60 text-[11px] mt-2">
                  <span className="font-semibold text-[#2f6b4f]">{isEn ? "Your shared rhythm: " : "우리 둘의 호흡: "}</span>
                  <span className="text-[#5e5b56]">{fc.pair.summary}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 04. 우리에게 찾아오는 가장 중요한 변곡점 */}
      {section04TurningPoint ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pt-1">
            <span className="text-base font-bold text-[#1b3b2b]">◤ 04.</span>
            <h3 className="text-base sm:text-lg font-bold text-[#2c2b29]">
              {isEn
                ? `The most important turning point ahead (${section04TurningPoint.year})`
                : `우리에게 찾아오는 가장 중요한 변곡점 (${section04TurningPoint.year}년)`}
            </h3>
          </div>
          <div className="rounded-xl border border-[#f5d0cc] bg-[#fdf6f5] p-5 space-y-4 shadow-2xs">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#c1443a]">
                {section04TurningPoint.headline}
              </h4>
              <p className="text-xs leading-relaxed text-[#5e5b56]">
                {section04TurningPoint.reason}
              </p>
            </div>

            <div className="grid gap-3 text-xs md:grid-cols-3">
              <div className="rounded-lg bg-white p-3 border border-[#f5d0cc]/80 space-y-1">
                <span className="font-semibold text-[#c1443a]">{isEn ? `For ${nameA}` : `${nameA}님에게`}</span>
                <p className="text-[#5e5b56] leading-relaxed">
                  {section04TurningPoint.forPersonA}
                </p>
              </div>
              <div className="rounded-lg bg-white p-3 border border-[#f5d0cc]/80 space-y-1">
                <span className="font-semibold text-[#c1443a]">{isEn ? `For ${nameB}` : `${nameB}님에게`}</span>
                <p className="text-[#5e5b56] leading-relaxed">
                  {section04TurningPoint.forPersonB}
                </p>
              </div>
              <div className="rounded-lg bg-white p-3 border border-[#f5d0cc]/80 space-y-1">
                <span className="font-semibold text-[#1b3b2b]">{isEn ? "For you as a couple" : "우리 부부에게"}</span>
                <p className="text-[#5e5b56] leading-relaxed">
                  {section04TurningPoint.forPair}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 05. 이 흐름을 우리 편으로 만드는 법 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <span className="text-base font-bold text-[#1b3b2b]">◤ 05.</span>
          <h3 className="text-base sm:text-lg font-bold text-[#2c2b29]">
            {isEn ? "How to make this flow work for you" : "이 흐름을 우리 편으로 만드는 법"}
          </h3>
        </div>
        <div className="rounded-xl border border-[#e6e2dc] bg-white p-5 space-y-4 shadow-2xs">
          <div className="grid gap-3 text-xs md:grid-cols-2">
            <div className="rounded-lg border border-[#e6e2dc]/80 bg-[#f9f8f6] p-3.5 space-y-1">
              <span className="font-bold text-[#1b3b2b]">
                {isEn ? `Worth remembering for ${section05ActionGuide.forPersonA.name}` : `${section05ActionGuide.forPersonA.name}님이 기억하면 좋은 것`}
              </span>
              <p className="text-[#5e5b56] leading-relaxed">
                {section05ActionGuide.forPersonA.advice}
              </p>
            </div>

            <div className="rounded-lg border border-[#e6e2dc]/80 bg-[#f9f8f6] p-3.5 space-y-1">
              <span className="font-bold text-[#1b3b2b]">
                {isEn ? `Worth remembering for ${section05ActionGuide.forPersonB.name}` : `${section05ActionGuide.forPersonB.name}님이 기억하면 좋은 것`}
              </span>
              <p className="text-[#5e5b56] leading-relaxed">
                {section05ActionGuide.forPersonB.advice}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[#d6e2d8] bg-[#f4f7f4] p-4 text-xs space-y-1">
            <span className="font-bold text-[#2f6b4f]">
              {isEn ? "Worth remembering together" : "우리 둘이 함께 기억할 것"}
            </span>
            <p className="text-[#5e5b56] leading-relaxed">
              {section05ActionGuide.forPair.advice}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
