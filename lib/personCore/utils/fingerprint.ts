import { createHash } from "crypto";

function stableValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(stableValue);
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = stableValue(obj[key]);
    }
    return sorted;
  }
  return value;
}

function stableJson(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** 설문 answers에서 fingerprint 대상 키만 추출 (v2_profile embed 제외 — 파생값) */
export function surveyAnswersForFingerprint(
  answers: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!answers) return null;
  const out: Record<string, unknown> = {};
  if (answers.survey_source != null) {
    out.survey_source = answers.survey_source;
  }
  if (answers.survey_skipped != null) {
    out.survey_skipped = answers.survey_skipped;
  }
  for (const key of Object.keys(answers).sort()) {
    if (/^q\d+$/i.test(key) && typeof answers[key] === "string") {
      out[key] = (answers[key] as string).trim().toUpperCase();
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function buildBirthFingerprintPart(params: {
  birth_date: string;
  birth_time: string | null;
  birth_time_unknown: boolean;
}): string {
  return stableJson({
    birth_date: params.birth_date.trim(),
    birth_time: params.birth_time?.trim() || null,
    birth_time_unknown: params.birth_time_unknown,
  });
}

export function buildSurveyFingerprintPart(
  answers: Record<string, unknown> | null,
): string {
  const pick = surveyAnswersForFingerprint(answers);
  return pick ? sha256Hex(stableJson(pick)) : "no_survey";
}

export function buildInputFingerprint(params: {
  birth_date: string;
  birth_time: string | null;
  birth_time_unknown: boolean;
  surveyAnswers: Record<string, unknown> | null;
}): string {
  const birthPart = buildBirthFingerprintPart({
    birth_date: params.birth_date,
    birth_time: params.birth_time,
    birth_time_unknown: params.birth_time_unknown,
  });
  const surveyPart = buildSurveyFingerprintPart(params.surveyAnswers);
  return sha256Hex(`${birthPart}|${surveyPart}`);
}
