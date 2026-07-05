import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";
import type { RelationshipEventScores } from "@/lib/relationship/pairEventScores";
import { buildSajuUncertainItems } from "@/lib/saju/sajuUncertainItems";
import { sajuJsonToPillars, type PairSajuAnalysis } from "@/lib/saju/pairChartAnalysis";
import {
  analyzeFamilyPairSaju,
  type FamilyPairSajuAnalysis,
} from "@/lib/saju/familyAnalysis";
import { validateSajuPillars } from "@/lib/saju/validateSajuBundle";
import {
  computeFamilyCompatibilityGrade,
  type FamilyMasterScores,
} from "./familyEventScores";
import {
  analyzeFamilyParentTenGod,
  countTenGodsForFamilyParent,
  type FamilyParentTenGodAnalysis,
} from "./familyParentTenGodAnalysis";
import { buildFamilyKillerSections, type FamilyKillerSections } from "./familyKillerSections";
import {
  isValidParentChildPair,
  resolveParentChildNicknames,
  type FamilyParentPairRoles,
  type FamilyParentRole,
} from "./types";

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

  const resolved = resolveParentChildNicknames({
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    roles: params.roles,
  });

  const parentRole = resolveParentType(params.roles, params.parentType);

  const isParentA = params.roles.roleA !== "child";
  const sajuJsonParent = isParentA ? params.sajuJsonA : params.sajuJsonB;
  const sajuJsonChild = isParentA ? params.sajuJsonB : params.sajuJsonA;
  const birthPlaceParent = isParentA ? params.birthPlaceA : params.birthPlaceB;
  const birthPlaceChild = isParentA ? params.birthPlaceB : params.birthPlaceA;
  const birthTimeUnknownParent = isParentA
    ? params.birthTimeUnknownA
    : params.birthTimeUnknownB;
  const birthTimeUnknownChild = isParentA
    ? params.birthTimeUnknownB
    : params.birthTimeUnknownA;

  const pillarsParent = sajuJsonToPillars(
    sajuJsonParent.saju as Required<NonNullable<typeof sajuJsonParent.saju>>,
  );
  const pillarsChild = sajuJsonToPillars(
    sajuJsonChild.saju as Required<NonNullable<typeof sajuJsonChild.saju>>,
  );

  const countsParent = countTenGodsForFamilyParent(sajuJsonParent);
  const countsChild = countTenGodsForFamilyParent(sajuJsonChild);

  const familyPairAnalysis = analyzeFamilyPairSaju(
    pillarsParent,
    pillarsChild,
    parentRole,
    countsChild,
    countsParent,
  );

  const tenGod = analyzeFamilyParentTenGod({
    parentRole,
    sajuJsonParent,
    sajuJsonChild,
    familyPairAnalysis,
    childNickname: resolved.childNickname,
  });

  const { grade, reason, eventScores, masterScores } =
    computeFamilyCompatibilityGrade(familyPairAnalysis, parentRole);

  const killerSections = buildFamilyKillerSections({
    ctx: {
      childNickname: resolved.childNickname,
      parentNickname: resolved.parentNickname,
      parentRole,
      familyPairAnalysis,
      tenGod,
      masterScores,
    },
  });

  const validationParent = validateSajuPillars(pillarsParent, {
    birthTimeUnknown: birthTimeUnknownParent,
  });
  const validationChild = validateSajuPillars(pillarsChild, {
    birthTimeUnknown: birthTimeUnknownChild,
  });

  const uncertainItems = [
    ...buildSajuUncertainItems({
      birthPlace: birthPlaceParent ?? undefined,
      validationNotes: validationParent.notes,
    }),
    ...buildSajuUncertainItems({
      birthPlace: birthPlaceChild ?? undefined,
      validationNotes: validationChild.notes,
    }),
  ];

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
