import type { Locale } from "@/lib/i18n/locale";
import type { FriendRuleContext } from "@/lib/relationship/friend/buildFriendRuleContext";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import {
  resolveGuardianCharacterForPerson,
  resolveFriendSignatureClause,
  resolveCounselingStyleForPerson,
  resolveJealousyGuardNote,
  resolveReconciliationScript,
  resolveTravelStyleSplit,
  refineTravelStyleSplit,
} from "@/lib/relationship/friend/friendPsychFit";
import {
  buildDistanceResilienceLine,
  buildJealousyTriggerSceneLine,
} from "@/lib/relationship/enrichment/friendGiftAndBondInsights";
import { buildFriendAxisRealityInsights } from "@/lib/relationship/enrichment/friendAxisRealityInsights";
import { buildFriendSyntheses } from "./friendCanonicalSyntheses";
import { buildFriendCoverageProfiles } from "./friendPsychCoverageEngine";
import { buildFriendResponseIntelligence } from "@/lib/relationship/friend/response/buildFriendResponseIntelligence";
import type {
  FriendCanonicalBundle,
  FriendGuardianRoleMeaning,
  FriendConnectionSparkMeaning,
  FriendContactDistanceSyncMeaning,
  FriendCounselingTrustMeaning,
  FriendTravelPlayMeaning,
  FriendJealousyGuardMeaning,
  FriendRepairResetMeaning,
} from "./friendCanonicalTypes";

export type BuildFriendCanonicalEngineParams = {
  ctx: FriendRuleContext;
  psychMasterA?: PsychMasterJson | null;
  psychMasterB?: PsychMasterJson | null;
  locale?: Locale;
};

