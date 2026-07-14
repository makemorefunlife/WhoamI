import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";
import type { RomanticSajuDeepPayload } from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import { ROMANTIC_SAJU_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import { insertRelationshipAnalysisLog } from "@/lib/relationship/analysisLog";
import {
  RELATIONSHIP_PREMIUM_SAVE_FAILED_MESSAGE,
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
  },
): Promise<PersistRomanticPremiumResult> {
  const { error: upErr } = await mergeRelationshipPremiumByKind(
    supabase,
    params.relationshipReportId,
    "romantic",
    params.romanticPayload,
    { relationshipKind: "romantic" },
  );

  if (upErr) {
    logServerError("persistRomanticPremiumResult update:", upErr, "internal_error");
    return { ok: false, userMessage: RELATIONSHIP_PREMIUM_SAVE_FAILED_MESSAGE };
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
      return { ok: false, userMessage: RELATIONSHIP_PREMIUM_SAVE_FAILED_MESSAGE };
    }
  }

  return { ok: true };
}
