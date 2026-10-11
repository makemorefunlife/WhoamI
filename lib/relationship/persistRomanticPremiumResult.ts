import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";
import type { RomanticSajuDeepPayload } from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import { ROMANTIC_SAJU_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import { insertRelationshipAnalysisLog } from "@/lib/relationship/analysisLog";
import {
  getRelationshipPremiumSaveFailedMessage,
} from "@/lib/relationship/relationshipPremiumGuard";
import { saveOwnedRelationshipPremium } from "@/lib/relationship/premiumAccess";

export type PersistRomanticPremiumResult =
  | { ok: true }
  | { ok: false; userMessage: string };

export async function persistRomanticPremiumResult(
  supabase: SupabaseClient,
  params: {
    relationshipReportId: string;
    viewerReportId: string;
    /** Creator (signed-in user). The report is saved as THEIR report only. */
    ownerClerkUserId: string;
    romanticPayload: RomanticSajuDeepPayload;
    locale?: string;
    reason?: "first_generation" | "user_regenerate";
  },
): Promise<PersistRomanticPremiumResult> {
  const locale =
    params.locale ??
    (typeof params.romanticPayload.report?.meta?.locale === "string"
      ? params.romanticPayload.report.meta.locale
      : typeof params.romanticPayload.report?.meta?.language === "string"
        ? params.romanticPayload.report.meta.language
        : "en-US");

  // Per-creator report (2026-10-11): never written into the shared legacy
  // result_premium_by_kind, never over the other participant's report.
  const { error: upErr } = await saveOwnedRelationshipPremium(supabase, {
    relationshipReportId: params.relationshipReportId,
    ownerReportId: params.viewerReportId,
    ownerClerkUserId: params.ownerClerkUserId,
    kind: "romantic",
    locale,
    payload: params.romanticPayload,
    reason: params.reason ?? "first_generation",
  });

  if (upErr) {
    logServerError("persistRomanticPremiumResult update:", upErr, "internal_error");
    return {
      ok: false,
      userMessage: getRelationshipPremiumSaveFailedMessage(locale),
    };
  }

  if (params.viewerReportId.trim()) {
    const logId = await insertRelationshipAnalysisLog(supabase, {
      relationshipReportId: params.relationshipReportId,
      viewerReportId: params.viewerReportId,
      relationshipKind: "romantic",
      analysisLevel: "premium",
      resultFormat: ROMANTIC_SAJU_DEEP_FORMAT,
      payload: params.romanticPayload,
    });
    if (!logId) {
      console.error("persistRomanticPremiumResult analysis log insert failed");
      return {
        ok: false,
        userMessage: getRelationshipPremiumSaveFailedMessage(locale),
      };
    }
  }

  return { ok: true };
}
