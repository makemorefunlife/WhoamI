"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlowButton from "@/components/space/GlowButton";
import DeepReportIntroPanel from "@/components/report/DeepReportIntroPanel";
import ReportSectionLoading from "@/components/report/ReportSectionLoading";
import {
  markDeepReportIntroSeen,
  readDeepReportIntroSeen,
} from "@/lib/report/personalPremiumDeepIntro";
import { usePersonalPremiumReport } from "@/lib/report/usePersonalPremiumReport";

const UnifiedReportMarkdown = dynamic(
  () => import("@/components/report/UnifiedReportMarkdown"),
  {
    ssr: false,
    loading: () => (
      <ReportSectionLoading label="심화 리포트를 불러오는 중…" />
    ),
  },
);

function PremiumDeepContent() {
  const router = useRouter();
  const params = useParams();
  const reportId = decodeURIComponent(String(params.reportId ?? ""));
  const [ready, setReady] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    if (!reportId) {
      router.replace("/");
      return;
    }
    setReady(true);
    setShowIntro(!readDeepReportIntroSeen(reportId));
  }, [reportId, router]);

  const {
    loading,
    streaming,
    unifiedReport,
    error,
    notPremium,
    birthIncomplete,
    regenerate,
  } = usePersonalPremiumReport(reportId, ready && !showIntro);

  const blueprintHref = `/blueprint-preview?reportId=${encodeURIComponent(reportId)}`;

  if (!ready) {
    return (
      <SpaceBackground showProbe={false}>
        <div className="flex min-h-screen items-center justify-center px-6">
          <p className="text-sm text-[rgba(255,255,255,0.55)]">불러오는 중…</p>
        </div>
      </SpaceBackground>
    );
  }

  if (showIntro) {
    return (
      <SpaceBackground showProbe={false}>
        <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-16 pt-20">
          <DeepReportIntroPanel
            onContinue={() => {
              markDeepReportIntroSeen(reportId);
              setShowIntro(false);
            }}
            onBackToResult={() => router.push(blueprintHref)}
          />
        </main>
      </SpaceBackground>
    );
  }

  if (notPremium) {
    return (
      <SpaceBackground showProbe={false}>
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-5 py-16 text-center">
          <p className="text-sm leading-relaxed text-white/70">
            개인 심화 분석은 유료 플랜에서 열려요.
          </p>
          <GlowButton type="button" onClick={() => router.push("/pricing")}>
            요금 안내 보기
          </GlowButton>
          <GlowButton
            type="button"
            variant="ghost"
            onClick={() => router.push(blueprintHref)}
          >
            Blueprint로 돌아가기
          </GlowButton>
        </main>
      </SpaceBackground>
    );
  }

  if (birthIncomplete) {
    return (
      <SpaceBackground showProbe={false}>
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-5 py-16 text-center">
          <p className="text-sm leading-relaxed text-white/70">
            심화 분석을 위해 출생 정보(날짜·시간·장소)가 필요해요.
          </p>
          <GlowButton
            type="button"
            onClick={() =>
              router.push(
                `/onboarding/birth?reportId=${encodeURIComponent(reportId)}&edit=1`,
              )
            }
          >
            출생 정보 입력
          </GlowButton>
        </main>
      </SpaceBackground>
    );
  }

  const showReport =
    unifiedReport && unifiedReport.trim().length > 0 && !loading;

  return (
    <SpaceBackground showProbe={false}>
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-4 px-4 py-14 pt-20 sm:px-5">
        {(loading || streaming) && !showReport ? (
          <ReportSectionLoading
            label={
              streaming
                ? "심화 리포트를 생성하는 중… 1~3분 걸릴 수 있어요."
                : "심화 리포트를 준비하는 중…"
            }
          />
        ) : null}

        {error && !showReport ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-red-200/90">{error}</p>
            <GlowButton type="button" onClick={() => void regenerate()}>
              다시 시도
            </GlowButton>
          </div>
        ) : null}

        {showReport ? (
          <>
            <UnifiedReportMarkdown content={unifiedReport} />
            <div className="flex flex-col gap-2 pb-8">
              <GlowButton
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => void regenerate()}
                disabled={loading || streaming}
              >
                심화 리포트 다시 생성
              </GlowButton>
              <GlowButton
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => router.push(blueprintHref)}
              >
                Blueprint로 돌아가기
              </GlowButton>
            </div>
          </>
        ) : null}
      </main>
    </SpaceBackground>
  );
}

export default function PersonalPremiumDeepPage() {
  return (
    <Suspense
      fallback={
        <SpaceBackground showProbe={false}>
          <div className="flex min-h-screen items-center justify-center px-6">
            <p className="text-sm text-[rgba(255,255,255,0.55)]">불러오는 중…</p>
          </div>
        </SpaceBackground>
      }
    >
      <PremiumDeepContent />
    </Suspense>
  );
}
