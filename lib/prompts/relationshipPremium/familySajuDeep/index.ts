/**
 * Family Parent–Child premium — saju-deep LLM narrative pipeline.
 *
 * FROZEN (2026-07-24): docs/dev/decisions/029_family-saju-deep-narrative-freeze.md
 * after Style Bible Master Check on same + independent family overlays.
 * Explain-only on meta.family_saju_deep; CE classifications remain SSOT.
 * Do not reopen without repeated QA evidence; keep self-refine OFF.
 *
 * Independent of romanticSajuDeep / marriedSajuDeep.
 * Does **not** replace rule-only Family CE (`buildFamilyParentReport` / 026).
 */

import type OpenAI from "openai";
import { fetchLlmJsonWithParseRetry } from "@/lib/relationship/parseLlmJson";
import { logServerError } from "@/lib/security/safeLog";
import type { FamilyParentReportBody } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import {
  buildFamilyHouseholdDigest,
  familyPostValidateParamsFromReport,
} from "@/lib/relationship/familySajuPromptDigest";
import { getFamilySajuDeepSystemPrompt } from "./system";
import {
  buildFamilyDigestScaffold,
  buildFamilySajuDeepUserPrompt,
} from "./user";
import { postValidateFamilyNarrative } from "./postValidateNarrative";
import {
  FAMILY_SAJU_DEEP_FORMAT,
  isFamilySajuDeepReport,
  type FamilySajuDeepReport,
} from "./outputSchema";

export { FAMILY_SAJU_DEEP_FORMAT } from "./outputSchema";
export type { FamilySajuDeepReport } from "./outputSchema";
export { isFamilySajuDeepReport } from "./outputSchema";
export { getFamilySajuDeepSystemPrompt } from "./system";
export {
  buildFamilySajuDeepUserPrompt,
  buildFamilyDigestScaffold,
} from "./user";
export {
  postValidateFamilyNarrative,
  adviceHasLeadingEvidenceBridge,
  rewriteBSpeakerSelfName,
  rewriteSpeakerSelfAsOther,
} from "./postValidateNarrative";
export {
  buildEssenceActionSystemPromptBlock,
  buildEssenceActionFewShotExample,
} from "./essenceActionWritingRules";

export type FamilySajuDeepPromptBundle = {
  format: typeof FAMILY_SAJU_DEEP_FORMAT;
  system: string;
  user: string;
};

function familyLlmModel(): string {
  return (
    process.env.RELATIONSHIP_FAMILY_MODEL ??
    process.env.RELATIONSHIP_MARRIED_MODEL ??
    process.env.RELATIONSHIP_ROMANTIC_MODEL ??
    "gpt-4o-mini"
  );
}

function familySajuDeepMaxTokens(): number {
  const n = Number(process.env.RELATIONSHIP_FAMILY_MAX_TOKENS ?? "3500");
  return Number.isFinite(n) && n > 500 ? n : 3500;
}

/** Default ON; set RELATIONSHIP_FAMILY_NARRATIVE=0 to skip LLM overlay. */
export function familySajuDeepNarrativeEnabled(): boolean {
  const v = (process.env.RELATIONSHIP_FAMILY_NARRATIVE ?? "1").trim();
  return v !== "0" && v.toLowerCase() !== "false" && v.toLowerCase() !== "off";
}

export function buildFamilySajuDeepPromptBundle(params: {
  nicknameParent: string;
  nicknameChild: string;
  familyDigestBlock?: string;
  userCustomParentName?: string;
  userCustomChildName?: string;
  locale?: "ko" | "en";
}): FamilySajuDeepPromptBundle {
  const digest =
    params.familyDigestBlock ??
    buildFamilyDigestScaffold({
      nicknameParent: params.nicknameParent,
      nicknameChild: params.nicknameChild,
    });
  return {
    format: FAMILY_SAJU_DEEP_FORMAT,
    system: getFamilySajuDeepSystemPrompt(params.locale ?? "ko"),
    user: buildFamilySajuDeepUserPrompt({
      nicknameParent: params.nicknameParent,
      nicknameChild: params.nicknameChild,
      familyDigestBlock: digest,
      userCustomParentName: params.userCustomParentName,
      userCustomChildName: params.userCustomChildName,
    }),
  };
}

