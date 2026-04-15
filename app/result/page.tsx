"use client";

// [추가] 스펙상 결과 URL — /report 와 동일 컴포넌트 (데이터 흐름 동일)
import { Suspense } from "react";
import ReportContent from "../report/reportcontent";
import SpaceBackground from "@/components/space/SpaceBackground";
import SurveyAnalyzingJourney from "@/components/space/SurveyAnalyzingJourney";

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <SpaceBackground>
          <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5">
            <SurveyAnalyzingJourney active mode="flight" />
          </div>
        </SpaceBackground>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
