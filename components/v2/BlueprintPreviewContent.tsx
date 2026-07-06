"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/space/GlassCard";
import GlowButton from "@/components/space/GlowButton";
import DualAxisRadarChart, {
  BLUEPRINT_CURRENT_STROKE,
  BLUEPRINT_INNATE_STROKE,
} from "@/components/v2/DualAxisRadarChart";
import BlueprintLiteReportsSection from "@/components/v2/BlueprintLiteReportsSection";
import { PRIMARY_AXIS_LABELS } from "@/lib/v2/framework/axisLabels";
import {
  buildBlueprintHookCopy,
} from "@/lib/v2/blueprint/hookCopy";
import { buildGapRows, gapDeltaTone } from "@/lib/v2/analysis/gap";
import type { BirthV2Session } from "@/lib/v2/onboarding/birthSession";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import type { InnateSelfLiteProfile } from "@/lib/v2/saju/innateLite";
import { clearSurveyV2Session } from "@/lib/v2/survey/session";
import { clearSurveyOnServer } from "@/lib/v2/survey/surveyClient";
import { clearLiteReports } from "@/lib/v2/lite/session";
import InnateDeepEntryButton from "@/components/v2/InnateDeepEntryButton";

export default function BlueprintPreviewContent({
  reportId,
  current,
  innate,
  birth,
  birthTimeUnknown,
}: {
  reportId: string;
  current: CurrentSelfProfile;
  innate: InnateSelfLiteProfile;
  birth: BirthV2Session;
  birthTimeUnknown: boolean;
}) {
  const router = useRouter();
  const gapRows = buildGapRows(current.primary_axes, innate.primary_axes);
  const hook = buildBlueprintHookCopy({
    current: current.primary_axes,
    innate: innate.primary_axes,
    gapRows,
    primaryConcern: current.personalization.primary_concern,
  });

  const handleRedoSurvey = useCallback(async () => {
    if (
      !window.confirm(
        "설문을 다시 하면 기존 답변과 지금의 나 리포트가 초기화돼요. 계속할까요?",
      )
    ) {
      return;
    }
    clearSurveyV2Session(reportId);
    clearLiteReports(reportId);
    await clearSurveyOnServer(reportId);
    router.push(`/survey-v2?redo=1`);
  }, [reportId, router]);

  return (
    <div className="w-full max-w-lg space-y-6 pb-16">
      <header className="space-y-2 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#67B7FF]">
          Free Blueprint
        </p>
        <h1 className="text-balance text-xl font-semibold text-[rgba(255,255,255,0.95)]">
          나의 Blueprint 미리보기
        </h1>
        <p className="text-sm leading-relaxed text-[rgba(255,255,255,0.55)]">
          <span style={{ color: BLUEPRINT_CURRENT_STROKE }}>Current</span>
          <span className="text-white/35"> · </span>
          <span style={{ color: BLUEPRINT_INNATE_STROKE }}>Innate</span>
          를 한눈에 겹쳐 비교했어요.
        </p>
        {birthTimeUnknown ? (
          <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs leading-relaxed text-amber-100/90">
            출생 시간을 모르는 상태로 계산했어요. 시간을 알게 되면 더 정밀한
            Innate 분석이 가능해요.
          </p>
        ) : null}
      </header>

      <GlassCard className="space-y-5 !py-6">
        <DualAxisRadarChart
          current={current.primary_axes}
          innate={innate.primary_axes}
        />

        <div className="space-y-2 rounded-2xl border border-[#67B7FF]/20 bg-gradient-to-b from-[#67B7FF]/10 to-transparent px-4 py-4 text-center">
          <p className="text-balance text-[15px] font-semibold leading-snug text-[rgba(255,255,255,0.95)]">
            {hook.headline}
          </p>
          <p className="text-sm leading-relaxed text-[rgba(255,255,255,0.72)]">
            {hook.subline}
          </p>
          <p className="text-xs leading-relaxed text-[#8ecfff]/90">
            {hook.teaser}
          </p>
        </div>

        <BlueprintLiteReportsSection
          reportId={reportId}
          profile={current}
          birth={birth}
        />

        <div className="space-y-3 border-t border-white/10 pt-4">
          <InnateDeepEntryButton reportId={reportId} featured />
        </div>

        <div className="border-t border-white/10 pt-4">
          <div className="mb-3 grid grid-cols-[1fr_auto_auto_auto] gap-2 px-1 text-[10px] font-medium uppercase tracking-wide text-[rgba(255,255,255,0.45)]">
            <span>축</span>
            <span
              className="text-right"
              style={{ color: BLUEPRINT_CURRENT_STROKE }}
            >
              Current
            </span>
            <span
              className="text-right"
              style={{ color: BLUEPRINT_INNATE_STROKE }}
            >
              Innate
            </span>
            <span className="text-right">Gap</span>
          </div>
          <ul className="space-y-2">
            {gapRows.map((row) => {
              const tone = gapDeltaTone(row.absDelta);
              const sign = row.delta > 0 ? "+" : "";
              return (
                <li
                  key={row.axis}
                  className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-sm"
                >
                  <span className="min-w-0 text-[rgba(255,255,255,0.82)]">
                    {PRIMARY_AXIS_LABELS[row.axis]}
                  </span>
                  <span
                    className="tabular-nums font-medium"
                    style={{ color: BLUEPRINT_CURRENT_STROKE }}
                  >
                    {row.current}
                  </span>
                  <span
                    className="tabular-nums font-medium"
                    style={{ color: BLUEPRINT_INNATE_STROKE }}
                  >
                    {row.innate}
                  </span>
                  <span
                    className={`tabular-nums text-xs font-medium ${
                      tone === "wide"
                        ? "text-white/75"
                        : "text-[rgba(255,255,255,0.4)]"
                    }`}
                  >
                    {sign}
                    {row.delta}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </GlassCard>

      <p className="text-center space-y-2">
        <button
          type="button"
          className="block w-full text-xs text-white/45 underline-offset-2 hover:text-white/65 hover:underline"
          onClick={() =>
            router.push(
              `/account#birth`,
            )
          }
        >
          출생 정보 수정은 계정 → 출생 정보에서
        </button>
        <button
          type="button"
          className="block w-full text-xs text-white/45 underline-offset-2 hover:text-white/65 hover:underline"
          onClick={() => void handleRedoSurvey()}
        >
          설문 다시하기
        </button>
      </p>
    </div>
  );
}
