/**
 * Friend / Social premium — saju-deep LLM narrative pipeline.
 *
 * FROZEN (2026-07-24): docs/dev/decisions/031_friend-saju-deep-narrative-freeze.md
 * after Style Bible Master Check on same + independent friendship overlays.
 * Explain-only on meta.friend_saju_deep; CE classifications remain SSOT.
 * Do not reopen without repeated QA evidence; keep self-refine OFF.
 *
 * Independent of romantic / married / family / business saju-deep.
 * Does **not** replace rule-only Friendship CE (`buildFriendReport` / 020).
 */

import type OpenAI from "openai";
import { fetchLlmJsonWithParseRetry } from "@/lib/relationship/parseLlmJson";
import { logServerError } from "@/lib/security/safeLog";
import type { FriendReportBody } from "@/lib/relationship/friend/buildFriendReport";
import {
  buildFriendHouseholdDigest,
  friendPostValidateParamsFromReport,
} from "@/lib/relationship/friendSajuPromptDigest";
import { getFriendSajuDeepSystemPrompt } from "./system";
import {
  buildFriendDigestScaffold,
  buildFriendSajuDeepUserPrompt,
} from "./user";
import { postValidateFriendNarrative } from "./postValidateNarrative";
import {
  FRIEND_SAJU_DEEP_FORMAT,
  isFriendSajuDeepReport,
  type FriendSajuDeepReport,
} from "./outputSchema";

export { FRIEND_SAJU_DEEP_FORMAT } from "./outputSchema";
export type { FriendSajuDeepReport } from "./outputSchema";
export { isFriendSajuDeepReport } from "./outputSchema";
export { getFriendSajuDeepSystemPrompt } from "./system";
export {
  buildFriendSajuDeepUserPrompt,
  buildFriendDigestScaffold,
} from "./user";
export {
  postValidateFriendNarrative,
  adviceHasLeadingEvidenceBridge,
  rewriteBSpeakerSelfName,
  rewriteSpeakerSelfAsOther,
} from "./postValidateNarrative";
export {
  buildEssenceActionSystemPromptBlock,
  buildEssenceActionFewShotExample,
} from "./essenceActionWritingRules";

export type FriendSajuDeepPromptBundle = {
  format: typeof FRIEND_SAJU_DEEP_FORMAT;
  system: string;
  user: string;
};

function friendLlmModel(): string {
  return (
    process.env.RELATIONSHIP_FRIEND_MODEL ??
    process.env.RELATIONSHIP_BUSINESS_MODEL ??
    process.env.RELATIONSHIP_FAMILY_MODEL ??
    process.env.RELATIONSHIP_MARRIED_MODEL ??
    process.env.RELATIONSHIP_ROMANTIC_MODEL ??
    "gpt-4o-mini"
  );
}

function friendSajuDeepMaxTokens(): number {
  const n = Number(process.env.RELATIONSHIP_FRIEND_MAX_TOKENS ?? "3500");
  return Number.isFinite(n) && n > 500 ? n : 3500;
}

/** Default ON; set RELATIONSHIP_FRIEND_NARRATIVE=0 to skip LLM overlay. */
export function friendSajuDeepNarrativeEnabled(): boolean {
  const v = (process.env.RELATIONSHIP_FRIEND_NARRATIVE ?? "1").trim();
  return v !== "0" && v.toLowerCase() !== "false" && v.toLowerCase() !== "off";
}

export function buildFriendSajuDeepPromptBundle(params: {
  nicknameA: string;
  nicknameB: string;
  friendDigestBlock?: string;
  userCustomMyName?: string;
  userCustomTargetName?: string;
  locale?: "ko" | "en";
}): FriendSajuDeepPromptBundle {
  const digest =
    params.friendDigestBlock ??
    buildFriendDigestScaffold({
      nicknameA: params.nicknameA,
      nicknameB: params.nicknameB,
    });
  return {
    format: FRIEND_SAJU_DEEP_FORMAT,
    system: getFriendSajuDeepSystemPrompt(params.locale ?? "ko"),
    user: buildFriendSajuDeepUserPrompt({
      nicknameA: params.nicknameA,
      nicknameB: params.nicknameB,
      friendDigestBlock: digest,
      userCustomMyName: params.userCustomMyName,
      userCustomTargetName: params.userCustomTargetName,
    }),
  };
}

