import { Suspense } from "react";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import RelationshipView from "./RelationshipView";
import { getRequestLocale } from "@/lib/i18n/serverLocale";
import { getMessages } from "@/lib/i18n/messages";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RelationshipPage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getRequestLocale();
  const messages = getMessages(locale);

  return (
    <Suspense
      fallback={
        <StitchSurveyShell className="stitch-survey stitch-results">
          <div className="flex min-h-[50dvh] items-center justify-center px-6">
            <p className="text-sm text-on-surface-variant">
              {messages.report.chrome.loading}
            </p>
          </div>
        </StitchSurveyShell>
      }
    >
      <RelationshipView relationshipReportId={id ?? ""} />
    </Suspense>
  );
}
