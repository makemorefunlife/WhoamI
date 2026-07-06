import { fetchPremiumPipelineMetaOrNull } from "@/lib/report/fetchPremiumPipelineMetaClient";
import { logPremiumContentSource } from "@/lib/report/premiumContentSourceLog";

/** quick API — DB에 저장된 detailed_survey 본문 */
export async function fetchPersistedDetailedSurveyClient(
  reportId: string,
): Promise<string | null> {
  const id = reportId.trim();
  if (!id) return null;

  const meta = await fetchPremiumPipelineMetaOrNull(id);
  const text = meta?.detailed_survey_result ?? null;
  if (text) {
    logPremiumContentSource(id, "db", "detailed-survey-reuse");
  }
  return text;
}

/** detailed_survey LLM 결과 — report_analyses.detailed_survey 저장 */
export async function persistDetailedSurveyClient(
  reportId: string,
  text: string,
): Promise<boolean> {
  const id = reportId.trim();
  const trimmed = text.trim();
  if (!id || !trimmed) return false;

  try {
    const res = await fetch("/api/my/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: id, detailedSurvey: trimmed }),
    });
    if (res.ok) {
      logPremiumContentSource(id, "generation", "detailed-survey-persisted");
    } else {
      logPremiumContentSource(
        id,
        "generation",
        `detailed-survey-persist-failed status=${res.status}`,
      );
    }
    return res.ok;
  } catch {
    logPremiumContentSource(id, "generation", "detailed-survey-persist-error");
    return false;
  }
}