export function buildFriendCanonicalEngine(
  params: BuildFriendCanonicalEngineParams,
): FriendCanonicalBundle {
  const { ctx, psychMasterA, psychMasterB } = params;
  const locale = params.locale ?? ctx.locale ?? "ko-KR";
  const nameA = ctx.nicknameA;
  const nameB = ctx.nicknameB;

  const tenGodsA = (ctx.canonicalPersonalA?.tenGods as TenGodCounts) ?? ctx.tenGodsA;
  const tenGodsB = (ctx.canonicalPersonalB?.tenGods as TenGodCounts) ?? ctx.tenGodsB;

  // 1. Guardian Roles
  const rawRoleA = resolveGuardianCharacterForPerson(tenGodsA, psychMasterA, locale);
  const rawRoleB = resolveGuardianCharacterForPerson(tenGodsB, psychMasterB, locale);

  const guardianRoleA: FriendGuardianRoleMeaning | undefined = rawRoleA
    ? {
        giverName: nameA,
        receiverName: nameB,
        key: rawRoleA.key,
        label: rawRoleA.label,
        description: rawRoleA.description,
      }
    : undefined;

  const guardianRoleB: FriendGuardianRoleMeaning | undefined = rawRoleB
    ? {
        giverName: nameB,
        receiverName: nameA,
        key: rawRoleB.key,
        label: rawRoleB.label,
        description: rawRoleB.description,
      }
    : undefined;

  // 2. Connection Spark (Why Us)
  const connectionSpark: FriendConnectionSparkMeaning = {
    whyYouTitle: `${nameB}에게 끌리는 이유`,
    whyYouBody: ctx.friendPairAnalysis.dnaB.tagline ?? "",
    whyMeTitle: `${nameA}에게 끌리는 이유`,
    whyMeBody: ctx.friendPairAnalysis.dnaA.tagline ?? "",
    whyUsTitle: guardianRoleA?.label ?? "우리이기에 가능한 것",
    whyUsBody: guardianRoleA?.description ?? "서로의 다름이 시너지가 되는 관계",
  };

  // 3. Contact & Distance Sync
  const signatureClause = resolveFriendSignatureClause(psychMasterA, psychMasterB, locale);
  const distanceResilienceLine = buildDistanceResilienceLine({
    yeomaA: ctx.friendPairAnalysis.dnaA.yeomaCount,
    yeomaB: ctx.friendPairAnalysis.dnaB.yeomaCount,
    hasYeokmaCanonical: ctx.canonicalPairFacts?.hasYeokma,
    psychA: psychMasterA,
    psychB: psychMasterB,
    nameA,
    nameB,
    locale,
  });

  const contactDistanceSync: FriendContactDistanceSyncMeaning = {
    signatureClause,
    distanceResilienceLine,
    hasYeokma: ctx.canonicalPairFacts?.hasYeokma ?? false,
    contactRhythmNote: signatureClause,
  };

  // 4. Counseling & Trust
  const counselingStyleA = resolveCounselingStyleForPerson(tenGodsA, psychMasterA, nameA, locale);
  const counselingStyleB = resolveCounselingStyleForPerson(tenGodsB, psychMasterB, nameB, locale);
  const axisInsights = buildFriendAxisRealityInsights({
    psychA: psychMasterA,
    psychB: psychMasterB,
    nameA,
    nameB,
    locale,
  });

  const counselingTrust: FriendCounselingTrustMeaning = {
    counselingStyleA,
    counselingStyleB,
    counselingGapNote: axisInsights?.empathy_vs_solution ?? null,
  };

  // 5. Travel & Play Chemistry
  const baseTravel = resolveTravelStyleSplit(psychMasterA, psychMasterB, nameA, nameB, locale);
  const travelSplit = baseTravel
    ? refineTravelStyleSplit(
        baseTravel,
        psychMasterA,
        psychMasterB,
        ctx.friendPairAnalysis.dnaA.batteryMode,
        ctx.friendPairAnalysis.dnaB.batteryMode,
        ctx.friendPairAnalysis.dnaA.tikitakaMode,
        ctx.friendPairAnalysis.dnaB.tikitakaMode,
        locale,
      )
    : null;

  const travelPlay: FriendTravelPlayMeaning = {
    plannerNickname: travelSplit?.planner.nickname ?? null,
    flexibleNickname: travelSplit?.flexible.nickname ?? null,
    plannerDescription: travelSplit?.planner.description ?? null,
    flexibleDescription: travelSplit?.flexible.description ?? null,
    rolePrescription: travelSplit?.role_prescription ?? null,
  };

  // 6. Jealousy & Friction Guard
  const jealousyGuardA = resolveJealousyGuardNote(tenGodsA, psychMasterA, nameA, locale);
  const jealousyGuardB = resolveJealousyGuardNote(tenGodsB, psychMasterB, nameB, locale);
  const jealousyTriggerScene = buildJealousyTriggerSceneLine(psychMasterA, nameA, nameB, locale);

  const jealousyGuard: FriendJealousyGuardMeaning = {
    jealousyGuardA,
    jealousyGuardB,
    jealousyTriggerScene,
  };

  // 7. Repair & Reset Manual
  const deEscUpsetIsA = tenGodsA.food + tenGodsA.bi_gyeon >= tenGodsB.food + tenGodsB.bi_gyeon;
  const reconciliationScript = resolveReconciliationScript(
    psychMasterA,
    psychMasterB,
    nameA,
    nameB,
    deEscUpsetIsA ? nameA : nameB,
    locale,
  );

  const repairReset: FriendRepairResetMeaning = {
    hashtag: locale !== "en-US" ? "#쿨다운_후_맛집_리셋" : "#Cooling_Reset_Over_Food",
    archetypeLabel: locale !== "en-US" ? "냉각기 & 저자극 맛집 리셋형" : "Cooling & Low-Pressure Reset",
    cheatScript:
      locale !== "en-US"
        ? "아까는 나도 감정이 좀 격했는데, 우리 감정 가라앉히고 편하게 맛있는 거 먹으러 가자."
        : "I was a bit overwhelmed earlier; let's grab some good food together and chat comfortably whenever you're ready.",
    reconciliationScript,
    recoveryPaceNote: axisInsights?.reconciliation_speed ?? null,
  };

  return {
    schemaVersion: "2.0.0",
    meta: {
      nicknameA: nameA,
      nicknameB: nameB,
      locale,
      grade: ctx.grade,
      gradeReason: ctx.gradeReason,
      connectionPct: ctx.masterScores.connection,
      banterPct: ctx.masterScores.banter,
      riskPct: ctx.masterScores.risk,
    },
    canonicalFacts: {
      personalA: ctx.canonicalPersonalA,
      personalB: ctx.canonicalPersonalB,
      pair: ctx.canonicalPairFacts,
    },
    meanings: {
      connectionSpark,
      guardianRoleA,
      guardianRoleB,
      contactDistanceSync,
      counselingTrust,
      travelPlay,
      jealousyGuard,
      repairReset,
    },
    syntheses: buildFriendSyntheses({
      ctx,
      psychA: psychMasterA,
      psychB: psychMasterB,
      locale,
    }),
    coverage: buildFriendCoverageProfiles({
      ctx,
      psychA: psychMasterA,
      psychB: psychMasterB,
      locale,
    }),
    responseIntelligence: buildFriendResponseIntelligence({
      ctx,
      psychA: psychMasterA,
      psychB: psychMasterB,
    }),
  };
}
