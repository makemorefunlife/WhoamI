import type OpenAI from "openai";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { SajuMasterJson } from "@/lib/personCore/types/sajuMaster";
import { buildPairDomainSignalsFromMasters } from "@/lib/personCore/sajuSignals/pairDomainSignals";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { buildFamilyParentReport } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import type {
  FamilyParentPairRoles,
  FamilyParentRole,
} from "@/lib/relationship/familyParent/types";
import type { SajuChartProvenance } from "@/lib/saju/loadSajuBundleFromReport";
import type { Locale } from "@/lib/i18n/locale";
import { attachFamilySajuDeepOverlay } from "@/lib/prompts/relationshipPremium/familySajuDeep";
import {
  FAMILY_PARENT_CHILD_DEEP_FORMAT,
  type FamilyParentChildDeepReport,
} from "./outputSchema";

export { FAMILY_PARENT_CHILD_DEEP_FORMAT } from "./outputSchema";
export type { FamilyParentChildDeepReport } from "./outputSchema";
export { isFamilyParentChildDeepReport } from "./outputSchema";

export type FamilyParentChildDeepPayload = FamilyParentChildDeepReport;

/**
 * 가족(자녀-부모) 심화 분석
 * 1) rule-only CE (`buildFamilyParentReport`) — classifications SSOT
 * 2) optional familySajuDeep LLM explain overlay → meta.family_saju_deep
 *    (RELATIONSHIP_FAMILY_NARRATIVE=0 to skip)
 */
export async function runFamilyParentChildDeepAnalysis(
  openai: OpenAI,
  params: {
    nicknameA: string;
    nicknameB: string;
    roles: FamilyParentPairRoles;
    parentType?: FamilyParentRole;
    birthA: { date: string; time: string; place: string };
    birthB: { date: string; time: string; place: string };
    sajuJsonA: SajuDataForIntegrated;
    sajuJsonB: SajuDataForIntegrated;
    sajuProvenanceA?: SajuChartProvenance;
    sajuProvenanceB?: SajuChartProvenance;
    psychMasterA?: PsychMasterJson | null;
    psychMasterB?: PsychMasterJson | null;
    personCoreMeta?: {
      reportIdA: string;
      reportIdB: string;
      inputFingerprintA: string;
      inputFingerprintB: string;
    };
    sajuMasterA?: SajuMasterJson | null;
    sajuMasterB?: SajuMasterJson | null;
    locale?: Locale;
    /** true면 시청자=자녀 — household_roles 나/상대 */
    childIsViewer?: boolean;
    userCustomParentName?: string;
    userCustomChildName?: string;
    /** Skip LLM overlay even if env enabled (tests). */
    skipFamilyNarrative?: boolean;
    /**
     * TIME-DEPENDENT DETERMINISTIC — explicit evaluation year for Part3's
     * Growth Tunnel (the only year-sensitive Family content; static
     * bond/synergy/risk/grade never depend on this). Omit to use the
     * current year — same effective behavior as before Phase 3B, but now an
     * explicit, declared input instead of a hidden new Date().getFullYear()
     * inside familyKillerSections.ts.
     */
    analysisYear?: number;
  },
  options?: { abortSignal?: AbortSignal },
): Promise<FamilyParentChildDeepPayload> {
  const pairFamily =
    params.sajuMasterA && params.sajuMasterB
      ? buildPairDomainSignalsFromMasters(
          params.sajuMasterA,
          params.sajuMasterB,
        ).family
      : null;
  const familySignalsA = params.sajuMasterA?.domain_signals.family_signals;
  const familySignalsB = params.sajuMasterB?.domain_signals.family_signals;
  const friendshipSignalsA =
    params.sajuMasterA?.domain_signals.friendship_signals;
  const friendshipSignalsB =
    params.sajuMasterB?.domain_signals.friendship_signals;

  let report = buildFamilyParentReport({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    roles: params.roles,
    parentType: params.parentType,
    sajuJsonA: params.sajuJsonA,
    sajuJsonB: params.sajuJsonB,
    birthPlaceA: params.birthA.place,
    birthPlaceB: params.birthB.place,
    birthTimeUnknownA: params.sajuProvenanceA?.birthTimeUnknown,
    birthTimeUnknownB: params.sajuProvenanceB?.birthTimeUnknown,
    psychMasterA: params.psychMasterA,
    psychMasterB: params.psychMasterB,
    personCoreMeta: params.personCoreMeta,
    pairFamily,
    familySignalsA,
    familySignalsB,
    friendshipSignalsA,
    friendshipSignalsB,
    locale: params.locale,
    childIsViewer: params.childIsViewer,
    analysisYear: params.analysisYear ?? new Date().getFullYear(),
  });

  if (!params.skipFamilyNarrative) {
    const short =
      typeof params.locale === "string" && params.locale.startsWith("en")
        ? "en"
        : "ko";
    const nicknameParent =
      report.meta.parent_nickname || params.nicknameA;
    const nicknameChild =
      report.meta.child_nickname || params.nicknameB;
    report = await attachFamilySajuDeepOverlay(
      openai,
      {
        nicknameParent,
        nicknameChild,
        report,
        userCustomParentName:
          params.userCustomParentName ?? nicknameParent,
        userCustomChildName: params.userCustomChildName ?? nicknameChild,
        locale: short,
      },
      options,
    );
  }

  return {
    format: FAMILY_PARENT_CHILD_DEEP_FORMAT,
    report,
  };
}
