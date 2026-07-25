/**
 * Business / Partnership premium — saju-deep LLM narrative pipeline.
 *
 * FROZEN (2026-07-24): docs/dev/decisions/030_business-saju-deep-narrative-freeze.md
 * after Style Bible Master Check on same + independent work overlays.
 * Explain-only on meta.business_saju_deep; CE classifications remain SSOT.
 * Do not reopen without repeated QA evidence; keep self-refine OFF.
 *
 * Independent of romanticSajuDeep / marriedSajuDeep / familySajuDeep.
 * Does **not** replace rule-only Work CE (`buildWorkColleagueReport` / 022).
 */

import type OpenAI from "openai";
import { fetchLlmJsonWithParseRetry } from "@/lib/relationship/parseLlmJson";
import { logServerError } from "@/lib/security/safeLog";
import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import {
  buildBusinessHouseholdDigest,
  businessPostValidateParamsFromReport,
} from "@/lib/relationship/businessSajuPromptDigest";
import { getBusinessSajuDeepSystemPrompt } from "./system";
import {
  buildBusinessDigestScaffold,
  buildBusinessSajuDeepUserPrompt,
} from "./user";
import { postValidateBusinessNarrative } from "./postValidateNarrative";
import {
  BUSINESS_SAJU_DEEP_FORMAT,
  isBusinessSajuDeepReport,
  type BusinessSajuDeepReport,
} from "./outputSchema";

export { BUSINESS_SAJU_DEEP_FORMAT } from "./outputSchema";
export type { BusinessSajuDeepReport } from "./outputSchema";
export { isBusinessSajuDeepReport } from "./outputSchema";
export { getBusinessSajuDeepSystemPrompt } from "./system";
export {
  buildBusinessSajuDeepUserPrompt,
  buildBusinessDigestScaffold,
} from "./user";
export {
  postValidateBusinessNarrative,
  adviceHasLeadingEvidenceBridge,
  rewriteBSpeakerSelfName,
  rewriteSpeakerSelfAsOther,
} from "./postValidateNarrative";
export {
  buildEssenceActionSystemPromptBlock,
  buildEssenceActionFewShotExample,
} from "./essenceActionWritingRules";

export type BusinessSajuDeepPromptBundle = {
  format: typeof BUSINESS_SAJU_DEEP_FORMAT;
  system: string;
  user: string;
};

function businessLlmModel(): string {
  return (
    process.env.RELATIONSHIP_BUSINESS_MODEL ??
    process.env.RELATIONSHIP_WORK_MODEL ??
    process.env.RELATIONSHIP_FAMILY_MODEL ??
    process.env.RELATIONSHIP_MARRIED_MODEL ??
    process.env.RELATIONSHIP_ROMANTIC_MODEL ??
    "gpt-4o-mini"
  );
}

function businessSajuDeepMaxTokens(): number {
  const n = Number(process.env.RELATIONSHIP_BUSINESS_MAX_TOKENS ?? "3500");
  return Number.isFinite(n) && n > 500 ? n : 3500;
}

/** Default ON; set RELATIONSHIP_BUSINESS_NARRATIVE=0 to skip LLM overlay. */
export function businessSajuDeepNarrativeEnabled(): boolean {
  const v = (process.env.RELATIONSHIP_BUSINESS_NARRATIVE ?? "1").trim();
  return v !== "0" && v.toLowerCase() !== "false" && v.toLowerCase() !== "off";
}

export function buildBusinessSajuDeepPromptBundle(params: {
  nicknameA: string;
  nicknameB: string;
  businessDigestBlock?: string;
  userCustomMyName?: string;
  userCustomTargetName?: string;
  locale?: "ko" | "en";
}): BusinessSajuDeepPromptBundle {
  const digest =
    params.businessDigestBlock ??
    buildBusinessDigestScaffold({
      nicknameA: params.nicknameA,
      nicknameB: params.nicknameB,
    });
  return {
    format: BUSINESS_SAJU_DEEP_FORMAT,
    system: getBusinessSajuDeepSystemPrompt(params.locale ?? "ko"),
    user: buildBusinessSajuDeepUserPrompt({
      nicknameA: params.nicknameA,
      nicknameB: params.nicknameB,
      businessDigestBlock: digest,
      userCustomMyName: params.userCustomMyName,
      userCustomTargetName: params.userCustomTargetName,
    }),
  };
}

