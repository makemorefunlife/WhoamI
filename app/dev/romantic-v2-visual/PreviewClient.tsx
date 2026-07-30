"use client";

import RomanticExperienceView from "@/components/relationship/romantic/experience/RomanticExperienceView";
import { ReportSurfaceProvider } from "@/components/relationship/reportLayout";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";

type PreviewClientProps = {
  report: RomanticSajuDeepReport["report"];
};

/**
 * Dev-only: always renders V2 (no env flag required).
 * Force ko-KR so fixture Korean copy and axis labels stay consistent
 * (projectors default to ko-KR; messages must match).
 */
export default function PreviewClient({ report }: PreviewClientProps) {
  return (
    <LocaleProvider locale="ko-KR">
      <ReportSurfaceProvider surface="stitch">
        <main className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6">
          <RomanticExperienceView
            report={report}
            nameA="지민"
            nameB="정우"
            myName="지민"
            partnerName="정우"
            viewerIsReportA
            locale="ko-KR"
          />
        </main>
      </ReportSurfaceProvider>
    </LocaleProvider>
  );
}
