import { buildHomeLifeDnaProfile } from "@/lib/relationship/marriage/homeLifeLanguage";
import {
  countTenGodsForMarriage,
  type TenGodCounts,
} from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { currentSelfProfileFromSurveyAnswers } from "@/lib/relationship/surveyPatterns";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { toV1SajuApiPayload } from "@/lib/saju/toApiPayload";
import type { SajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { buildNeutralV2Profile } from "@/lib/v2/survey/neutralProfile";
import {
  SECONDARY_AXIS_KEYS,
  type CurrentSelfProfile,
  type SecondaryAxisKey,
} from "@/lib/v2/survey/types";
import { PSYCH_MASTER_JSON_VERSION } from "../schemaVersion";
import type { PsychMasterJson, PsychSurveySource } from "../types/psychMaster";
import { buildSurveyFingerprintPart } from "../utils/fingerprint";
import { resolveHomeLifeFamilyCategory } from "../utils/resolveHomeLifeFamilyCategory";

function sajuJsonFromBundle(bundle: SajuBundle): SajuDataForIntegrated {
  const payload = toV1SajuApiPayload(bundle);
  return {
    saju: payload.saju,
    dayStemData: payload.dayStemData,
    dayBranchData: payload.dayBranchData,
    hiddenStemsData: payload.hiddenStemsData,
    tenGods: payload.tenGods,
    twelveStageData: payload.twelveStageData,
    relations: payload.relations,
    shinsals: payload.shinsals,
  };
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function secondaryAxesFromProfile(
  profile: CurrentSelfProfile,
): PsychMasterJson["secondary_axes"] {
  const axes = {} as PsychMasterJson["secondary_axes"];
  for (const key of SECONDARY_AXIS_KEYS) {
    axes[key as SecondaryAxisKey] = clampScore(profile.secondary_axes[key]);
  }
  return axes;
}

function resolveSurveySource(
  answers: Record<string, unknown> | null,
  profile: CurrentSelfProfile | null,
): PsychSurveySource {
  if (answers?.survey_skipped === true) return "manual_neutral";
  if (profile) return "v2_10q";
  return "incomplete";
}

export function mapPsychMasterJson(params: {
  displayName: string;
  bundle: SajuBundle;
  surveyAnswers: Record<string, unknown> | null;
}): PsychMasterJson {
  const { displayName, bundle, surveyAnswers } = params;
  const profile =
    surveyAnswers != null
      ? currentSelfProfileFromSurveyAnswers(surveyAnswers)
      : null;
  const surveySource = resolveSurveySource(surveyAnswers, profile);
  const effectiveProfile =
    profile ??
    (surveySource === "manual_neutral" || surveySource === "incomplete"
      ? buildNeutralV2Profile()
      : buildNeutralV2Profile());

  const sajuJson = sajuJsonFromBundle(bundle);
  const tenGodCounts: TenGodCounts = countTenGodsForMarriage(sajuJson);
  const homeDna = buildHomeLifeDnaProfile(
    displayName,
    sajuJson,
    tenGodCounts,
  );
  const familyCategory = resolveHomeLifeFamilyCategory(tenGodCounts);

  return {
    schema_version: PSYCH_MASTER_JSON_VERSION,
    secondary_axes: secondaryAxesFromProfile(effectiveProfile),
    survey_source: surveySource,
    survey_completed_at: profile?.meta.completed_at ?? null,
    survey_input_fingerprint: surveyAnswers
      ? buildSurveyFingerprintPart(surveyAnswers)
      : null,
    home_life_dna: {
      lifestyle_title: homeDna.lifestyle_title,
      family_identity_category: familyCategory,
      family_identity_line: homeDna.family_identity,
      life_values_line: homeDna.life_values,
      private_home_self_line: homeDna.private_home_self,
      energy_battery_line: homeDna.energy_battery,
    },
  };
}