export function finalizeFriendSajuDeepNarrative(
  report: FriendSajuDeepReport,
  params: {
    nicknameA: string;
    nicknameB: string;
    mismatchRoles?: boolean | null;
    comparisonLeans?: Parameters<
      typeof postValidateFriendNarrative
    >[1]["comparisonLeans"];
    locale?: string;
  },
): FriendSajuDeepReport {
  const validated = postValidateFriendNarrative(
    report as Record<string, unknown>,
    {
      nicknameA: params.nicknameA,
      nicknameB: params.nicknameB,
      mismatchRoles: params.mismatchRoles ?? null,
      comparisonLeans: params.comparisonLeans,
    },
  );
  const next = validated.report as FriendSajuDeepReport;
  return {
    ...next,
    format: FRIEND_SAJU_DEEP_FORMAT,
    meta: {
      ...(next.meta ?? {}),
      generated_at: next.meta?.generated_at ?? new Date().toISOString(),
      locale: params.locale ?? next.meta?.locale ?? "ko-KR",
      domain: "friend",
      narrative_guards: validated.fixes,
      narrative_guards_mode: "deterministic_post_validate_friend_v1",
    },
  };
}

async function callFriendLlmJson(
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
      model: friendLlmModel(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.5,
      max_tokens: friendSajuDeepMaxTokens(),
      response_format: { type: "json_object" },
    },
    { signal: abortSignal },
  );
  return completion.choices[0]?.message.content?.trim() ?? "";
}

export async function runFriendSajuDeepOverlay(
  openai: OpenAI,
  params: {
    nicknameA: string;
    nicknameB: string;
    report: FriendReportBody;
    userCustomMyName?: string;
    userCustomTargetName?: string;
    locale?: "ko" | "en";
  },
  options?: { abortSignal?: AbortSignal },
): Promise<FriendSajuDeepReport> {
  const digest = buildFriendHouseholdDigest({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    report: params.report,
  });
  const bundle = buildFriendSajuDeepPromptBundle({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    friendDigestBlock: digest,
    userCustomMyName: params.userCustomMyName,
    userCustomTargetName: params.userCustomTargetName,
    locale: params.locale ?? "ko",
  });

  const parsed = await fetchLlmJsonWithParseRetry<FriendSajuDeepReport>(
    () =>
      callFriendLlmJson(
        openai,
        bundle.system,
        bundle.user,
        options?.abortSignal,
      ),
    { label: "friend-saju-deep-overlay" },
  );

  if (!isFriendSajuDeepReport(parsed)) {
    throw new Error(
      "LLM 응답이 친구 saju-deep overlay 스키마와 맞지 않습니다.",
    );
  }

  const pv = friendPostValidateParamsFromReport({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    report: params.report,
  });

  return finalizeFriendSajuDeepNarrative(parsed, {
    ...pv,
    locale: params.locale === "en" ? "en-US" : "ko-KR",
  });
}

export async function attachFriendSajuDeepOverlay(
  openai: OpenAI,
  params: {
    nicknameA: string;
    nicknameB: string;
    report: FriendReportBody;
    userCustomMyName?: string;
    userCustomTargetName?: string;
    locale?: "ko" | "en";
  },
  options?: { abortSignal?: AbortSignal },
): Promise<FriendReportBody> {
  if (!friendSajuDeepNarrativeEnabled()) {
    return params.report;
  }
  try {
    const overlay = await runFriendSajuDeepOverlay(openai, params, options);
    return {
      ...params.report,
      meta: {
        ...params.report.meta,
        friend_saju_deep: overlay,
      },
    };
  } catch (err) {
    logServerError(
      "friendSajuDeep overlay failed — keeping rule-only friend report:",
      err,
      "friend_narrative_overlay",
    );
    return params.report;
  }
}
