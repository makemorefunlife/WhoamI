import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";
import type { RomanticSajuDeepPayload } from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import { ROMANTIC_SAJU_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import { insertRelationshipAnalysisLog } from "@/lib/relationship/analysisLog";
import {
  getRelationshipPremiumSaveFailedMessage,
} from "@/lib/relationship/relationshipPremiumGuard";
import { mergeRelationshipPremiumByKind } from "@/lib/relationship/relationshipReportQuery";

export type PersistRomanticPremiumResult =
  | { ok: true }
  | { ok: false; userMessage: string };

export async function persistRomanticPremiumResult(
  supabase: SupabaseClient,
  params: {
    relationshipReportId: string;
    viewerReportId: string;
    romanticPayload: RomanticSajuDeepPayload;
    locale?: string;
  },
): Promise<PersistRomanticPremiumResult> {
  const locale =
    params.locale ??
    (typeof params.romanticPayload.report?.meta?.locale === "string"
      ? params.romanticPayload.report.meta.locale
      : typeof params.romanticPayload.report?.meta?.language === "string"
        ? params.romanticPayload.report.meta.language
        : "en-US");

  const { error: upErr } = await mergeRelationshipPremiumByKind(
    supabase,
    params.relationshipReportId,
    "romantic",
    params.romanticPayload,
    { relationshipKind: "romantic", locale },
  );

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
