import type OpenAI from "openai";
import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";
import {
  formatPairSajuBlock,
  formatPersonSajuBlock,
} from "@/lib/saju/formatRomanticSajuInput";
import { parseJsonObject } from "@/lib/relationship/parseLlmJson";
import { buildRomanticHeadlineContext } from "@/lib/relationship/romanticHeadline";
import type { SajuChartProvenance } from "@/lib/saju/loadSajuBundleFromReport";
import { ROMANTIC_SAJU_DEEP_SYSTEM_PROMPT } from "./system";
import { buildRomanticSajuDeepUserPrompt } from "./user";
import {
  isRomanticSajuDeepReport,
  type RomanticSajuDeepReport,
} from "./outputSchema";
import { ROMANTIC_SAJU_DEEP_SELF_REFINE_PROMPT } from "./selfRefine";

export const ROMANTIC_SAJU_DEEP_FORMAT = "romantic_saju_deep_v2" as const;

export type RomanticSajuDeepPayload = {
  format: typeof ROMANTIC_SAJU_DEEP_FORMAT;
  report: RomanticSajuDeepReport["report"];
};

export function romanticSajuDeepSelfRefineEnabled(): boolean {
  const flag = process.env.RELATIONSHIP_ROMANTIC_SELF_REFINE;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return true;
}

/** 출력 토큰 상한 — RELATIONSHIP_ROMANTIC_MAX_TOKENS 로 조정 가능 */
export function romanticSajuDeepMaxTokens(): number {
  const raw = process.env.RELATIONSHIP_ROMANTIC_MAX_TOKENS?.trim();
  if (raw) {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 16384;
}

async function callLlmJson(
  openai: OpenAI,
  system: string,
  user: string,
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: process.env.RELATIONSHIP_ROMANTIC_MODEL ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.55,
    max_tokens: romanticSajuDeepMaxTokens(),
    response_format: { type: "json_object" },
  });
  return completion.choices[0]?.message.content?.trim() ?? "";
}

export async function runRomanticSajuDeepAnalysis(
  openai: OpenAI,
  params: {
    nicknameA: string;
    nicknameB: string;
    birthA: { date: string; time: string; place: string };
    birthB: { date: string; time: string; place: string };
    sajuJsonA: SajuDataForIntegrated;
    sajuJsonB: SajuDataForIntegrated;
    sajuProvenanceA?: SajuChartProvenance;
    sajuProvenanceB?: SajuChartProvenance;
  },
): Promise<RomanticSajuDeepPayload> {
  const headlineCtx = buildRomanticHeadlineContext({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    sajuJsonA: params.sajuJsonA,
    sajuJsonB: params.sajuJsonB,
  });
  const { pairAnalysis, opening, screenPlan, ruleScreenPlan } = headlineCtx;

  const personBlockA = formatPersonSajuBlock({
    nickname: params.nicknameA,
    birthDate: params.birthA.date,
    birthTime: params.birthA.time,
    birthPlace: params.birthA.place,
    sajuJson: params.sajuJsonA,
  });
  const personBlockB = formatPersonSajuBlock({
    nickname: params.nicknameB,
    birthDate: params.birthB.date,
    birthTime: params.birthB.time,
    birthPlace: params.birthB.place,
    sajuJson: params.sajuJsonB,
  });
  const pairBlock = formatPairSajuBlock(
    params.sajuJsonA,
    params.sajuJsonB,
    params.nicknameA,
    params.nicknameB,
    pairAnalysis,
  );

  const userPrompt = buildRomanticSajuDeepUserPrompt({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    personBlockA,
    personBlockB,
    pairBlock,
  });

  const raw = await callLlmJson(
    openai,
    ROMANTIC_SAJU_DEEP_SYSTEM_PROMPT,
    userPrompt,
  );

  let parsed = parseJsonObject<RomanticSajuDeepReport>(raw);
  if (!isRomanticSajuDeepReport(parsed)) {
    throw new Error("LLM 응답이 연인 심화 Output Schema와 맞지 않습니다.");
  }

  if (romanticSajuDeepSelfRefineEnabled()) {
    const refineUser = `${ROMANTIC_SAJU_DEEP_SELF_REFINE_PROMPT}

# 원본 입력 데이터 (1차 결과가 이 데이터와 맞는지 검증·재작성)

${personBlockA}

${personBlockB}

${pairBlock}

# 1차 분석 결과
${JSON.stringify(parsed)}`;
    const refinedRaw = await callLlmJson(
      openai,
      ROMANTIC_SAJU_DEEP_SYSTEM_PROMPT,
      refineUser,
    );
    const refined = parseJsonObject<RomanticSajuDeepReport>(refinedRaw);
    if (isRomanticSajuDeepReport(refined)) {
      parsed = refined;
    }
  }

  const generatedAt = new Date().toISOString();
  const report = {
    ...parsed.report,
    section_1_summary: {
      relationship_name: opening.relationship_name,
      one_line_summary: opening.one_line_summary,
      grade: opening.grade,
    },
    meta: {
      ...(parsed.report.meta ?? {}),
      analysis_version: "v2.11",
      generated_at: generatedAt,
      headline_engine: "selector_v1+rule_library_v1+everyday_text",
      saju_engine: "calculateSajuBundle_v2",
      saju_provenance: {
        a: params.sajuProvenanceA ?? null,
        b: params.sajuProvenanceB ?? null,
      },
      opening: {
        selected_insight_id: opening.selected_insight_id,
        grade_reason: opening.grade_reason,
      },
      ranked_insights: opening.ranked_insights.map((i) => ({
        id: i.id,
        source: i.source,
        ruleType: i.ruleType,
        score: i.score,
        headline: i.headline,
        body: i.body,
        screenHint: i.screenHint,
      })),
      screen_plan: screenPlan,
      rule_screen_plan: ruleScreenPlan,
    },
  };

  return {
    format: ROMANTIC_SAJU_DEEP_FORMAT,
    report,
  };
}

export { ROMANTIC_SAJU_DEEP_SYSTEM_PROMPT } from "./system";
export { buildRomanticSajuDeepUserPrompt } from "./user";
export { ROMANTIC_SAJU_DEEP_OUTPUT_SCHEMA } from "./outputSchema";
export { ROMANTIC_SAJU_DEEP_SELF_REFINE_PROMPT } from "./selfRefine";
