import { notFound } from "next/navigation";
import { buildWorkReportViewModel } from "@/lib/relationship/workColleague/viewModel/buildWorkReportViewModel";
import {
  fullWorkColleagueReportFixture,
  minimalWorkColleagueReportFixture,
} from "@/lib/relationship/workColleague/viewModel/workColleagueReportFixtures";
import { WorkReportViewModelView } from "@/components/relationship/workColleague/sections/SectionRenderer";

/**
 * 로컬 UI 검증 — Phase 2 section-type 렌더러 프리뷰.
 * production relationship 라우트에는 연결되어 있지 않다(Phase 3 대상).
 */
export default function WorkReportViewModelDevPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  const vmFull = buildWorkReportViewModel(fullWorkColleagueReportFixture, {
    viewerIsReportA: true,
    myName: "Sera",
    partnerName: "동글",
  });
  const vmMinimal = buildWorkReportViewModel(minimalWorkColleagueReportFixture, {
    viewerIsReportA: true,
    myName: "Sera",
    partnerName: "동글",
  });

  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-16 bg-[#0f0a14] px-4 py-10">
      <section>
        <p className="mb-6 text-center text-xs text-white/40">
          dev preview — work report viewmodel (full payload)
        </p>
        <WorkReportViewModelView vm={vmFull} />
      </section>
      <section>
        <p className="mb-6 text-center text-xs text-white/40">
          dev preview — work report viewmodel (minimal/legacy payload)
        </p>
        <WorkReportViewModelView vm={vmMinimal} />
      </section>
    </main>
  );
}
