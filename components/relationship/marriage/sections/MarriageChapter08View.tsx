import React from "react";
import type { MarriageChapter08Intelligence } from "@/lib/relationship/marriage/marriageChapter08Intelligence";
import { User, Calendar, ShieldAlert, HeartHandshake } from "lucide-react";

type Props = {
  ch08?: MarriageChapter08Intelligence;
  canonicalNames: [string, string];
  isEn?: boolean;
};

// Deep Forest Green matching existing Marriage Report design system (#1b3b2b)
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
 * FINAL 5-SECTION IA:
 * 01. 지금 우리는 어떤 시기를 지나고 있을까?
 * 02. 올해 우리 관계에서 무엇이 중요해질까?
 * 03. 앞으로 3년, 우리 관계의 흐름
 * 04. 우리에게 찾아오는 가장 중요한 변곡점
 * 05. 이 흐름을 우리 편으로 만드는 법
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
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="rounded-xl border border-[#e6e2dc] bg-[#f9f8f6] p-4 text-[#2c2b29] shadow-2xs">
        <p className="text-xs sm:text-sm font-medium leading-relaxed">{introSentence}</p>
      </div>

      {/* 01. 지금 우리는 어떤 시기를 지나고 있을까? */}
      <div className="rounded-xl border border-[#e6e2dc] bg-white p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-[#f0ede6] pb-3">
          <span className="text-base font-bold text-[#1b3b2b]">◤ 01.</span>
          <h3 className="text-base font-bold text-[#2c2b29]">
            지금 우리는 어떤 시기를 지나고 있을까?
          </h3>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {/* Person A */}
          <div className="rounded-lg border border-[#e6e2dc]/80 bg-[#f9f8f6] p-4 space-y-2">
            <div className="flex items-center gap-1.5 border-b border-[#e6e2dc]/40 pb-2">
              <PersonBadge />
              <span className="text-xs font-bold text-[#2c2b29]">{nameA}님</span>
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
              <PersonBadge />
              <span className="text-xs font-bold text-[#2c2b29]">{nameB}님</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#1b3b2b]">
              {section01CurrentPeriod.personB.headline}
            </p>
            <p className="text-xs leading-relaxed text-[#5e5b56]">
              {section01CurrentPeriod.personB.description}
            </p>
          </div>
        </div>

        {/* 우리 둘의 흐름 */}
        <div className="rounded-lg border border-[#d6e2d8] bg-[#f4f7f4] p-4 space-y-1">
          <div className="text-[11px] font-bold text-[#1b3b2b]">
            우리 둘의 흐름
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#2c2b29]">
            {section01CurrentPeriod.pair.headline}
          </p>
          <p className="text-xs leading-relaxed text-[#5e5b56]">
            {section01CurrentPeriod.pair.description}
          </p>
        </div>
      </div>

      {/* 02. 올해 우리 관계에서 무엇이 중요해질까? */}
      <div className="rounded-xl border border-[#e6e2dc] bg-white p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-[#f0ede6] pb-3">
          <span className="text-base font-bold text-[#1b3b2b]">◤ 02.</span>
          <h3 className="text-base font-bold text-[#2c2b29]">
            올해 우리 관계에서 무엇이 중요해질까?
          </h3>
        </div>

        <div className="space-y-2.5">
          {section02RelationshipThemes.map((theme, idx) => (
            <div
              key={theme.id}
              className="flex items-start gap-3 rounded-lg border border-[#e6e2dc]/80 bg-[#f9f8f6] p-3.5"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#1b3b2b]/10 text-xs font-bold text-[#1b3b2b]">
                0{idx + 1}
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-[#2c2b29]">
                  {theme.title}
                </h4>
                <p className="text-xs leading-relaxed text-[#5e5b56]">
                  {theme.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 03. 앞으로 3년, 우리 관계의 흐름 */}
      <div className="rounded-xl border border-[#e6e2dc] bg-white p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-[#f0ede6] pb-3">
          <span className="text-base font-bold text-[#1b3b2b]">◤ 03.</span>
          <h3 className="text-base font-bold text-[#2c2b29]">
            앞으로 3년, 우리 관계의 흐름
          </h3>
        </div>

        <div className="space-y-3">
          {section03ThreeYearForecast.map((card) => (
            <div
              key={card.year}
              className="rounded-lg border border-[#e6e2dc] bg-[#f9f8f6] p-4 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[#e6e2dc]/60 pb-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#1b3b2b]" />
                  <span className="text-sm font-extrabold text-[#2c2b29]">
                    {card.year}년
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {card.badge && (
                    <span className="rounded-full bg-[#1b3b2b]/10 px-2 py-0.5 text-[10px] font-bold text-[#1b3b2b]">
                      {card.badge}
                    </span>
                  )}
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#2c2b29] border border-[#e6e2dc]">
                    {card.yearLabel}
                  </span>
                </div>
              </div>

              <div className="grid gap-2.5 text-xs md:grid-cols-3">
                <div className="rounded-md bg-white p-3 border border-[#e6e2dc]/50">
                  <span className="font-bold text-[#2c2b29]">{card.personA.name}님</span>
                  <p className="mt-1 leading-relaxed text-[#5e5b56]">{card.personA.summary}</p>
                </div>
                <div className="rounded-md bg-white p-3 border border-[#e6e2dc]/50">
                  <span className="font-bold text-[#2c2b29]">{card.personB.name}님</span>
                  <p className="mt-1 leading-relaxed text-[#5e5b56]">{card.personB.summary}</p>
                </div>
                <div className="rounded-md bg-[#f4f7f4] p-3 border border-[#d6e2d8]">
                  <span className="font-bold text-[#1b3b2b]">우리 둘의 호흡</span>
                  <p className="mt-1 leading-relaxed text-[#2c2b29]">{card.pair.summary}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 04. 우리에게 찾아오는 가장 중요한 변곡점 */}
      {section04TurningPoint && (
        <div className="rounded-xl border border-[#d6e2d8] bg-[#f4f7f4]/80 p-5 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-[#d6e2d8] pb-3">
            <ShieldAlert className="h-4 w-4 text-[#1b3b2b]" />
            <span className="text-base font-bold text-[#1b3b2b]">◤ 04.</span>
            <h3 className="text-base font-bold text-[#2c2b29]">
              우리에게 찾아오는 가장 중요한 변곡점 ({section04TurningPoint.year}년)
            </h3>
          </div>

          <h4 className="text-sm font-bold text-[#1b3b2b]">
            {section04TurningPoint.headline}
          </h4>
          <p className="text-xs leading-relaxed text-[#5e5b56]">
            {section04TurningPoint.reason}
          </p>

          <div className="mt-3 grid gap-2.5 text-xs md:grid-cols-3">
            <div className="rounded-md bg-white p-3 border border-[#e6e2dc]">
              <span className="font-bold text-[#2c2b29]">{nameA}님에게</span>
              <p className="mt-1 leading-relaxed text-[#5e5b56]">{section04TurningPoint.forPersonA}</p>
            </div>
            <div className="rounded-md bg-white p-3 border border-[#e6e2dc]">
              <span className="font-bold text-[#2c2b29]">{nameB}님에게</span>
              <p className="mt-1 leading-relaxed text-[#5e5b56]">{section04TurningPoint.forPersonB}</p>
            </div>
            <div className="rounded-md bg-[#1b3b2b]/10 p-3 border border-[#1b3b2b]/20">
              <span className="font-bold text-[#1b3b2b]">우리 부부에게</span>
              <p className="mt-1 leading-relaxed text-[#2c2b29]">{section04TurningPoint.forPair}</p>
            </div>
          </div>
        </div>
      )}

      {/* 05. 이 흐름을 우리 편으로 만드는 법 */}
      <div className="rounded-xl border border-[#e6e2dc] bg-white p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-[#f0ede6] pb-3">
          <HeartHandshake className="h-4 w-4 text-[#1b3b2b]" />
          <span className="text-base font-bold text-[#1b3b2b]">◤ 05.</span>
          <h3 className="text-base font-bold text-[#2c2b29]">
            이 흐름을 우리 편으로 만드는 법
          </h3>
        </div>

        <div className="space-y-2.5">
          <div className="rounded-lg border border-[#e6e2dc]/80 bg-[#f9f8f6] p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2c2b29]">
              <PersonBadge />
              {section05ActionGuide.forPersonA.name}님이 기억하면 좋은 것
            </div>
            <p className="text-xs leading-relaxed text-[#5e5b56]">
              {section05ActionGuide.forPersonA.advice}
            </p>
          </div>

          <div className="rounded-lg border border-[#e6e2dc]/80 bg-[#f9f8f6] p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2c2b29]">
              <PersonBadge />
              {section05ActionGuide.forPersonB.name}님이 기억하면 좋은 것
            </div>
            <p className="text-xs leading-relaxed text-[#5e5b56]">
              {section05ActionGuide.forPersonB.advice}
            </p>
          </div>

          <div className="rounded-lg border border-[#d6e2d8] bg-[#f4f7f4] p-3.5 space-y-1">
            <div className="text-xs font-bold text-[#1b3b2b]">
              우리 둘이 함께 기억할 것
            </div>
            <p className="text-xs leading-relaxed text-[#2c2b29]">
              {section05ActionGuide.forPair.advice}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
