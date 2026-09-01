import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import ShareRedirectView from "./ShareRedirectView";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function RelationshipShareRedirectPage({ params }: PageProps) {
  const { token } = await params;

  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <ShareRedirectView token={token ?? ""} />
    </StitchSurveyShell>
  );
}
