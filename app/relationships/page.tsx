import { Suspense } from "react";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import RelationshipsDashboard from "./RelationshipsDashboard";

export default function RelationshipsPage() {
  return (
    <Suspense
      fallback={
        <StitchSurveyShell>
          <div className="flex min-h-[50dvh] items-center justify-center px-6">
            <p className="text-sm text-on-surface-variant">Loading…</p>
          </div>
        </StitchSurveyShell>
      }
    >
      <RelationshipsDashboard />
    </Suspense>
  );
}
