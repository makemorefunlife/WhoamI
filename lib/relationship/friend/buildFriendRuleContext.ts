import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";

import { resolvePersonalityLabel } from "@/lib/relationship/romanticEverydayText";

import type { RelationshipEventScores } from "@/lib/relationship/pairEventScores";

import {

  computeFriendCompatibilityGrade,

  type FriendMasterScores,

} from "@/lib/relationship/friendEventScores";

import { buildPairSajuBlueprint } from "@/lib/saju/sajuBlueprint";

import { estimateStrengthBalance } from "@/lib/saju/romanticSajuDerivations";

import type { PairSajuAnalysis } from "@/lib/saju/pairChartAnalysis";

import {

  analyzeFriendPairSaju,

  type FriendPairSajuAnalysis,

} from "@/lib/saju/friendAnalysis";

import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";

import {

  buildFriendKillerSections,

  type FriendKillerSections,

} from "./friendKillerSections";

import type { Locale } from "@/lib/i18n/locale";

import { LEGACY_FALLBACK_LOCALE } from "./friendCopy";



export type FriendRuleContext = {

  nicknameA: string;

  nicknameB: string;

  sajuJsonA: SajuDataForIntegrated;

  sajuJsonB: SajuDataForIntegrated;

  pairAnalysis: PairSajuAnalysis;

  friendPairAnalysis: FriendPairSajuAnalysis;

  killerSections: FriendKillerSections;

  eventScores: RelationshipEventScores;

  grade: "A" | "B" | "C" | "D";

  gradeReason: string;

  masterScores: FriendMasterScores;

  strengthA: { label: string; note: string };

  strengthB: { label: string; note: string };

  metaphorA: string;

  metaphorB: string;

  tenGodsA: TenGodCounts;

  tenGodsB: TenGodCounts;

  uncertainItems: string[];

  locale: Locale;

};



export type BuildFriendContextParams = {

  nicknameA: string;

  nicknameB: string;

  sajuJsonA: SajuDataForIntegrated;

  sajuJsonB: SajuDataForIntegrated;

  birthPlaceA?: string | null;

  birthPlaceB?: string | null;

  birthTimeUnknownA?: boolean;

  birthTimeUnknownB?: boolean;

  locale?: Locale;

};



/** 친구(Social DNA) rule context */

export function buildFriendRuleContext(

  params: BuildFriendContextParams,

): FriendRuleContext {

  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const blueprint = buildPairSajuBlueprint(params);

  const { core, uncertainItems } = blueprint;



  const friendPairAnalysis = analyzeFriendPairSaju(

    core.pillarsA,

    core.pillarsB,

    core.tenGodsA,

    core.tenGodsB,

    core,

    locale,

  );



  const { grade, reason, eventScores, masterScores } =

    computeFriendCompatibilityGrade(friendPairAnalysis, locale);



  const killerSections = buildFriendKillerSections({

    nicknameA: params.nicknameA,

    nicknameB: params.nicknameB,

    friendPairAnalysis,

    masterScores,

    countsA: core.tenGodsA,

    countsB: core.tenGodsB,

    locale,

  });



  return {

    nicknameA: params.nicknameA,

    nicknameB: params.nicknameB,

    sajuJsonA: params.sajuJsonA,

    sajuJsonB: params.sajuJsonB,

    pairAnalysis: friendPairAnalysis.base,

    friendPairAnalysis,

    killerSections,

    eventScores,

    grade,

    gradeReason: reason,

    masterScores,

    strengthA: estimateStrengthBalance(core.pillarsA),

    strengthB: estimateStrengthBalance(core.pillarsB),

    metaphorA: resolvePersonalityLabel(params.sajuJsonA),

    metaphorB: resolvePersonalityLabel(params.sajuJsonB),

    tenGodsA: core.tenGodsA,

    tenGodsB: core.tenGodsB,

    uncertainItems,

    locale,

  };

}


