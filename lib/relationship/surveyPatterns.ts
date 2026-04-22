import type { SupabaseClient } from "@supabase/supabase-js";

function normalizeYN(value: unknown): string {
  const v = String(value ?? "")
    .trim()
    .toUpperCase();
  if (v === "Y" || v === "YES") return "Y";
  if (v === "N" || v === "NO") return "N";
  return "";
}

function getPattern(a: unknown, b: unknown, c: unknown): string {
  return normalizeYN(a) + normalizeYN(b) + normalizeYN(c);
}

export type DomainKey =
  | "mbti"
  | "disc"
  | "enneagram"
  | "riasec"
  | "pss"
  | "tci";

const DOMAIN_KEYS: DomainKey[] = [
  "mbti",
  "disc",
  "enneagram",
  "riasec",
  "pss",
  "tci",
];

/**
 * survey_responses.answers에서 6영역 Y/N 패턴 문자열을 만든다.
 * (리포트의 pattern_base 조회와 동일한 키)
 */
export function answersToPatternRecord(
  answers: Record<string, unknown> | null | undefined,
): Record<DomainKey, string> {
  const ans = answers ?? {};
  return {
    mbti: getPattern(ans.q1, ans.q2, ans.q3),
    disc: getPattern(ans.q4, ans.q5, ans.q6),
    enneagram: getPattern(ans.q7, ans.q8, ans.q9),
    riasec: getPattern(ans.q10, ans.q11, ans.q12),
    pss: getPattern(ans.q13, ans.q14, ans.q15),
    tci: getPattern(ans.q16, ans.q17, ans.q18),
  };
}

/**
 * 한 리포트의 설문 answers (복수 행이 있어도 1건만 사용).
 * `.maybeSingle()`은 동일 report_id로 2행 이상이면 오류·data null이 되어
 * "설문 있는데도 관계 분석 불가"가 발생할 수 있음.
 */
export async function getSurveyAnswersForReport(
  supabase: SupabaseClient,
  reportId: string,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("survey_responses")
    .select("answers")
    .eq("report_id", reportId)
    .limit(1);

  if (error) {
    console.error("survey_responses select:", reportId, error.message);
    return null;
  }

  const row = data?.[0];
  if (row?.answers == null) return null;

  let answers: unknown = row.answers;
  if (typeof answers === "string") {
    try {
      answers = JSON.parse(answers) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return null;
  }
  return answers as Record<string, unknown>;
}

/** pattern_base 없이도 LLM에 넘길 수 있는 최소 패턴 텍스트 */
export function buildFallbackPatternSummary(
  answers: Record<string, unknown>,
): string {
  const patterns = answersToPatternRecord(answers);
  return DOMAIN_KEYS.map((k) => `[${k}] Y/N 패턴: ${patterns[k]}`).join("\n");
}

/** 한 리포트의 18문항 — 도메인별 패턴을 한 줄 텍스트로 */
export async function getPatternSummaryForReport(
  supabase: SupabaseClient,
  reportId: string,
): Promise<string | null> {
  const rawAnswers = await getSurveyAnswersForReport(supabase, reportId);
  if (!rawAnswers) return null;

  const patterns = answersToPatternRecord(rawAnswers);

  const lines = await Promise.all(
    DOMAIN_KEYS.map(async (key) => {
      const pattern = patterns[key].trim();
      const { data } = await supabase
        .from("pattern_base")
        .select("interpretation")
        .eq("domain", key)
        .eq("pattern", pattern)
        .maybeSingle();
      return `[${key}] ${data?.interpretation ?? "해석 없음"}`;
    }),
  );

  const joined = lines.join("\n");
  const allMissingInterpretation = lines.every((line) =>
    line.includes("해석 없음"),
  );
  if (allMissingInterpretation) {
    return `${joined}\n\n[패턴 원시값 — DB 해석 없음]\n${buildFallbackPatternSummary(rawAnswers)}`;
  }
  return joined;
}