export function finalizeFamilySajuDeepNarrative(
  report: FamilySajuDeepReport,
  params: {
    nicknameParent: string;
    nicknameChild: string;
    mismatchGenerations?: boolean | null;
    comparisonLeans?: Parameters<
      typeof postValidateFamilyNarrative
    >[1]["comparisonLeans"];
    locale?: string;
  },
): FamilySajuDeepReport {
  const validated = postValidateFamilyNarrative(
    report as Record<string, unknown>,
    {
      nicknameParent: params.nicknameParent,
      nicknameChild: params.nicknameChild,
      mismatchGenerations: params.mismatchGenerations ?? null,
      comparisonLeans: params.comparisonLeans,
    },
  );
  const next = validated.report as FamilySajuDeepReport;
  return {
    ...next,
    format: FAMILY_SAJU_DEEP_FORMAT,
    meta: {
      ...(next.meta ?? {}),
      generated_at: next.meta?.generated_at ?? new Date().toISOString(),
      locale: params.locale ?? next.meta?.locale ?? "ko-KR",
      domain: "family",
      narrative_guards: validated.fixes,
      narrative_guards_mode: "deterministic_post_validate_family_v1",
    },
  };
}

async function callFamilyLlmJson(
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
      model: familyLlmModel(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.5,
      max_tokens: familySajuDeepMaxTokens(),
      response_format: { type: "json_object" },
    },
    { signal: abortSignal },
  );
  return completion.choices[0]?.message.content?.trim() ?? "";
}

export async function runFamilySajuDeepOverlay(
  openai: OpenAI,
  params: {
    nicknameParent: string;
    nicknameChild: string;
    report: FamilyParentReportBody;
    userCustomParentName?: string;
    userCustomChildName?: string;
    locale?: "ko" | "en";
  },
  options?: { abortSignal?: AbortSignal },
): Promise<FamilySajuDeepReport> {
  const digest = buildFamilyHouseholdDigest({
    nicknameParent: params.nicknameParent,
    nicknameChild: params.nicknameChild,
    report: params.report,
  });
  const bundle = buildFamilySajuDeepPromptBundle({
    nicknameParent: params.nicknameParent,
    nicknameChild: params.nicknameChild,
    familyDigestBlock: digest,
    userCustomParentName: params.userCustomParentName,
    userCustomChildName: params.userCustomChildName,
    locale: params.locale ?? "ko",
  });

  const parsed = await fetchLlmJsonWithParseRetry<FamilySajuDeepReport>(
    () =>
      callFamilyLlmJson(
        openai,
        bundle.system,
        bundle.user,
        options?.abortSignal,
      ),
    { label: "family-saju-deep-overlay" },
  );

  if (!isFamilySajuDeepReport(parsed)) {
    throw new Error("LLM 응답이 가족 saju-deep overlay 스키마와 맞지 않습니다.");
  }

  const pv = familyPostValidateParamsFromReport({
    nicknameParent: params.nicknameParent,
    nicknameChild: params.nicknameChild,
    report: params.report,
  });

  return finalizeFamilySajuDeepNarrative(parsed, {
    ...pv,
    locale: params.locale === "en" ? "en-US" : "ko-KR",
  });
}

export async function attachFamilySajuDeepOverlay(
  openai: OpenAI,
  params: {
    nicknameParent: string;
    nicknameChild: string;
    report: FamilyParentReportBody;
    userCustomParentName?: string;
    userCustomChildName?: string;
    locale?: "ko" | "en";
  },
  options?: { abortSignal?: AbortSignal },
): Promise<FamilyParentReportBody> {
  if (!familySajuDeepNarrativeEnabled()) {
    return params.report;
  }
  try {
    const overlay = await runFamilySajuDeepOverlay(openai, params, options);
    return {
      ...params.report,
      meta: {
        ...params.report.meta,
        family_saju_deep: overlay,
      },
    };
  } catch (err) {
    logServerError(
      "familySajuDeep overlay failed — keeping rule-only family report:",
      err,
      "family_narrative_overlay",
    );
    return params.report;
  }
}
