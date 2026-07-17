import type OpenAI from "openai";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { SajuMasterJson } from "@/lib/personCore/types/sajuMaster";
import { buildPairDomainSignalsFromMasters } from "@/lib/personCore/sajuSignals/pairDomainSignals";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { buildFamilyParentReport } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import type { FamilyParentPairRoles, FamilyParentRole } from "@/lib/relationship/familyParent/types";
import type { SajuChartProvenance } from "@/lib/saju/loadSajuBundleFromReport";
import type { Locale } from "@/lib/i18n/locale";
import {
  FAMILY_PARENT_CHILD_DEEP_FORMAT,
  type FamilyParentChildDeepReport,
} from "./outputSchema";

export { FAMILY_PARENT_CHILD_DEEP_FORMAT } from "./outputSchema";
export type { FamilyParentChildDeepReport } from "./outputSchema";
export { isFamilyParentChildDeepReport } from "./outputSchema";

export type FamilyParentChildDeepPayload = FamilyParentChildDeepReport;

/**
 * 가족(자녀-부모) 심화 분석 — 엄마/아빠 렌즈 분리 (rule-only, 스켈레톤)
 *
 * TODO: premium/route.ts family 분기 · RelationshipView 역할 선택 UX 연동
 */
export async function runFamilyParentChildDeepAnalysis(
  _openai: OpenAI,
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
  },
): Promise<FamilyParentChildDeepPayload> {
  const pairFamily =
    params.sajuMasterA && params.sajuMasterB
      ? buildPairDomainSignalsFromMasters(
          params.sajuMasterA,
          params.sajuMasterB,
        ).family
      : null;

  const report = buildFamilyParentReport({
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
    locale: params.locale,
  });

  return {
    format: FAMILY_PARENT_CHILD_DEEP_FORMAT,
    report,
  };
}
