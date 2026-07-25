import OpenAI from "openai";
import { logServerError } from "@/lib/security/safeLog";
import {
  getDeepEssenceStructuredSystemPrompt,
  buildDeepEssenceStructuredPartAUserPrompt,
  buildDeepEssenceStructuredPartBUserPrompt,
} from "@/lib/prompts/deepEssenceStructured";
import { fetchLlmJsonWithParseRetry } from "@/lib/relationship/parseLlmJson";
import {
  isDeepEssencePartA,
  isDeepEssencePartB,
  isDeepEssenceStructuredReport,
} from "@/lib/report/deepEssenceStructuredSchema";
import { PRIMARY_AXIS_KEYS } from "@/lib/v2/survey/types";
import type { PrimaryAxisKey, PrimaryAxesScores } from "@/lib/v2/survey/types";
import { normalizeLocale, type Locale } from "@/lib/i18n/locale";
import { polishKoStringTree } from "@/lib/i18n/koToneGuards";
import { polishEnStringTree } from "@/lib/i18n/enToneGuards";

import type {
  DeepEssenceStrengthOrWatchout,
  DeepEssenceEnergyBar,
  DeepEssenceWoundSteadyRow,
  DeepEssencePlaybookRow,
  DeepEssenceStructuredReport,
} from "@/lib/report/deepEssenceStructuredSchema";
export type {
  DeepEssenceStrengthOrWatchout,
  DeepEssenceEnergyBar,
  DeepEssenceWoundSteadyRow,
  DeepEssencePlaybookRow,
  DeepEssenceStructuredReport,
};
export { isDeepEssenceStructuredReport } from "@/lib/report/deepEssenceStructuredSchema";

export type DeepEssenceStructuredLlmInput = {
  surveyAnalysis: string;
  essenceAnalysisSummary: string;
  astrologyInterpretation: string;
  currentAxisScores: PrimaryAxesScores;
  locale?: Locale | string;
};

export type DeepEssenceStructuredLlmResult = {
  structured: DeepEssenceStructuredReport | null;
  source: "llm" | "fallback";
};

function clampAxisScores(
  raw: Record<string, unknown>,
  floor: PrimaryAxesScores,
): PrimaryAxesScores {
  const out = {} as PrimaryAxesScores;
  for (const key of PRIMARY_AXIS_KEYS) {
    const value = Number(raw[key]);
    const min = floor[key] ?? 0;
    out[key] = Math.max(min, Math.min(100, Math.round(value)));
  }
  return out;
}

async function callLlmJson(
  openai: OpenAI,
  system: string,
  user: string,
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_INTEGRATED_MODEL?.trim() || "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.6,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });
  return completion.choices[0]?.message.content?.trim() ?? "";
}

function buildPartAExcerpt(partA: Record<string, unknown>): string {
  // Part B 프롬프트에 톤·인물상을 이어가기 위한 최소 요약(전체 JSON을 다시 보내지 않음)
  try {
    return JSON.stringify({
      summary: partA.summary,
      strengths: (partA.strengths as { title: string }[] | undefined)?.map((s) => s.title),
      watchouts: (partA.watchouts as { title: string }[] | undefined)?.map((w) => w.title),
      energy_headline: (partA.energy as { headline?: string } | undefined)?.headline,
    });
  } catch {
    return "";
  }
}

/**
 * 유료 심화 리포트 — Part 01~05 + 부록 구조화 생성 (2단계 LLM 호출).
 * 실패 시 null을 반환하며, 호출부는 기존 산문 리포트(report: string)로 폴백한다.
 * en-US · ko-KR 둘 다 지원한다 (locale 인자로 응답 언어를 지정).
 *
 * 타입/검증기는 lib/report/deepEssenceStructuredSchema.ts(서버·클라이언트 공용)에
 * 있다. 스키마를 바꿀 땐 그 파일만 고치면 된다 — 캐시 검증(slimIntegratedCache.ts)도
 * 같은 검증기를 쓰기 때문에 여기서 중복 정의하지 않는다.
 */
export async function runDeepEssenceStructuredLlm(
  input: DeepEssenceStructuredLlmInput,
): Promise<DeepEssenceStructuredLlmResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { structured: null, source: "fallback" };
  }

  const openai = new OpenAI({ apiKey });
  const systemPrompt = getDeepEssenceStructuredSystemPrompt(input.locale);

  try {
    const userA = buildDeepEssenceStructuredPartAUserPrompt({
      surveyAnalysis: input.surveyAnalysis,
      essenceAnalysisSummary: input.essenceAnalysisSummary,
      birthEnergyContext: input.astrologyInterpretation,
      currentAxisScores: input.currentAxisScores,
      locale: input.locale,
    });
    const partA = await fetchLlmJsonWithParseRetry<Record<string, unknown>>(
      () => callLlmJson(openai, systemPrompt, userA),
      { label: "deep-essence-structured-a" },
    );

    if (!isDeepEssencePartA(partA)) {
      logServerError(
        "runDeepEssenceStructuredLlm:",
        new Error("part A schema validation failed"),
        "internal_error",
      );
      return { structured: null, source: "fallback" };
    }

    const userB = buildDeepEssenceStructuredPartBUserPrompt({
      surveyAnalysis: input.surveyAnalysis,
      essenceAnalysisSummary: input.essenceAnalysisSummary,
      birthEnergyContext: input.astrologyInterpretation,
      partAExcerpt: buildPartAExcerpt(partA),
      locale: input.locale,
    });
    const partB = await fetchLlmJsonWithParseRetry<Record<string, unknown>>(
      () => callLlmJson(openai, systemPrompt, userB),
      { label: "deep-essence-structured-b" },
    );

    if (!isDeepEssencePartB(partB)) {
      logServerError(
        "runDeepEssenceStructuredLlm:",
        new Error("part B schema validation failed"),
        "internal_error",
      );
      return { structured: null, source: "fallback" };
    }

    const merged = { ...partA, ...partB };
    if (!isDeepEssenceStructuredReport(merged)) {
      logServerError(
        "runDeepEssenceStructuredLlm:",
        new Error("merged schema validation failed"),
        "internal_error",
      );
      return { structured: null, source: "fallback" };
    }

    const withClampedRadar: DeepEssenceStructuredReport = {
      ...merged,
      radar_potential: clampAxisScores(
        merged.radar_potential as unknown as Record<string, unknown>,
        input.currentAxisScores,
      ),
    };
    const resolvedLocale = normalizeLocale(input.locale);
    const structured =
      resolvedLocale === "ko-KR"
        ? polishKoStringTree(withClampedRadar)
        : polishEnStringTree(withClampedRadar);

    return { structured, source: "llm" };
  } catch (e) {
    logServerError("runDeepEssenceStructuredLlm:", e, "internal_error");
    return { structured: null, source: "fallback" };
  }
}

export type { PrimaryAxisKey };
