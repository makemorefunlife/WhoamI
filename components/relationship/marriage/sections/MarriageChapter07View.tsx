"use client";

import React from "react";
import type { MarriageChapter07Intelligence } from "@/lib/relationship/marriage/marriageChapter07Intelligence";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface Props {
  ch07?: MarriageChapter07Intelligence;
  canonicalNames: [string, string];
  isEn?: boolean;
}

/**
 * Marriage Chapter 07 Renderer.
 * "왜 싸우고, 어떻게 다시 가까워질까?"
 * DESIGN UNIFICATION: Subtitles render OUTSIDE and ABOVE content blocks.
 * Content renders inside separate dedicated white blocks underneath.
 */
export function MarriageChapter07View({ ch07, canonicalNames, isEn }: Props) {
  if (!ch07) return null;

  const {
    introNarrative,
    section01_journey,
    section02_conflictLoop,
    section03_hurtPoint,
    section04_repair,
    section05_expectationsToRelease,
    section06_relationshipProtection,
    section07_directionalActions,
  } = ch07;

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      {introNarrative ? (
        <div className="rounded-xl border border-[#e6e2dc] bg-[#f9f8f6] p-4 text-xs text-[#5e5b56] leading-relaxed">
          {introNarrative}
        </div>
      ) : null}

      {/* 01. 싸우고 서운할 때, 나는 어떻게 변할까? */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <span className="text-base font-bold text-[#1b3b2b]">◤ 01.</span>
          <h3 className="text-base sm:text-lg font-bold text-[#2c2b29]">
            {isEn ? "How do we each change when we fight or feel hurt?" : "싸우고 서운할 때, 나는 어떻게 변할까?"}
          </h3>
        </div>
        <div className="rounded-xl border border-[#e6e2dc] bg-white p-5 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[section01_journey.personA, section01_journey.personB].map((journey, idx) => (
              <div key={idx} className="rounded-lg border border-[#e6e2dc]/80 bg-[#f9f8f6] p-4 space-y-3">
                <div className="text-xs font-bold text-[#2c2b29] border-b border-[#e6e2dc]/50 pb-2">
                  {isEn ? `${journey.personName}'s conflict response and inner signals` : `${journey.personName}님의 갈등 반응 및 내면 신호`}
                </div>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="font-bold text-[#2d5a44] block mb-0.5">{isEn ? "Normally" : "평소"}</span>
                    <p className="text-[#5e5b56] leading-relaxed">{journey.baseline}</p>
                  </div>
                  <div>
                    <span className="font-bold text-[#8c7561] block mb-0.5">{isEn ? "When something feels off" : "서운함이 생기면"}</span>
                    <p className="text-[#5e5b56] leading-relaxed">{journey.activation}</p>
                  </div>
                  <div>
                    <span className="font-bold text-[#c1443a] block mb-0.5">{isEn ? "When it builds up" : "감정이 쌓이면"}</span>
                    <p className="text-[#5e5b56] leading-relaxed">{journey.overload}</p>
                  </div>
                  {journey.outerGap ? (
                    <div className="bg-white/80 p-2.5 rounded border border-[#e6e2dc]/60">
                      <span className="font-bold text-[#8c6b3b] block mb-0.5">{isEn ? "How it looks from outside" : "겉으로 보이는 모습"}</span>
                      <p className="text-[#5e5b56] leading-relaxed">{journey.outerGap}</p>
                    </div>
                  ) : null}
                  <div className="pt-2 border-t border-[#e6e2dc]/50">
                    <span className="font-bold text-[#2f6b4f] block mb-0.5">{isEn ? "What they actually want" : "사실 원하는 것"}</span>
                    <p className="text-[#2c2b29] leading-relaxed font-medium">{journey.innerNeed}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 02. 그래서 우리는 왜 같은 싸움을 반복할까? */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <span className="text-base font-bold text-[#1b3b2b]">◤ 02.</span>
          <h3 className="text-base sm:text-lg font-bold text-[#2c2b29]">
            {isEn ? "So why do we keep having the same fight?" : "그래서 우리는 왜 같은 싸움을 반복할까?"}
          </h3>
        </div>
        <div className="rounded-xl border border-[#e6e2dc] bg-white p-5 space-y-4 shadow-2xs">
          <div className="rounded-lg bg-[#fdf6f5] border border-[#f5d0cc] p-4 space-y-2">
            <div className="text-xs sm:text-sm font-bold text-[#c1443a] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#c1443a] shrink-0" />
              {section02_conflictLoop.headline}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="rounded bg-white p-3 border border-[#e6e2dc]/60 space-y-1">
                <span className="font-bold text-[#2c2b29]">{section02_conflictLoop.personAStep.name}</span>
                <p className="text-[#5e5b56] leading-relaxed">{section02_conflictLoop.personAStep.flow}</p>
              </div>
              <div className="rounded bg-white p-3 border border-[#e6e2dc]/60 space-y-1">
                <span className="font-bold text-[#2c2b29]">{section02_conflictLoop.personBStep.name}</span>
                <p className="text-[#5e5b56] leading-relaxed">{section02_conflictLoop.personBStep.flow}</p>
              </div>
            </div>
          </div>

          {section02_conflictLoop.summary ? (
            <div className="rounded-lg bg-[#f4f7f4] p-3 text-xs text-[#2c2b29] border border-[#d6e2d8]">
              <span className="font-bold text-[#1b3b2b]">{isEn ? "[Conflict summary] " : "[갈등 요약] "}</span>
              {section02_conflictLoop.summary}
            </div>
          ) : null}
        </div>
      </div>

      {/* 03. 사실 싸움보다 더 아픈 건 이것 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <span className="text-base font-bold text-[#1b3b2b]">◤ 03.</span>
          <h3 className="text-base sm:text-lg font-bold text-[#2c2b29]">
            {isEn ? "What actually hurts more than the fight itself" : "사실 싸움보다 더 아픈 건 이것"}
          </h3>
        </div>
        <div className="rounded-xl border border-[#e6e2dc] bg-white p-5 space-y-4 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[section03_hurtPoint.personA, section03_hurtPoint.personB].map((hurt, idx) => (
              <div key={idx} className="rounded-lg border border-[#e6e2dc]/80 bg-[#f9f8f6] p-4 space-y-2">
                <span className="text-xs font-bold text-[#c1443a]">{isEn ? `${hurt.personName}'s main pain point` : `${hurt.personName}님의 주요 상처 지점`}</span>
                <h4 className="text-xs sm:text-sm font-bold text-[#2c2b29]">{hurt.headline}</h4>
                <p className="text-xs text-[#5e5b56] leading-relaxed pt-1">{hurt.description}</p>
              </div>
            ))}
          </div>

          {section03_hurtPoint.summary ? (
            <div className="rounded-lg bg-[#f4f7f4] p-3 text-xs text-[#2c2b29] border border-[#d6e2d8]">
              <span className="font-bold text-[#1b3b2b]">{isEn ? "[Hurt-point summary] " : "[서운함 요약] "}</span>
              {section03_hurtPoint.summary}
            </div>
          ) : null}
        </div>
      </div>

      {/* 04. 싸운 뒤, 어떻게 다시 가까워질까? */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <span className="text-base font-bold text-[#2f6b4f]">◤ 04.</span>
          <h3 className="text-base sm:text-lg font-bold text-[#2c2b29]">
            {isEn ? "After a fight, how do we get close again?" : "싸운 뒤, 어떻게 다시 가까워질까?"}
          </h3>
        </div>
        <div className="rounded-xl border border-[#e6e2dc] bg-white p-5 space-y-4 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[section04_repair.personA, section04_repair.personB].map((repair, idx) => (
              <div key={idx} className="rounded-lg border border-[#d6e2d8] bg-[#f4f7f4] p-4 space-y-2">
                <span className="text-xs font-bold text-[#2f6b4f]">{isEn ? `${repair.personName}'s repair guide` : `${repair.personName}님 맞춤 회복 가이드`}</span>
                <div className="text-xs space-y-1 pt-1">
                  <p><span className="font-bold text-[#2c2b29]">{isEn ? "1. Needed first:" : "1. 먼저 필요한 것:"}</span> <span className="text-[#5e5b56]">{repair.firstNeed}</span></p>
                  <p><span className="font-bold text-[#2c2b29]">{isEn ? "2. Needed next:" : "2. 그다음 필요한 것:"}</span> <span className="text-[#5e5b56]">{repair.nextNeed}</span></p>
                </div>
                <p className="text-xs text-[#2c2b29] leading-relaxed pt-2 border-t border-[#d6e2d8]">
                  {repair.howToApproach}
                </p>
              </div>
            ))}
          </div>

          {section04_repair.summary ? (
            <div className="rounded-lg bg-[#f4f7f4] p-3 text-xs text-[#2c2b29] border border-[#d6e2d8]">
              <span className="font-bold text-[#2f6b4f]">{isEn ? "[Repair point for you two] " : "[부부 회복 포인트] "}</span>
              {section04_repair.summary}
            </div>
          ) : null}
        </div>
      </div>

      {/* 05. 서로에게 기대하지 않는 게 좋은 것 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <span className="text-base font-bold text-[#1b3b2b]">◤ 05.</span>
          <h3 className="text-base sm:text-lg font-bold text-[#2c2b29]">
            {isEn ? "Expectations best let go of" : "서로에게 기대하지 않는 게 좋은 것"}
          </h3>
        </div>
        <div className="rounded-xl border border-[#e6e2dc] bg-white p-5 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              section05_expectationsToRelease.expectationAtoB,
              section05_expectationsToRelease.expectationBtoA,
            ].map((exp, idx) => (
              <div key={idx} className="rounded-lg border border-[#e6e2dc]/80 bg-[#f9f8f6] p-4 space-y-2">
                <span className="text-xs font-bold text-[#1b3b2b]">
                  {isEn ? `${exp.fromName} → for ${exp.toName}` : `${exp.fromName} ➔ ${exp.toName}에게`}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-[#2c2b29]">{exp.headline}</h4>
                <p className="text-xs text-[#5e5b56] leading-relaxed pt-1">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 06. 오래 함께할수록 지켜야 할 것 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <span className="text-base font-bold text-[#1b3b2b]">◤ 06.</span>
          <h3 className="text-base sm:text-lg font-bold text-[#2c2b29]">
            {isEn ? "What to protect the longer you're together" : "오래 함께할수록 지켜야 할 것"}
          </h3>
        </div>
        <div className="rounded-xl border border-[#e6e2dc] bg-white p-5 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#d6e2d8] bg-[#f4f7f4] p-3.5 space-y-1.5">
              <span className="text-[11px] font-bold text-[#2f6b4f]">
                {isEn ? "Protect" : "지켜야 할 것"}
              </span>
              <h4 className="text-xs font-bold text-[#2c2b29]">{section06_relationshipProtection.protectiveAsset.headline}</h4>
              <p className="text-[11px] text-[#5e5b56] leading-relaxed">
                {section06_relationshipProtection.protectiveAsset.description}
              </p>
            </div>

            <div className="rounded-lg border border-[#e6e2dc] bg-[#f9f8f6] p-3.5 space-y-1.5">
              <span className="text-[11px] font-bold text-[#1b3b2b]">
                {isEn ? "Rebalance" : "다시 조율할 것"}
              </span>
              <h4 className="text-xs font-bold text-[#2c2b29]">{section06_relationshipProtection.roleToRebalance.headline}</h4>
              <p className="text-[11px] text-[#5e5b56] leading-relaxed">
                {section06_relationshipProtection.roleToRebalance.description}
              </p>
            </div>

            <div className="rounded-lg border border-[#f5d0cc] bg-[#fdf6f5] p-3.5 space-y-1.5">
              <span className="text-[11px] font-bold text-[#c1443a]">
                {isEn ? "A shared boundary" : "서로 지켜야 할 선"}
              </span>
              <h4 className="text-xs font-bold text-[#2c2b29]">{section06_relationshipProtection.privacyBoundary.headline}</h4>
              <p className="text-[11px] text-[#5e5b56] leading-relaxed">
                {section06_relationshipProtection.privacyBoundary.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 07. 우리 부부 실전 사용설명서 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <span className="text-base font-bold text-[#1b3b2b]">◤ 07.</span>
          <h3 className="text-base sm:text-lg font-bold text-[#2c2b29]">
            {isEn ? "Your practical instruction manual" : "우리 부부 실전 사용설명서"}
          </h3>
        </div>
        <div className="rounded-xl border border-[#e6e2dc] bg-white p-5 space-y-4 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action A -> B */}
            <div className="rounded-lg border border-[#e6e2dc]/80 bg-[#f9f8f6] p-4 space-y-3">
              <div className="text-xs font-bold text-[#2c2b29] border-b border-[#e6e2dc]/50 pb-2">
                {isEn
                  ? `${section07_directionalActions.actionAtoB.actorName} → for ${section07_directionalActions.actionAtoB.targetName}`
                  : `${section07_directionalActions.actionAtoB.actorName} ➔ ${section07_directionalActions.actionAtoB.targetName}에게`}
              </div>
              {section07_directionalActions.actionAtoB.dos.length > 0 ? (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-[#2f6b4f] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2f6b4f]" /> {isEn ? "Do this" : "이건 해주세요"}
                  </span>
                  <ul className="space-y-1 text-xs text-[#2c2b29] pl-1">
                    {section07_directionalActions.actionAtoB.dos.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                        <span className="text-[#2f6b4f] font-bold shrink-0">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {section07_directionalActions.actionAtoB.donts.length > 0 ? (
                <div className="space-y-1.5 pt-2 border-t border-[#e6e2dc]/50">
                  <span className="text-[11px] font-bold text-[#c1443a] flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-[#c1443a]" /> {isEn ? "Avoid this" : "이건 피해주세요"}
                  </span>
                  <ul className="space-y-1 text-xs text-[#2c2b29] pl-1">
                    {section07_directionalActions.actionAtoB.donts.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                        <span className="text-[#c1443a] font-bold shrink-0">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {/* Action B -> A */}
            <div className="rounded-lg border border-[#e6e2dc]/80 bg-[#f9f8f6] p-4 space-y-3">
              <div className="text-xs font-bold text-[#2c2b29] border-b border-[#e6e2dc]/50 pb-2">
                {isEn
                  ? `${section07_directionalActions.actionBtoA.actorName} → for ${section07_directionalActions.actionBtoA.targetName}`
                  : `${section07_directionalActions.actionBtoA.actorName} ➔ ${section07_directionalActions.actionBtoA.targetName}에게`}
              </div>
              {section07_directionalActions.actionBtoA.dos.length > 0 ? (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-[#2f6b4f] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2f6b4f]" /> {isEn ? "Do this" : "이건 해주세요"}
                  </span>
                  <ul className="space-y-1 text-xs text-[#2c2b29] pl-1">
                    {section07_directionalActions.actionBtoA.dos.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                        <span className="text-[#2f6b4f] font-bold shrink-0">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {section07_directionalActions.actionBtoA.donts.length > 0 ? (
                <div className="space-y-1.5 pt-2 border-t border-[#e6e2dc]/50">
                  <span className="text-[11px] font-bold text-[#c1443a] flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-[#c1443a]" /> {isEn ? "Avoid this" : "이건 피해주세요"}
                  </span>
                  <ul className="space-y-1 text-xs text-[#2c2b29] pl-1">
                    {section07_directionalActions.actionBtoA.donts.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                        <span className="text-[#c1443a] font-bold shrink-0">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          {/* Shared Actions */}
          {section07_directionalActions.sharedActions ? (
            <div className="rounded-lg border border-[#d6e2d8] bg-[#f4f7f4] p-4 space-y-3">
              <div className="text-xs font-bold text-[#1b3b2b]">
                {isEn ? "Remember together" : "둘이 함께 기억할 것"}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {section07_directionalActions.sharedActions.dos.length > 0 ? (
                  <ul className="space-y-1.5 text-[#2c2b29]">
                    {section07_directionalActions.sharedActions.dos.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                        <span className="text-[#2f6b4f] font-bold shrink-0">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section07_directionalActions.sharedActions.donts.length > 0 ? (
                  <ul className="space-y-1.5 text-[#2c2b29]">
                    {section07_directionalActions.sharedActions.donts.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                        <span className="text-[#c1443a] font-bold shrink-0">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
