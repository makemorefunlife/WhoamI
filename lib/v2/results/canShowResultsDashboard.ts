import { hasBirthV2Session } from "@/lib/v2/onboarding/birthSession";
import { hasSurveyV2Session } from "@/lib/v2/survey/session";

export function hasResultsDashboardPrerequisites(
  reportId: string,
  surveyCompleted?: boolean,
  birthDate?: string | null,
): boolean {
  if (!reportId.trim()) return false;
  const surveyOk =
    surveyCompleted === true || hasSurveyV2Session(reportId);
  if (!surveyOk) return false;

  if (birthDate?.trim()) return true;

  return hasBirthV2Session(reportId);
}

export function resultsDashboardPath(reportId: string): string {
  return `/blueprint-preview?reportId=${encodeURIComponent(reportId)}`;
}
