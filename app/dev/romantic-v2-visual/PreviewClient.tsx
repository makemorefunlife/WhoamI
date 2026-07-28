"use client";

import RomanticExperienceView from "@/components/relationship/romantic/experience/RomanticExperienceView";
import { ReportSurfaceProvider } from "@/components/relationship/reportLayout";
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";

type PreviewClientProps = {
  report: RomanticSajuDeepReport["report"];
};

/** Dev-only: always renders V2 (no env flag required). */
export default function PreviewClient({ report }: PreviewClientProps) {
  return (
    <ReportSurfaceProvider surface="stitch">
      <main className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6">
        <RomanticExperienceView
          report={report}
          nameA="Mina"
          nameB="Jun"
          myName="Mina"
          partnerName="Jun"
          viewerIsReportA
        />
      </main>
    </ReportSurfaceProvider>
  );
}
