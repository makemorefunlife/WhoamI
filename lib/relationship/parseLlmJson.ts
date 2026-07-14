/** LLM 응답에서 JSON 객체 추출 (코드펜스 제거) */
import { logServerError } from "@/lib/security/safeLog";

export function parseJsonObject<T = unknown>(raw: string): T {
  let s = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(s);
  if (fence) s = fence[1]?.trim() ?? s;
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s) as T;
}

export const DEFAULT_LLM_JSON_PARSE_MAX_RETRIES = 2;
export const DEFAULT_LLM_JSON_PARSE_RETRY_DELAY_MS = 750;

/** JSON.parse 실패 후 재시도를 모두 소진했을 때 */
export class LlmJsonParseRetryError extends Error {
  readonly attempts: number;
  readonly causeError: unknown;

  constructor(attempts: number, causeError: unknown) {
    super(`LLM JSON 파싱 ${attempts}회 재시도 후 실패`);
    this.name = "LlmJsonParseRetryError";
    this.attempts = attempts;
    this.causeError = causeError;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isJsonParseError(err: unknown): boolean {
  return err instanceof SyntaxError;
}

export type FetchLlmJsonWithParseRetryOptions = {
  /** 추가 재시도 횟수 (기본 2 → 총 3회 시도) */
  maxRetries?: number;
  /** 재시도 간 지연(ms) */
  delayMs?: number;
  /** 로그용 라벨 */
  label?: string;
};

/**
 * LLM raw 응답 fetch + parseJsonObject.
 * JSON.parse(SyntaxError) 시 동일 fetch를 최대 maxRetries회 재시도한다.
 */
export async function fetchLlmJsonWithParseRetry<T>(
  fetchRaw: () => Promise<string>,
  options?: FetchLlmJsonWithParseRetryOptions,
): Promise<T> {
  const maxRetries = options?.maxRetries ?? DEFAULT_LLM_JSON_PARSE_MAX_RETRIES;
  const delayMs = options?.delayMs ?? DEFAULT_LLM_JSON_PARSE_RETRY_DELAY_MS;
  const totalAttempts = maxRetries + 1;
  const labelSuffix = options?.label ? ` (${options.label})` : "";

  let lastError: unknown;

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      const raw = await fetchRaw();
      return parseJsonObject<T>(raw);
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt >= totalAttempts;

      if (!isJsonParseError(err)) {
        throw err;
      }

      if (isLastAttempt) {
        logServerError("parseLlmJson", err, "parse_retry_exhausted");
        throw new LlmJsonParseRetryError(totalAttempts, err);
      }

      logServerError("parseLlmJson", undefined, "parse_retry");
      await sleep(delayMs);
    }
  }

  throw new LlmJsonParseRetryError(totalAttempts, lastError);
}
