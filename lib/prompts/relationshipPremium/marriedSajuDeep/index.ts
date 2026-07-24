/**
 * Married Couples premium — saju-deep LLM narrative pipeline.
 *
 * FROZEN (2026-07-24): docs/dev/decisions/028_married-saju-deep-narrative-freeze.md
 * after Style Bible Master Check on same + independent cohabitation overlays.
 * Explain-only on meta.married_saju_deep; CE classifications remain SSOT.
 * Do not reopen without repeated QA evidence; keep self-refine OFF.
 *
 * Independent of romanticSajuDeep. Does **not** replace rule-only
 * `buildMarriageReport` / Marriage Context Engine (024).
 */

import type OpenAI from "openai";
import { fetchLlmJsonWithParseRetry } from "@/lib/relationship/parseLlmJson";
import { logServerError } from "@/lib/security/safeLog";
import type { MarriageReportBody } from "@/lib/relationship/marriage/buildMarriageReport";
import {
  buildMarriedHouseholdDigest,
  marriedPostValidateParamsFromReport,
} from "@/lib/relationship/marriageSajuPromptDigest";
import { getMarriedSajuDeepSystemPrompt } from "./system";
import {
  buildMarriedHouseholdDigestScaffold,
  buildMarriedSajuDeepUserPrompt,
} from "./user";
import { postValidateMarriedNarrative } from "./postValidateNarrative";
import {
  MARRIED_SAJU_DEEP_FORMAT,
  isMarriedSajuDeepReport,
  type MarriedSajuDeepReport,
} from "./outputSchema";

export { MARRIED_SAJU_DEEP_FORMAT } from "./outputSchema";
export type { MarriedSajuDeepReport } from "./outputSchema";
export { isMarriedSajuDeepReport } from "./outputSchema";
export { getMarriedSajuDeepSystemPrompt } from "./system";
export {
  buildMarriedSajuDeepUserPrompt,
  buildMarriedHouseholdDigestScaffold,
} from "./user";
export {
  postValidateMarriedNarrative,
  adviceHasLeadingEvidenceBridge,
  rewriteBSpeakerSelfName,
} from "./postValidateNarrative";
export {
  buildEssenceActionSystemPromptBlock,
  buildEssenceActionFewShotExample,
} from "./essenceActionWritingRules";

export type MarriedSajuDeepPromptBundle = {
  format: typeof MARRIED_SAJU_DEEP_FORMAT;
  system: string;
  user: string;
};

function marriedLlmModel(): string {
  return (
    process.env.RELATIONSHIP_MARRIED_MODEL ??
    process.env.RELATIONSHIP_ROMANTIC_MODEL ??
    "gpt-4o-mini"
  );
}

function marriedSajuDeepMaxTokens(): number {
  const n = Number(process.env.RELATIONSHIP_MARRIED_MAX_TOKENS ?? "3500");
  return Number.isFinite(n) && n > 500 ? n : 3500;
}

/** Default ON; set RELATIONSHIP_MARRIED_NARRATIVE=0 to skip LLM overlay. */
export function marriedSajuDeepNarrativeEnabled(): boolean {
  const v = (process.env.RELATIONSHIP_MARRIED_NARRATIVE ?? "1").trim();
  return v !== "0" && v.toLowerCase() !== "false" && v.toLowerCase() !== "off";
}

/** Build Round 1/2 system+user prompts (no LLM call). */
export function buildMarriedSajuDeepPromptBundle(params: {
  nicknameA: string;
  nicknameB: string;
  householdDigestBlock?: string;
  userCustomMyName?: string;
  userCustomTargetName?: string;
  locale?: "ko" | "en";
}): MarriedSajuDeepPromptBundle {
  const digest =
    params.householdDigestBlock ??
    buildMarriedHouseholdDigestScaffold({
      nicknameA: params.nicknameA,
      nicknameB: params.nicknameB,
    });
  return {
    format: MARRIED_SAJU_DEEP_FORMAT,
    system: getMarriedSajuDeepSystemPrompt(params.locale ?? "ko"),
    user: buildMarriedSajuDeepUserPrompt({
      nicknameA: params.nicknameA,
      nicknameB: params.nicknameB,
      householdDigestBlock: digest,
      userCustomMyName: params.userCustomMyName,
      userCustomTargetName: params.userCustomTargetName,
    }),
  };
}

