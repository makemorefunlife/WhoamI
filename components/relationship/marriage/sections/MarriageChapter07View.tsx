"use client";

import React from "react";
import type { MarriageChapter07Intelligence } from "@/lib/relationship/marriage/marriageChapter07Intelligence";
import { MessageCircle, CheckCircle2, XCircle, ShieldCheck, HeartHandshake, AlertCircle } from "lucide-react";

interface Props {
  ch07?: MarriageChapter07Intelligence;
  canonicalNames: [string, string];
  isEn?: boolean;
}

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
    <div className="space-y-6">
      {/* Intro Header */}
      {introNarrative ? (
        <div className="rounded-xl border border-rel-line bg-rel-surface-soft p-4 text-xs text-rel-ink-soft leading-relaxed">
          {introNarrative}
        </div>
      ) : null}

      {/* 01. 싸우고 서운할 때, 나는 어떻게 변할까? */}
      <div className="rounded-xl border border-rel-line bg-rel-surface p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-rel-line pb-3">
          <span className="text-base font-bold text-rel-accent">◤ 01.</span>
          <h3 className="text-base font-bold text-rel-ink">싸우고 서운할 때, 나는 어떻게 변할까?</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[section01_journey.personA, section01_journey.personB].map((journey, idx) => (
            <div key={idx} className="rounded-lg border border-rel-line/70 bg-rel-surface-soft p-4 space-y-3">
              <div className="text-sm font-bold text-rel-ink border-b border-rel-line/40 pb-2">
                👤 {journey.personName}님의 갈등 반응 및 내면 신호
              </div>
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="font-semibold text-rel-accent block mb-0.5">🔹 평소</span>
                  <p className="text-rel-ink-soft leading-relaxed">{journey.baseline}</p>
                </div>
                <div>
                  <span className="font-semibold text-rel-accent block mb-0.5">⚡ 서운함이 생기면</span>
                  <p className="text-rel-ink-soft leading-relaxed">{journey.activation}</p>
                </div>
                <div>
                  <span className="font-semibold text-v4-bad block mb-0.5">🔥 더 쌓이면</span>
                  <p className="text-rel-ink-soft leading-relaxed">{journey.overload}</p>
                </div>
                {journey.outerGap ? (
                  <div className="bg-rel-surface/60 p-2.5 rounded border border-rel-line/40">
                    <span className="font-semibold text-amber-700 block mb-0.5">🎭 겉으로는 이렇게 보여도</span>
                    <p className="text-rel-ink-soft leading-relaxed">{journey.outerGap}</p>
                  </div>
                ) : null}
                <div className="pt-1.5 border-t border-rel-line/40">
                  <span className="font-semibold text-v4-good block mb-0.5">🌱 사실 원하는 것</span>
                  <p className="text-rel-ink leading-relaxed font-medium">{journey.innerNeed}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 02. 그래서 우리는 왜 같은 싸움을 반복할까? */}
      <div className="rounded-xl border border-rel-line bg-rel-surface p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-rel-line pb-3">
          <span className="text-base font-bold text-rel-accent">◤ 02.</span>
          <h3 className="text-base font-bold text-rel-ink">그래서 우리는 왜 같은 싸움을 반복할까?</h3>
        </div>

        <div className="rounded-lg bg-v4-bad-soft/30 border border-v4-bad/30 p-4 space-y-2">
          <div className="text-sm font-bold text-v4-bad flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-v4-bad shrink-0" />
            {section02_conflictLoop.headline}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="rounded bg-rel-surface p-3 border border-rel-line/50 space-y-1">
              <span className="font-bold text-rel-ink">{section02_conflictLoop.personAStep.name}</span>
              <p className="text-rel-ink-soft leading-relaxed">{section02_conflictLoop.personAStep.flow}</p>
            </div>
            <div className="rounded bg-rel-surface p-3 border border-rel-line/50 space-y-1">
              <span className="font-bold text-rel-ink">{section02_conflictLoop.personBStep.name}</span>
              <p className="text-rel-ink-soft leading-relaxed">{section02_conflictLoop.personBStep.flow}</p>
            </div>
          </div>
        </div>

        {section02_conflictLoop.summary ? (
          <div className="rounded-lg bg-rel-accent/5 p-3 text-xs text-rel-ink border border-rel-accent/20">
            <span className="font-bold text-rel-accent">💡 [한 줄 정리] </span>
            {section02_conflictLoop.summary}
          </div>
        ) : null}
      </div>

      {/* 03. 사실 싸움보다 더 아픈 건 이것 */}
      <div className="rounded-xl border border-rel-line bg-rel-surface p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-rel-line pb-3">
          <span className="text-base font-bold text-rel-accent">◤ 03.</span>
          <h3 className="text-base font-bold text-rel-ink">사실 싸움보다 더 아픈 건 이것</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[section03_hurtPoint.personA, section03_hurtPoint.personB].map((hurt, idx) => (
            <div key={idx} className="rounded-lg border border-rel-line/70 bg-rel-surface-soft p-4 space-y-2">
              <span className="text-xs font-bold text-rel-accent">💔 {hurt.personName}님의 가장 큰 상처</span>
              <h4 className="text-sm font-bold text-rel-ink">{hurt.headline}</h4>
              <p className="text-xs text-rel-ink-soft leading-relaxed pt-1">{hurt.description}</p>
            </div>
          ))}
        </div>

        {section03_hurtPoint.summary ? (
          <div className="rounded-lg bg-rel-accent/5 p-3 text-xs text-rel-ink border border-rel-accent/20">
            <span className="font-bold text-rel-accent">💡 [한 줄 정리] </span>
            {section03_hurtPoint.summary}
          </div>
        ) : null}
      </div>

      {/* 04. 싸운 뒤, 어떻게 다시 가까워질까? */}
      <div className="rounded-xl border border-rel-line bg-rel-surface p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-rel-line pb-3">
          <span className="text-base font-bold text-v4-good">◤ 04.</span>
          <h3 className="text-base font-bold text-rel-ink">싸운 뒤, 어떻게 다시 가까워질까?</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[section04_repair.personA, section04_repair.personB].map((repair, idx) => (
            <div key={idx} className="rounded-lg border border-v4-good/30 bg-v4-good-soft/20 p-4 space-y-2">
              <span className="text-xs font-bold text-v4-good">🌱 {repair.personName}님 맞춤 회복 가이드</span>
              <div className="text-xs space-y-1 pt-1">
                <p><span className="font-semibold text-rel-ink">1. 먼저 필요한 것:</span> <span className="text-rel-ink-soft">{repair.firstNeed}</span></p>
                <p><span className="font-semibold text-rel-ink">2. 그다음 필요한 것:</span> <span className="text-rel-ink-soft">{repair.nextNeed}</span></p>
              </div>
              <p className="text-xs text-rel-ink-soft leading-relaxed pt-1.5 border-t border-v4-good/20">
                👉 {repair.howToApproach}
              </p>
            </div>
          ))}
        </div>

        {section04_repair.summary ? (
          <div className="rounded-lg bg-v4-good-soft/40 p-3 text-xs text-rel-ink border border-v4-good/30">
            <span className="font-bold text-v4-good">🤝 [우리 둘의 회복 포인트] </span>
            {section04_repair.summary}
          </div>
        ) : null}
      </div>

      {/* 05. 서로에게 기대하지 않는 게 좋은 것 */}
      <div className="rounded-xl border border-rel-line bg-rel-surface p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-rel-line pb-3">
          <span className="text-base font-bold text-rel-accent">◤ 05.</span>
          <h3 className="text-base font-bold text-rel-ink">서로에게 기대하지 않는 게 좋은 것</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            section05_expectationsToRelease.expectationAtoB,
            section05_expectationsToRelease.expectationBtoA,
          ].map((exp, idx) => (
            <div key={idx} className="rounded-lg border border-rel-line/70 bg-rel-surface-soft p-4 space-y-2">
              <span className="text-xs font-bold text-rel-accent">
                {exp.fromName} ➔ {exp.toName}에게
              </span>
              <h4 className="text-sm font-bold text-rel-ink">{exp.headline}</h4>
              <p className="text-xs text-rel-ink-soft leading-relaxed pt-1">{exp.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 06. 오래 함께할수록 지켜야 할 것 */}
      <div className="rounded-xl border border-rel-line bg-rel-surface p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-rel-line pb-3">
          <span className="text-base font-bold text-rel-accent">◤ 06.</span>
          <h3 className="text-base font-bold text-rel-ink">오래 함께할수록 지켜야 할 것</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-rel-line/60 bg-rel-surface-soft p-3.5 space-y-1.5">
            <span className="text-[11px] font-bold text-v4-good flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-v4-good" /> 지켜야 할 것
            </span>
            <h4 className="text-xs font-bold text-rel-ink">{section06_relationshipProtection.protectiveAsset.headline}</h4>
            <p className="text-[11px] text-rel-ink-soft leading-relaxed">
              {section06_relationshipProtection.protectiveAsset.description}
            </p>
          </div>

          <div className="rounded-lg border border-rel-line/60 bg-rel-surface-soft p-3.5 space-y-1.5">
            <span className="text-[11px] font-bold text-rel-accent flex items-center gap-1">
              🔄 다시 조율할 것
            </span>
            <h4 className="text-xs font-bold text-rel-ink">{section06_relationshipProtection.roleToRebalance.headline}</h4>
            <p className="text-[11px] text-rel-ink-soft leading-relaxed">
              {section06_relationshipProtection.roleToRebalance.description}
            </p>
          </div>

          <div className="rounded-lg border border-rel-line/60 bg-rel-surface-soft p-3.5 space-y-1.5">
            <span className="text-[11px] font-bold text-v4-bad flex items-center gap-1">
              🚧 서로 지켜야 할 선
            </span>
            <h4 className="text-xs font-bold text-rel-ink">{section06_relationshipProtection.privacyBoundary.headline}</h4>
            <p className="text-[11px] text-rel-ink-soft leading-relaxed">
              {section06_relationshipProtection.privacyBoundary.description}
            </p>
          </div>
        </div>
      </div>

      {/* 07. 우리 부부 실전 사용설명서 */}
      <div className="rounded-xl border border-rel-line bg-rel-surface p-5 space-y-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-rel-line pb-3">
          <span className="text-base font-bold text-rel-accent">◤ 07.</span>
          <h3 className="text-base font-bold text-rel-ink">우리 부부 실전 사용설명서</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Action A -> B */}
          <div className="rounded-lg border border-rel-line bg-rel-surface-soft p-4 space-y-3">
            <div className="text-xs font-bold text-rel-ink border-b border-rel-line/40 pb-2">
              👉 {section07_directionalActions.actionAtoB.actorName} ➔ {section07_directionalActions.actionAtoB.targetName}에게
            </div>
            {section07_directionalActions.actionAtoB.dos.length > 0 ? (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-v4-good flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-v4-good" /> 이건 해주세요
                </span>
                <ul className="space-y-1 text-xs text-rel-ink pl-1">
                  {section07_directionalActions.actionAtoB.dos.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-v4-good font-bold shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {section07_directionalActions.actionAtoB.donts.length > 0 ? (
              <div className="space-y-1.5 pt-2 border-t border-rel-line/30">
                <span className="text-[11px] font-bold text-v4-bad flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-v4-bad" /> 이건 피해주세요
                </span>
                <ul className="space-y-1 text-xs text-rel-ink pl-1">
                  {section07_directionalActions.actionAtoB.donts.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-v4-bad font-bold shrink-0">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Action B -> A */}
          <div className="rounded-lg border border-rel-line bg-rel-surface-soft p-4 space-y-3">
            <div className="text-xs font-bold text-rel-ink border-b border-rel-line/40 pb-2">
              👉 {section07_directionalActions.actionBtoA.actorName} ➔ {section07_directionalActions.actionBtoA.targetName}에게
            </div>
            {section07_directionalActions.actionBtoA.dos.length > 0 ? (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-v4-good flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-v4-good" /> 이건 해주세요
                </span>
                <ul className="space-y-1 text-xs text-rel-ink pl-1">
                  {section07_directionalActions.actionBtoA.dos.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-v4-good font-bold shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {section07_directionalActions.actionBtoA.donts.length > 0 ? (
              <div className="space-y-1.5 pt-2 border-t border-rel-line/30">
                <span className="text-[11px] font-bold text-v4-bad flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-v4-bad" /> 이건 피해주세요
                </span>
                <ul className="space-y-1 text-xs text-rel-ink pl-1">
                  {section07_directionalActions.actionBtoA.donts.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-v4-bad font-bold shrink-0">✕</span>
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
          <div className="rounded-lg border border-rel-accent/30 bg-rel-accent/5 p-4 space-y-3">
            <div className="text-xs font-bold text-rel-accent">
              🤝 둘이 함께 기억할 것
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {section07_directionalActions.sharedActions.dos.length > 0 ? (
                <ul className="space-y-1.5 text-rel-ink">
                  {section07_directionalActions.sharedActions.dos.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-v4-good font-bold shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {section07_directionalActions.sharedActions.donts.length > 0 ? (
                <ul className="space-y-1.5 text-rel-ink">
                  {section07_directionalActions.sharedActions.donts.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-v4-bad font-bold shrink-0">✕</span>
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
  );
}