export function finalizeBusinessSajuDeepNarrative(
  report: BusinessSajuDeepReport,
  params: {
    nicknameA: string;
    nicknameB: string;
    mismatchRoles?: boolean | null;
    comparisonLeans?: Parameters<
      typeof postValidateBusinessNarrative
    >[1]["comparisonLeans"];
    locale?: string;
  },
): BusinessSajuDeepReport {
  const validated = postValidateBusinessNarrative(
    report as Record<string, unknown>,
    {
      nicknameA: params.nicknameA,
      nicknameB: params.nicknameB,
      mismatchRoles: params.mismatchRoles ?? null,
      comparisonLeans: params.comparisonLeans,
      locale: params.locale,
    },
  );
  const next = validated.report as BusinessSajuDeepReport;
  return {
    ...next,
    format: BUSINESS_SAJU_DEEP_FORMAT,
    meta: {
      ...(next.meta ?? {}),
      generated_at: next.meta?.generated_at ?? new Date().toISOString(),
      locale: params.locale ?? next.meta?.locale ?? "ko-KR",
      domain: "business",
      narrative_guards: validated.fixes,
      narrative_guards_mode: "deterministic_post_validate_business_v1",
    },
  };
}

async function callBusinessLlmJson(
  openai: OpenAI,
  system: string,
  user: string,
  abortSignal?: AbortSignal,
): Promise<string> {
  if (abortSignal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const completion = await openai.chat.completions.create(
    {
      model: businessLlmModel(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.5,
      max_tokens: businessSajuDeepMaxTokens(),
      response_format: { type: "json_object" },
    },
    { signal: abortSignal },
  );
  return completion.choices[0]?.message.content?.trim() ?? "";
}

export async function runBusinessSajuDeepOverlay(
  openai: OpenAI,
  params: {
    nicknameA: string;
    nicknameB: string;
    report: WorkColleagueReportBody;
    userCustomMyName?: string;
    userCustomTargetName?: string;
    locale?: "ko" | "en";
  },
  options?: { abortSignal?: AbortSignal },
): Promise<BusinessSajuDeepReport> {
  const digest = buildBusinessHouseholdDigest({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    report: params.report,
  });
  const bundle = buildBusinessSajuDeepPromptBundle({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    businessDigestBlock: digest,
    userCustomMyName: params.userCustomMyName,
    userCustomTargetName: params.userCustomTargetName,
    locale: params.locale ?? "ko",
  });

  const parsed = await fetchLlmJsonWithParseRetry<BusinessSajuDeepReport>(
    () =>
      callBusinessLlmJson(
        openai,
        bundle.system,
        bundle.user,
        options?.abortSignal,
      ),
    { label: "business-saju-deep-overlay" },
  );

  if (!isBusinessSajuDeepReport(parsed)) {
    throw new Error(
      "LLM 응답이 비즈니스 saju-deep overlay 스키마와 맞지 않습니다.",
    );
  }

  const pv = businessPostValidateParamsFromReport({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    report: params.report,
  });

  return finalizeBusinessSajuDeepNarrative(parsed, {
    ...pv,
    locale: params.locale === "en" ? "en-US" : "ko-KR",
  });
}

export async function attachBusinessSajuDeepOverlay(
  openai: OpenAI,
  params: {
    nicknameA: string;
    nicknameB: string;
    report: WorkColleagueReportBody;
    userCustomMyName?: string;
    userCustomTargetName?: string;
    locale?: "ko" | "en";
  },
  options?: { abortSignal?: AbortSignal },
): Promise<WorkColleagueReportBody> {
  if (!businessSajuDeepNarrativeEnabled()) {
    return params.report;
  }
  try {
    const overlay = await runBusinessSajuDeepOverlay(openai, params, options);
    return {
      ...params.report,
      meta: {
        ...params.report.meta,
        business_saju_deep: overlay,
      },
    };
  } catch (err) {
    logServerError(
      "businessSajuDeep overlay failed — keeping rule-only work report:",
      err,
      "business_narrative_overlay",
    );
    return params.report;
  }
}
