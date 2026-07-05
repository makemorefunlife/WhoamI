import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  INTEGRATED_SYSTEM_PROMPT,
  buildIntegratedPhase1UserPrompt,
  buildIntegratedPhase2UserPrompt,
} from "@/lib/prompts/integratedPremiumReport";

export type IntegratedPremiumLlmInput = {
  surveyAnalysis: string;
  sajuSummary: string;
  astrologyInterpretation: string;
};

export type IntegratedPremiumLlmResult = {
  report: string;
  source: "llm" | "fallback";
  phase1_chars: number;
  phase2_chars: number;
};

function buildIntegratedFallback(input: IntegratedPremiumLlmInput): string {
  return `[폴백] OPENAI_API_KEY가 없거나 LLM 호출에 실패해 유료 통합 리포트 본문을 생성하지 못했습니다.

이 탭은 기존 v1 파이프라인(runPremiumReportPipeline → /api/llm mode=integrated)과 동일한 프롬프트(INTEGRATED_SYSTEM_PROMPT, Phase1·Phase2)로 Part 0~5 통합 에세이를 만듭니다.

--- 입력 요약 ---
■ 설문 (${input.surveyAnalysis.length}자)
${input.surveyAnalysis.slice(0, 800)}${input.surveyAnalysis.length > 800 ? "…" : ""}

■ 기질 분석 (${input.sajuSummary.length}자)
${input.sajuSummary.slice(0, 600)}${input.sajuSummary.length > 600 ? "…" : ""}

■ 출생 에너지 맥락 (${input.astrologyInterpretation.length}자)
${input.astrologyInterpretation.slice(0, 400)}${input.astrologyInterpretation.length > 400 ? "…" : ""}`;
}

/**
 * 유료 통합 보고서 — 2단계 생성 (app/api/llm integrated 모드와 동일)
 * lib/prompts/integratedPremiumReport.ts
 */
export async function runIntegratedPremiumLlm(
  input: IntegratedPremiumLlmInput,
): Promise<IntegratedPremiumLlmResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    const report = buildIntegratedFallback(input);
    return { report, source: "fallback", phase1_chars: 0, phase2_chars: 0 };
  }

  const openai = new OpenAI({ apiKey });
  const phase1User = buildIntegratedPhase1UserPrompt(
    input.surveyAnalysis,
    input.sajuSummary,
    input.astrologyInterpretation,
  );
  const phase1Messages: ChatCompletionMessageParam[] = [
    { role: "system", content: INTEGRATED_SYSTEM_PROMPT },
    { role: "user", content: phase1User },
  ];

  try {
    const c1 = await openai.chat.completions.create({
      model: process.env.OPENAI_INTEGRATED_MODEL?.trim() || "gpt-4o-mini",
      messages: phase1Messages,
      temperature: 0.65,
      max_tokens: 8192,
    });
    const part1 = c1.choices[0].message.content ?? "";
    const excerpt = part1.length > 12000 ? part1.slice(-12000) : part1;
    const phase2User = buildIntegratedPhase2UserPrompt(
      input.surveyAnalysis,
      input.sajuSummary,
      input.astrologyInterpretation,
      excerpt,
    );
    const c2 = await openai.chat.completions.create({
      model: process.env.OPENAI_INTEGRATED_MODEL?.trim() || "gpt-4o-mini",
      messages: [
        { role: "system", content: INTEGRATED_SYSTEM_PROMPT },
        { role: "user", content: phase2User },
      ],
      temperature: 0.65,
      max_tokens: 8192,
    });
    const part2 = c2.choices[0].message.content ?? "";
    const report = `${part1}\n\n—\n\n${part2}`.trim();
    if (!report) {
      return {
        report: buildIntegratedFallback(input),
        source: "fallback",
        phase1_chars: 0,
        phase2_chars: 0,
      };
    }
    return {
      report,
      source: "llm",
      phase1_chars: part1.length,
      phase2_chars: part2.length,
    };
  } catch (e) {
    console.warn("runIntegratedPremiumLlm:", e);
    return {
      report: buildIntegratedFallback(input),
      source: "fallback",
      phase1_chars: 0,
      phase2_chars: 0,
    };
  }
}
