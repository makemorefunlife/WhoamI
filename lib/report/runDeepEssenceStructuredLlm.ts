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
import {
  coerceDeepEssencePartA,
  coerceDeepEssencePartB,
} from "@/lib/report/coerceDeepEssenceStructured";
import { PRIMARY_AXIS_KEYS } from "@/lib/v2/survey/types";
import type { PrimaryAxisKey, PrimaryAxesScores } from "@/lib/v2/survey/types";
import { type Locale } from "@/lib/i18n/locale";
import { polishDeepEssenceStructuredReport } from "@/lib/report/polishDeepEssenceStructured";
import { logServerEvent } from "@/lib/security/safeLog";
import {
  formatPart01EvidenceForPrompt,
  filterKnownEvidenceRefs,
} from "@/lib/report/formatPart01EvidenceForPrompt";
import type { Part01IdentityEvidencePacket } from "@/lib/v1/slim/part01IdentityEvidence";

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
  /**
   * Batch 3 — optional. Grounds Core Mode / Growth Edge in Part01 Identity
   * Evidence when available. Absent/null reproduces exact pre-Batch-3
   * behavior (Batch 3 rule: grounding failure/absence must never break
   * Deep Essence generation).
   */
  part01Evidence?: Part01IdentityEvidencePacket | null;
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
    // Batch 3 — additive grounding. formatPart01EvidenceForPrompt returns
    // null on missing/failed packet, which reproduces the exact pre-Batch-3
    // prompt (buildDeepEssenceStructuredPartAUserPrompt treats
    // part01Evidence: null same as omitted).
    const promptEvidence = formatPart01EvidenceForPrompt(input.part01Evidence);

    const userA = buildDeepEssenceStructuredPartAUserPrompt({
      surveyAnalysis: input.surveyAnalysis,
      essenceAnalysisSummary: input.essenceAnalysisSummary,
      birthEnergyContext: input.astrologyInterpretation,
      currentAxisScores: input.currentAxisScores,
      locale: input.locale,
      part01Evidence: promptEvidence
        ? { coreModeText: promptEvidence.coreModeText, growthEdgeText: promptEvidence.growthEdgeText }
        : null,
    });
    const partARaw = await fetchLlmJsonWithParseRetry<Record<string, unknown>>(
      () => callLlmJson(openai, systemPrompt, userA),
      { label: "deep-essence-structured-a" },
    );
    const coercedA = coerceDeepEssencePartA(partARaw, input.currentAxisScores);
    if (coercedA.notes.length) {
      logServerEvent("runDeepEssenceStructuredLlm", "part_a_coerced", {
        notes: coercedA.notes.slice(0, 8),
      });
    }
    if (!isDeepEssencePartA(coercedA.value)) {
      logServerError(
        "runDeepEssenceStructuredLlm:",
        undefined,
        "part_a_invalid",
      );
      return { structured: null, source: "fallback" };
    }
    const partA = coercedA.value;
    // Batch 3 — never trust LLM-invented evidence_refs: keep only keys that
    // actually appeared in the grounding text shown to it.
    if (promptEvidence) {
      const summary = partA.summary as Record<string, unknown>;
      const filteredCoreModeRefs = filterKnownEvidenceRefs(
        summary.core_mode_evidence_refs,
        promptEvidence.coreModeKnownKeys,
      );
      const filteredGrowthEdgeRefs = filterKnownEvidenceRefs(
        summary.growth_edge_evidence_refs,
        promptEvidence.growthEdgeKnownKeys,
      );
      if (filteredCoreModeRefs) summary.core_mode_evidence_refs = filteredCoreModeRefs;
      else delete summary.core_mode_evidence_refs;
      if (filteredGrowthEdgeRefs) summary.growth_edge_evidence_refs = filteredGrowthEdgeRefs;
      else delete summary.growth_edge_evidence_refs;
    }

    const userB = buildDeepEssenceStructuredPartBUserPrompt({
      surveyAnalysis: input.surveyAnalysis,
      essenceAnalysisSummary: input.essenceAnalysisSummary,
      birthEnergyContext: input.astrologyInterpretation,
      partAExcerpt: buildPartAExcerpt(partA),
      locale: input.locale,
    });
    const partBRaw = await fetchLlmJsonWithParseRetry<Record<string, unknown>>(
      () => callLlmJson(openai, systemPrompt, userB),
      { label: "deep-essence-structured-b" },
    );
    const coercedB = coerceDeepEssencePartB(partBRaw);
    if (coercedB.notes.length) {
      logServerEvent("runDeepEssenceStructuredLlm", "part_b_coerced", {
        notes: coercedB.notes.slice(0, 8),
      });
    }
    if (!isDeepEssencePartB(coercedB.value)) {
      logServerError(
        "runDeepEssenceStructuredLlm:",
        undefined,
        "part_b_invalid",
      );
      return { structured: null, source: "fallback" };
    }
    const partB = coercedB.value;

    const merged = { ...partA, ...partB };
    if (!isDeepEssenceStructuredReport(merged)) {
      logServerError(
        "runDeepEssenceStructuredLlm:",
        undefined,
        "merged_invalid",
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
    // Prose-only tone polish — never blind tree-walk. Invalid polish → original.
    const structured = polishDeepEssenceStructuredReport(
      withClampedRadar,
      input.locale,
    );

    return { structured, source: "llm" };
  } catch (e) {
    const code =
      e && typeof e === "object" && "name" in e && e.name === "LlmJsonParseRetryError"
        ? "json_parse_exhausted"
        : "structured_throw";
    logServerError("runDeepEssenceStructuredLlm:", e, code);
    return { structured: null, source: "fallback" };
  }
}

export type { PrimaryAxisKey };
