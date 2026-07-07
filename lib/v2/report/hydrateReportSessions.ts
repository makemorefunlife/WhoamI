import { ensureBirthSession } from "@/lib/v2/onboarding/hydrateBirthSession";
import { hasSurveyV2Session } from "@/lib/v2/survey/session";
import { hydrateSurveySession } from "@/lib/v2/survey/surveyClient";

/** canonical reportId 기준 — DB에서 설문·출생 local session 복구 */
export async function hydrateReportSessions(
  reportId: string,
  opts?: { surveyCompleted?: boolean },
) {
  if (!reportId.trim()) return;

  if (opts?.surveyCompleted || !hasSurveyV2Session(reportId)) {
    await hydrateSurveySession(reportId);
  }

  await ensureBirthSession(reportId);
}
