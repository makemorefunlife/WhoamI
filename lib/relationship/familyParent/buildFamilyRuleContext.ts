import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { RelationshipEventScores } from "@/lib/relationship/pairEventScores";
import type { Locale } from "@/lib/i18n/locale";
import { LEGACY_FALLBACK_LOCALE } from "./familyParentCopy";
import { buildPairSajuBlueprint } from "@/lib/saju/sajuBlueprint";
import { buildDomainPairLensFromCharts } from "@/lib/personCore/pairContextEngine";
import type { DomainPairLensOutput } from "@/lib/personCore/pairContextEngine";
import {
  analyzeFamilyPairSaju,
  type FamilyPairSajuAnalysis,
} from "@/lib/saju/familyAnalysis";
import type {
  PairSajuAnalysis,
  CanonicalPairSajuFacts,
  CanonicalPersonalSajuFacts,
} from "@/lib/saju/pairChartAnalysis";
import {
  extractCanonicalPairFacts,
  extractCanonicalPersonalFacts,
} from "@/lib/saju/pairChartAnalysis";
import {
  computeFamilyCompatibilityGrade,
  type FamilyMasterScores,
} from "./familyEventScores";
import {
  analyzeFamilyParentTenGod,
  type FamilyParentTenGodAnalysis,
} from "./familyParentTenGodAnalysis";
import { buildFamilyKillerSections, type FamilyKillerSections } from "./familyKillerSections";
import {
  isValidParentChildPair,
  resolveParentChildNicknames,
  type FamilyParentPairRoles,
  type FamilyParentRole,
} from "./types";
import type { FamilySajuSignals, FriendshipSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { ChartContext } from "@/lib/saju/chartContext";

export type FamilyRuleContext = {
  nicknameA: string;
  nicknameB: string;
  roles: FamilyParentPairRoles;
  childNickname: string;
  parentNickname: string;
  parentRole: FamilyParentRole;
  parentType: FamilyParentRole;
  sajuJsonParent: SajuDataForIntegrated;
  sajuJsonChild: SajuDataForIntegrated;
  pairAnalysis: PairSajuAnalysis;
  familyPairAnalysis: FamilyPairSajuAnalysis;
  tenGod: FamilyParentTenGodAnalysis;
  killerSections: FamilyKillerSections;
  eventScores: RelationshipEventScores;
  grade: "A" | "B" | "C" | "D";
  gradeReason: string;
  masterScores: FamilyMasterScores;
  uncertainItems: string[];
  locale: Locale;
  /** 006 로드맵 Step3 — 비교표(원가족긴장도/오행/신강신약)용 chart 노출. 기존 필드는 안 건드림(순수 추가). */
  chartParent: ChartContext;
  chartChild: ChartContext;
  canonicalPersonalParent: CanonicalPersonalSajuFacts;
  canonicalPersonalChild: CanonicalPersonalSajuFacts;
  canonicalPairFacts: CanonicalPairSajuFacts;
  /** 006 로드맵 Step3 — 비교표 ⑥(대화온도, johu_profile)용. PersonCore SSOT, 없으면 undefined. */
  friendshipSignalsParent?: FriendshipSajuSignals;
  friendshipSignalsChild?: FriendshipSajuSignals;
  /** Part2 A/B — bond_distance / pair 보강. 없으면 compare table이 counts에서 band 재현. */
  familySignalsParent?: FamilySajuSignals;
  familySignalsChild?: FamilySajuSignals;
  /**
   * true면 시청자=자녀(Track B). 렌더링 순서/레이아웃은 그대로 고정이고
   * (SectionRenderer.tsx의 "viewer 토글 없음" 주석은 레이아웃 기준으로는
   * 여전히 사실), 일부 섹션의 서술 톤만 이 값으로 분기한다.
   */
  childIsViewer: boolean;
  /** Shared Pair CE → Family lens (packets only; no fact recalc). */
  pairLens: DomainPairLensOutput;
};

export type BuildFamilyContextParams = {
  nicknameA: string;
  nicknameB: string;
  roles: FamilyParentPairRoles;
  /** UI에서 선택한 부모 유형 — roles와 불일치 시 roles 우선 */
  parentType?: FamilyParentRole;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  birthPlaceA?: string | null;
  birthPlaceB?: string | null;
  birthTimeUnknownA?: boolean;
  birthTimeUnknownB?: boolean;
  familySignalsA?: FamilySajuSignals;
  familySignalsB?: FamilySajuSignals;
  /** 006 로드맵 Step3 — 비교표 ⑥(대화온도)용. 없으면 해당 행만 neutral 폴백(주석 참조). */
  friendshipSignalsA?: FriendshipSajuSignals;
  friendshipSignalsB?: FriendshipSajuSignals;
  locale?: Locale;
  /** Part3 성장 터널 분석 연도. 생략 시 현재 연도. */
  analysisYear?: number;
  /** true면 시청자=자녀(Track B) — FamilyRuleContext.childIsViewer로 정규화되어 전달됨. */
  childIsViewer?: boolean;
};

function resolveParentType(
  roles: FamilyParentPairRoles,
  parentType?: FamilyParentRole,
): FamilyParentRole {
  const fromRoles = resolveParentChildNicknames({
    nicknameA: "",
    nicknameB: "",
    roles,
  }).parentRole;
  if (parentType && (parentType === "mother" || parentType === "father")) {
    if (fromRoles === parentType) return parentType;
  }
  return fromRoles;
}

/** 가족(자녀-부모) rule context — parentType(엄마/아빠) 렌즈 분기 */
export function buildFamilyRuleContext(
  params: BuildFamilyContextParams,
): FamilyRuleContext {
  if (!isValidParentChildPair(params.roles)) {
    throw new Error(
      "가족(자녀-부모) 분석: 한 명은 child, 다른 한 명은 mother 또는 father 여야 합니다.",
    );
  }

  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const resolved = resolveParentChildNicknames({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    roles: params.roles,
  });

  const parentRole = resolveParentType(params.roles, params.parentType);

  const isParentA = params.roles.roleA !== "child";
  const sajuJsonParent = isParentA ? params.sajuJsonA : params.sajuJsonB;
  const sajuJsonChild = isParentA ? params.sajuJsonB : params.sajuJsonA;
  const familySignalsParent = isParentA ? params.familySignalsA : params.familySignalsB;
  const familySignalsChild = isParentA ? params.familySignalsB : params.familySignalsA;
  const friendshipSignalsParent = isParentA ? params.friendshipSignalsA : params.friendshipSignalsB;
  const friendshipSignalsChild = isParentA ? params.friendshipSignalsB : params.friendshipSignalsA;
  const birthPlaceParent = isParentA ? params.birthPlaceA : params.birthPlaceB;
  const birthPlaceChild = isParentA ? params.birthPlaceB : params.birthPlaceA;
  const birthTimeUnknownParent = isParentA
    ? params.birthTimeUnknownA
    : params.birthTimeUnknownB;
  const birthTimeUnknownChild = isParentA
    ? params.birthTimeUnknownB
    : params.birthTimeUnknownA;

  const blueprint = buildPairSajuBlueprint({
    sajuJsonA: sajuJsonParent,
    sajuJsonB: sajuJsonChild,
    birthPlaceA: birthPlaceParent,
    birthPlaceB: birthPlaceChild,
    birthTimeUnknownA: birthTimeUnknownParent,
    birthTimeUnknownB: birthTimeUnknownChild,
    locale,
  });
  const { core, uncertainItems } = blueprint;

  const familyPairAnalysis = analyzeFamilyPairSaju(
    core.pillarsA,
    core.pillarsB,
    parentRole,
    core.tenGodsB,
    core.tenGodsA,
    core,
  );

  const tenGod = analyzeFamilyParentTenGod({
    parentRole,
    sajuJsonParent,
    sajuJsonChild,
    familyPairAnalysis,
    childNickname: resolved.childNickname,
    locale,
    parentBondBand: familySignalsParent?.seal_parent.parent_bond_band,
  });

  const { grade, reason, eventScores, masterScores } =
    computeFamilyCompatibilityGrade(familyPairAnalysis, parentRole, locale);

  const childIsViewer = params.childIsViewer === true;

  const killerSections = buildFamilyKillerSections({
    ctx: {
      childNickname: resolved.childNickname,
      parentNickname: resolved.parentNickname,
      parentRole,
      familyPairAnalysis,
      tenGod,
      masterScores,
      locale,
      analysisYear: params.analysisYear,
      childIsViewer,
    },
  });

  const canonicalPersonalParent = extractCanonicalPersonalFacts(core.chartA);
  const canonicalPersonalChild = extractCanonicalPersonalFacts(core.chartB);
  const canonicalPairFacts = extractCanonicalPairFacts(core.chartA, core.chartB);

  return {
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    roles: params.roles,
    childNickname: resolved.childNickname,
    parentNickname: resolved.parentNickname,
    parentRole,
    parentType: parentRole,
    sajuJsonParent,
    sajuJsonChild,
    pairAnalysis: familyPairAnalysis.base,
    familyPairAnalysis,
    tenGod,
    killerSections,
    eventScores,
    grade,
    gradeReason: reason,
    masterScores,
    uncertainItems,
    locale,
    chartParent: core.chartA,
    chartChild: core.chartB,
    canonicalPersonalParent,
    canonicalPersonalChild,
    canonicalPairFacts,
    friendshipSignalsParent,
    friendshipSignalsChild,
    familySignalsParent,
    familySignalsChild,
    childIsViewer,
    pairLens: buildDomainPairLensFromCharts(
      "family",
      core.chartA,
      core.chartB,
      {
        birthTimeUnknownA: birthTimeUnknownParent,
        birthTimeUnknownB: birthTimeUnknownChild,
      },
    ),
  };
}

/** @deprecated — buildFamilyRuleContext 사용 */
export type FamilyParentRuleContext = FamilyRuleContext & {
  masterScores: FamilyMasterScores & { support: number };
};

export function buildFamilyParentRuleContext(
  params: BuildFamilyContextParams,
): FamilyParentRuleContext {
  const ctx = buildFamilyRuleContext(params);
  return {
    ...ctx,
    masterScores: {
      ...ctx.masterScores,
      support: ctx.masterScores.synergy,
    },
  };
}
