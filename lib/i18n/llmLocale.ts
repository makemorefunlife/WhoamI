import {
  DEFAULT_LOCALE,
  localeToShort,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n/locale";

/** Parse API body / header language → Locale (default en-US). */
export function resolveRequestLocale(input: {
  bodyLanguage?: unknown;
  headerLanguage?: string | null;
}): Locale {
  if (input.bodyLanguage != null && String(input.bodyLanguage).trim()) {
    return normalizeLocale(input.bodyLanguage);
  }
  if (input.headerLanguage?.trim()) {
    return normalizeLocale(input.headerLanguage);
  }
  return DEFAULT_LOCALE;
}

/**
 * Korean tone law — applies to every ko-KR report surface (relationship
 * premium domains, personal Blueprint/Essence, deep reports, and any future
 * diary/journal analysis that reuses buildLlmOutputLocaleInstruction).
 * Kept in one place so tone stays consistent without per-prompt duplication.
 */
const KOREAN_TONE_LAW = `
# 문체 (Tone) — Korean output
- 모든 한국어 서술은 자연스럽고 다정한 해요체(~해요/~죠/~예요, 필요시 ~입니다)로 100% 통일.
- 문어체·개조식 종결 금지: "~이다", "~있다", "~한다", "~하는 편", "~함", "~경향이 있다"로 문장을 끝내지 않는다. 표·리스트 항목도 완결된 해요체 문장으로 쓴다.
- 한 화면/문서 안에서 존댓말과 반말·문어체를 섞지 않는다(인용 대화문 제외).
- 대시(—, –, ㅡ)로 절을 잇지 않는다. 쉼표, 연결어미, 또는 새 문장으로 자연스럽게 연결한다.
- 딱딱한 보고서체 대신, 감각 있는 에디터가 다정하게 설명하듯 생생하고 공감 가는 표현을 쓴다.
- 예시: ❌ "다정한 편 — 갈등 시 침묵으로 후퇴" → ✅ "대체로 다정한 편이지만, 갈등이 생기면 잠시 침묵으로 물러나는 편이에요."`.trim();

/**
 * Appended to English canonical system prompts.
 * Single LLM call — no MT pass.
 */
export function buildLlmOutputLocaleInstruction(locale: Locale): string {
  if (locale === "ko-KR") {
    return `
# Output language
- Write ALL user-facing JSON string values in natural Korean (ko-KR).
- Sound like a native Korean counselor — warm, concrete, not translationese.
- Keep JSON keys, enums, scores, and schema exactly as specified (English keys).
- Do not mix English sentences into user-facing prose unless quoting a proper noun.

${KOREAN_TONE_LAW}`.trim();
  }

  return `
# Output language
- Write ALL user-facing JSON string values in natural North American English (en-US).
- Clear, warm, specific — not generic self-help fluff.
- Keep JSON keys, enums, scores, and schema exactly as specified.`.trim();
}

/** Short tag for legacy romantic locale union ("en" | "ko"). */
export function toLegacyShortLocale(locale: Locale): "en" | "ko" {
  return localeToShort(locale);
}

export function fromLegacyShortLocale(short: unknown): Locale {
  return normalizeLocale(short === "en" ? "en-US" : short === "ko" ? "ko-KR" : short);
}