/** Apply deterministic narrative guards; attach meta. */
export function finalizeMarriedSajuDeepNarrative(
  report: MarriedSajuDeepReport,
  params: {
    nicknameA: string;
    nicknameB: string;
    mismatchRoles?: boolean | null;
    operatingCfoSide?: string | null;
    comparisonLeans?: Parameters<
      typeof postValidateMarriedNarrative
    >[1]["comparisonLeans"];
    locale?: string;
  },
): MarriedSajuDeepReport {
  const validated = postValidateMarriedNarrative(
    report as Record<string, unknown>,
    {
      nicknameA: params.nicknameA,
      nicknameB: params.nicknameB,
      mismatchRoles: params.mismatchRoles ?? null,
      operatingCfoSide: params.operatingCfoSide ?? null,
      comparisonLeans: params.comparisonLeans,
    },
  );
  const next = validated.report as MarriedSajuDeepReport;
  return {
    ...next,
    format: MARRIED_SAJU_DEEP_FORMAT,
    meta: {
      ...(next.meta ?? {}),
      generated_at: next.meta?.generated_at ?? new Date().toISOString(),
      locale: params.locale ?? next.meta?.locale ?? "ko-KR",
      domain: "married",
      narrative_guards: validated.fixes,
      narrative_guards_mode: "deterministic_post_validate_married_v1",
    },
  };
}

async function callMarriedLlmJson(
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
      model: marriedLlmModel(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.5,
      max_tokens: marriedSajuDeepMaxTokens(),
      response_format: { type: "json_object" },
    },
    { signal: abortSignal },
  );
  return completion.choices[0]?.message.content?.trim() ?? "";
}

/**
 * Generate explain-only narrative from a finalized MarriageReportBody (CE SSOT).
 * Does not mutate canonical_projections.
 */
export async function runMarriedSajuDeepOverlay(
  openai: OpenAI,
  params: {
    nicknameA: string;
    nicknameB: string;
    report: MarriageReportBody;
    userCustomMyName?: string;
    userCustomTargetName?: string;
    locale?: "ko" | "en";
  },
  options?: { abortSignal?: AbortSignal },
): Promise<MarriedSajuDeepReport> {
  const digest = buildMarriedHouseholdDigest({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    report: params.report,
  });
  const bundle = buildMarriedSajuDeepPromptBundle({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    householdDigestBlock: digest,
    userCustomMyName: params.userCustomMyName,
    userCustomTargetName: params.userCustomTargetName,
    locale: params.locale ?? "ko",
  });

  const parsed = await fetchLlmJsonWithParseRetry<MarriedSajuDeepReport>(
    () =>
      callMarriedLlmJson(
        openai,
        bundle.system,
        bundle.user,
        options?.abortSignal,
      ),
    { label: "married-saju-deep-overlay" },
  );

  if (!isMarriedSajuDeepReport(parsed)) {
    throw new Error("LLM 응답이 부부 saju-deep overlay 스키마와 맞지 않습니다.");
  }

  const pv = marriedPostValidateParamsFromReport({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    report: params.report,
  });

  return finalizeMarriedSajuDeepNarrative(parsed, {
    ...pv,
    locale: params.locale === "en" ? "en-US" : "ko-KR",
  });
}

/**
 * Attach overlay onto MarriageReportBody.meta without touching CE projections.
 * On failure, returns the original report (rule-only preserved).
 */
export async function attachMarriedSajuDeepOverlay(
  openai: OpenAI,
  params: {
    nicknameA: string;
    nicknameB: string;
    report: MarriageReportBody;
    userCustomMyName?: string;
    userCustomTargetName?: string;
    locale?: "ko" | "en";
  },
  options?: { abortSignal?: AbortSignal },
): Promise<MarriageReportBody> {
  if (!marriedSajuDeepNarrativeEnabled()) {
    return params.report;
  }
  try {
    const overlay = await runMarriedSajuDeepOverlay(openai, params, options);
    return {
      ...params.report,
      meta: {
        ...params.report.meta,
        married_saju_deep: overlay,
      },
    };
  } catch (err) {
    logServerError(
      "marriedSajuDeep overlay failed — keeping rule-only marriage report:",
      err,
      "married_narrative_overlay",
    );
    return params.report;
  }
}
