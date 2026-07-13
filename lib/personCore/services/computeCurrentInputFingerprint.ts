import { createHash } from "crypto";
import {
  fetchLatestSurveyForPersonCore,
  fetchReportForPersonCore,
} from "../data/fetchPersonCoreSources";
import { buildInputFingerprint } from "../utils/fingerprint";
import { getPersonCoreSupabase } from "../utils/getServerSupabase";

/** 출생일 삭제 등 — 기존 스냅샷과 절대 일치하지 않는 센티넬 */
export const NO_BIRTH_INPUT_FINGERPRINT = createHash("sha256")
  .update("person_core:no_birth", "utf8")
  .digest("hex");

/**
 * reports + 최신 설문만으로 현재 input_fingerprint를 계산 (사주 계산 없음).
 */
export async function computeCurrentInputFingerprint(
  reportId: string,
): Promise<string> {
  const trimmedId = reportId.trim();
  const supabase = getPersonCoreSupabase();
  const report = await fetchReportForPersonCore(supabase, trimmedId);
  const birthDate = report.birth_date?.trim();
  if (!birthDate) return NO_BIRTH_INPUT_FINGERPRINT;

  const birthTimeUnknown = !report.birth_time?.trim();
  const surveyRow = await fetchLatestSurveyForPersonCore(supabase, trimmedId);
  const surveyAnswers = surveyRow?.answers ?? null;

  return buildInputFingerprint({
    birth_date: birthDate,
    birth_time: report.birth_time,
    birth_time_unknown: birthTimeUnknown,
    surveyAnswers,
  });
}
