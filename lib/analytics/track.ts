/**
 * Analytics 이벤트 SSOT — GTM/GA4 연동 전 안전장치.
 *
 * 새 이벤트를 추가하려면 이 파일의 타입(AnalyticsEventMap)부터 수정하고,
 * PII·식별자·리포트 원문이 params에 들어가지 않는지 검토한 뒤에만 추가할 것.
 *
 * 금지 예: report_id, 이름, 생년월일, 설문/사주/심리 점수, 에러 메시지 원문.
 */

/** 카테고리형 실패 사유만 — 원문 메시지·스택 금지 */
export type AnalyticsErrorType =
  | "parse_error"
  | "llm_error"
  | "network_error"
  | "timeout_error"
  | "schema_error"
  | "auth_error"
  | "unknown";

type ReportViewParams = Readonly<{
  relationship_kind: string;
}>;

type ReportShareParams = Readonly<{
  relationship_kind: string;
  share_method: string;
}>;

type ReportGenerationFailedParams = Readonly<{
  relationship_kind: string;
  error_type: AnalyticsErrorType;
}>;

type ReportGenerationSuccessParams = Readonly<{
  relationship_kind: string;
}>;

type AnalyticsEventMap = {
  report_view: ReportViewParams;
  report_share: ReportShareParams;
  report_generation_failed: ReportGenerationFailedParams;
  report_generation_success: ReportGenerationSuccessParams;
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

export type AnalyticsEvent = {
  [K in AnalyticsEventName]: {
    name: K;
    params: AnalyticsEventMap[K];
  };
}[AnalyticsEventName];

/** 이벤트별 허용 param 키 — 런타임 화이트리스트 */
const ALLOWED_KEYS_BY_EVENT: Record<
  AnalyticsEventName,
  readonly string[]
> = {
  report_view: ["relationship_kind"],
  report_share: ["relationship_kind", "share_method"],
  report_generation_failed: ["relationship_kind", "error_type"],
  report_generation_success: ["relationship_kind"],
};

/**
 * 절대 analytics params에 넣지 말 것.
 * (타입에 없어도 any 캐스팅 등으로 우회 시 런타임에서 제거)
 */
const FORBIDDEN_PARAM_KEYS = [
  "report_id",
  "reportId",
  "relationship_report_id",
  "relationshipReportId",
  "viewer_report_id",
  "viewerReportId",
  "name",
  "nickname",
  "firstName",
  "lastName",
  "fullName",
  "birthDate",
  "birth_date",
  "birthTime",
  "birth_time",
  "birthPlace",
  "birth_place",
  "birthTimeUnknown",
  "birth_time_unknown",
  "email",
  "psychScores",
  "psych_scores",
  "psychMatch",
  "psych_match",
  "sajuResult",
  "saju_result",
  "sajuJson",
  "v2_profile",
  "survey",
  "surveyAnswers",
  "error",
  "error_message",
  "errorMessage",
  "message",
  "stack",
  "stackTrace",
  "raw",
  "payload",
] as const;

const FORBIDDEN_PARAM_KEY_SET = new Set<string>(FORBIDDEN_PARAM_KEYS);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isForbiddenKey(key: string): boolean {
  if (FORBIDDEN_PARAM_KEY_SET.has(key)) return true;
  const lower = key.toLowerCase();
  return (
    lower.includes("report_id") ||
    lower.includes("reportid") ||
    lower.includes("birth") ||
    lower.includes("saju") ||
    lower.includes("psych") ||
    lower.includes("survey") ||
    lower.includes("email") ||
    lower.includes("password") ||
    lower.includes("token") ||
    lower.includes("name") ||
    lower.includes("error_message") ||
    lower.includes("stack")
  );
}

function sanitizeParams(
  eventName: AnalyticsEventName,
  params: Record<string, unknown>,
): Record<string, string> {
  const allowed = new Set<string>(ALLOWED_KEYS_BY_EVENT[eventName]);
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    if (!allowed.has(key)) {
      console.warn(
        `[analytics] dropped disallowed param key "${key}" on event "${eventName}"`,
      );
      continue;
    }
    if (isForbiddenKey(key)) {
      console.warn(
        `[analytics] dropped forbidden param key "${key}" on event "${eventName}"`,
      );
      continue;
    }
    if (typeof value !== "string" || value.trim() === "") {
      console.warn(
        `[analytics] dropped non-string param "${key}" on event "${eventName}"`,
      );
      continue;
    }
    sanitized[key] = value.trim();
  }

  return sanitized;
}

/**
 * GTM/GA4로 보낼 이벤트 — 허용된 이름·속성만.
 * 아직 dataLayer/gtag 연결 없음 (타입·런타임 가드만).
 */
export function track(event: AnalyticsEvent): void {
  if (!isPlainObject(event.params)) {
    console.warn("[analytics] invalid params object — event skipped", event.name);
    return;
  }

  const params = sanitizeParams(
    event.name,
    event.params as Record<string, unknown>,
  );

  const requiredKeys = ALLOWED_KEYS_BY_EVENT[event.name];
  for (const key of requiredKeys) {
    if (!(key in params)) {
      console.warn(
        `[analytics] missing required param "${key}" on event "${event.name}" — event skipped`,
      );
      return;
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics] track (no-op until GTM wired)", {
      name: event.name,
      params,
    });
  }

  // GTM 연동 시: window.dataLayer?.push({ event: event.name, ...params });
}
