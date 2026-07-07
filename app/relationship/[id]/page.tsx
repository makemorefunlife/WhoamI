import { Suspense } from "react";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import RelationshipView from "./RelationshipView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RelationshipPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <StitchSurveyShell className="stitch-survey stitch-results">
          <div className="flex min-h-[50dvh] items-center justify-center px-6">
            <p className="text-sm text-on-surface-variant">불러오는 중…</p>
          </div>
        </StitchSurveyShell>
      }
    >
      <RelationshipView relationshipReportId={id ?? ""} />
    </Suspense>
  );
}
