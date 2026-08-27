import type { PsychMatchResult } from "@/lib/relationship/psychMatch";
import type { DomainPsychLens } from "@/lib/relationship/psychDomainLens/types";
import { buildFamilyPsychMatchBundle } from "@/lib/relationship/psychDomainLens/buildFamilyPsychMatch";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import {
  buildPersonCoreRelationMeta,
  type PersonCoreRelationMetaPayload,
} from "@/lib/personCore/mappers/buildPersonCoreRelationMeta";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { TriScoreSnapshotPanel } from "@/lib/relationship/triScoreSnapshot/types";
import { buildFamilyRuleContext } from "./buildFamilyRuleContext";
import type { FamilyParentPairRoles, FamilyParentRole } from "./types";
import { buildFamilyParentSnapshotPanel } from "./buildFamilySnapshotPanel";
import {
  buildFamilyParentChildReport,
  type FamilyParentChildReport,
} from "./familyReportTemplate";
import { buildFamilyPrescriptions } from "./buildFamilyPrescriptions";
import { pick, LEGACY_FALLBACK_LOCALE } from "./familyParentCopy";
import type { Locale } from "@/lib/i18n/locale";
import type { FamilyPrescriptionPack } from "./familyPrescriptionTypes";
import type { PairFamilySignals } from "@/lib/personCore/sajuSignals/pairTypes";
import type { FamilySajuSignals, FriendshipSajuSignals } from "@/lib/personCore/sajuSignals/types";
import { buildFamilySajuCompareTable } from "./familySajuCompareTable";
import {
  buildFamilyComparisonTableCanonical,
  buildFamilyComparisonTableClientProjection,
  comparisonTableValueFromResolver,
  injectFamilyComparisonTableClientProjection,
  type FamilyComparisonTableValue,
} from "./familyComparisonTableCanonical";
import { buildFamilyHouseholdRoles } from "./buildFamilyHouseholdRoles";
import { appendFilialRecognitionEnrichment } from "./familyRecognitionEnrichment";
import { buildFamilyRoleSection } from "./familyPsychRoles";
import { buildFamilyRelationshipIndexSection } from "./familyRelationshipIndexSection";
import { buildFamilyTalentSection } from "./familyTalentProfile";
import { applyFamilyTalentPsychAuxNotes } from "./familyTalentAlign";
import { buildFamilySosSection } from "./familySosScript";
import { buildFamilyPraiseTriggerNote } from "@/lib/relationship/enrichment/familyPraiseTriggerNote";
import {
  buildParentGivingLine,
  buildAchievementPressureLine,
  buildRelationshipEvolutionLine,
} from "@/lib/relationship/enrichment/familyParentSajuGapInsights";
import {
  buildInterferenceTriggerLine,
  buildRoleReversalLine,
  buildLoveLanguageLine,
} from "@/lib/relationship/enrichment/familyParentPsychGapInsights";
import { buildFamilyFilialFrequencySection } from "./familyFilialFrequency";
import {
  buildFamilyContextOutput,
  type FamilyContextOutput,
} from "./familyContextOutput";
import { buildCanonicalFamilyStoryPlan } from "./buildCanonicalFamilyStoryPlan";
import type { CanonicalFamilyStoryPlan } from "./familyStoryPlanTypes";

/**
 * Family report-schema SSOT (Phase 3A). Increment whenever the persisted
 * report shape or required canonical content changes such that previously
 * generated reports must regenerate. isStaleFamilyReportBlock in
 * reportStalenessGuard.ts is the read side of this contract.
 */
export const FAMILY_REPORT_SCHEMA_VERSION = 1;

export type FamilyParentReportBody = {
  headline: string;
  summary_line: string;
  one_line_family: string;
  snapshot_panel: TriScoreSnapshotPanel;
  family: FamilyParentChildReport;
  meta: {
    /** Report-schema SSOT — see FAMILY_REPORT_SCHEMA_VERSION. */
    report_schema_version: number;
    grade: string;
    grade_reason: string;
    uncertain_items: string[];
    bond_pct: number;
    synergy_pct: number;
    risk_pct: number;
    parent_role: FamilyParentRole;
    parent_type: FamilyParentRole;
    child_nickname: string;
    parent_nickname: string;
    nickname_a: string;
    nickname_b: string;
    person_core?: PersonCoreRelationMetaPayload;
    psych_match?: PsychMatchResult | null;
    psych_lens?: DomainPsychLens | null;
    psych_master_a?: PsychMasterJson | null;
    psych_master_b?: PsychMasterJson | null;
    /** pair.family 교차 신호 기반 실행 처방전 */
    prescription_family?: FamilyPrescriptionPack;
    /**
     * Round 2 — familySajuDeep LLM explain overlay (optional).
     * Does not own classifications; CE projections remain SSOT.
     */
    family_saju_deep?: import("@/lib/prompts/relationshipPremium/familySajuDeep").FamilySajuDeepReport;
    locale?: string;
    language?: string;
  };
  /**
   * Context Output — 이미 계산된 ctx/section 재포장.
   * 옵셔널·순수 추가. 기존 필드·문구·캐시 소비처는 미사용.
   */
  context_output?: FamilyContextOutput;
  /**
   * Typed Context Engine projections for MUST judgments.
   * Survives strip (context_output only removed). Legacy reports omit.
   */
  canonical_projections?: {
    comparison_table?: FamilyComparisonTableValue;
    story_plan?: CanonicalFamilyStoryPlan;
  };
};

import { buildFamilyParentDna } from "./familyParentDna";

export function buildFamilyParentReport(params: {
  nicknameA: string;
  nicknameB: string;
  roles: FamilyParentPairRoles;
  parentType?: FamilyParentRole;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  birthPlaceA?: string | null;
  birthPlaceB?: string | null;
  birthTimeUnknownA?: boolean;
  birthTimeUnknownB?: boolean;
  psychMasterA?: PsychMasterJson | null;
  psychMasterB?: PsychMasterJson | null;
  personCoreMeta?: {
    reportIdA: string;
    reportIdB: string;
    inputFingerprintA: string;
    inputFingerprintB: string;
  };
  pairFamily?: PairFamilySignals | null;
  familySignalsA?: FamilySajuSignals;
  familySignalsB?: FamilySajuSignals;
  /** 006 로드맵 Step3 — 비교표 ⑥(대화온도)용. 없으면 해당 행만 neutral 폴백. */
  friendshipSignalsA?: FriendshipSajuSignals;
  friendshipSignalsB?: FriendshipSajuSignals;
  locale?: Locale;
  /** Part3 성장 터널 분석 연도. 생략 시 현재 연도. */
  analysisYear?: number;
  /** true면 시청자=자녀 — household_roles 나/상대 매핑용 */
  childIsViewer?: boolean;
}): FamilyParentReportBody {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const ctx = buildFamilyRuleContext({ ...params, locale });
  const psychChild =
    ctx.roles.roleA !== "child"
      ? (params.psychMasterB ?? null)
      : (params.psychMasterA ?? null);
  const psychParent =
    ctx.roles.roleA !== "child"
      ? (params.psychMasterA ?? null)
      : (params.psychMasterB ?? null);
  const { parentDna, parentChildBridge } = buildFamilyParentDna(ctx, {
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
  });

  const family: FamilyParentChildReport = {
    ...buildFamilyParentChildReport(ctx),
    section_parent_dna: parentDna,
    section_parent_child_bridge: parentChildBridge,
    section_compare_table: buildFamilySajuCompareTable({
      parentNickname: ctx.parentNickname,
      childNickname: ctx.childNickname,
      countsParent: ctx.tenGod.countsParent,
      countsChild: ctx.tenGod.countsChild,
      chartParent: ctx.chartParent,
      chartChild: ctx.chartChild,
      friendshipSignalsParent: ctx.friendshipSignalsParent,
      friendshipSignalsChild: ctx.friendshipSignalsChild,
      familySignalsParent: ctx.familySignalsParent,
      familySignalsChild: ctx.familySignalsChild,
      pairFamily: params.pairFamily,
      parentRole: ctx.parentRole,
      locale,
    }),
    section_household_roles: buildFamilyHouseholdRoles({
      parentNickname: ctx.parentNickname,
      childNickname: ctx.childNickname,
      countsParent: ctx.tenGod.countsParent,
      countsChild: ctx.tenGod.countsChild,
      familySignalsParent: ctx.familySignalsParent,
      familySignalsChild: ctx.familySignalsChild,
      pairFamily: params.pairFamily,
      viewerIsChild: ctx.childIsViewer,
      locale,
      ctx,
      personCorePsych: {
        psychA: params.psychMasterA,
        psychB: params.psychMasterB,
      },
    }),
    section_family_role: buildFamilyRoleSection(
      psychChild,
      ctx.childNickname,
      locale,
      ctx.childIsViewer,
    ),
    section_relationship_index: buildFamilyRelationshipIndexSection({
      pairFamily: params.pairFamily,
      fallbackRisk: ctx.masterScores.risk,
      psychChild,
      psychParent:
        ctx.roles.roleA !== "child"
          ? (params.psychMasterA ?? null)
          : (params.psychMasterB ?? null),
      childIsViewer: ctx.childIsViewer,
      locale,
    }),
    // 사주 SSOT 노트 → Track A에서만 자녀 psych 절대밴드 보조 문장 (enum 불변)
    section_talent: applyFamilyTalentPsychAuxNotes(
      buildFamilyTalentSection({
        countsChild: ctx.tenGod.countsChild,
        countsParent: ctx.tenGod.countsParent,
        childNickname: ctx.childNickname,
        parentNickname: ctx.parentNickname,
        childIsViewer: ctx.childIsViewer,
        locale,
      }),
      {
        psychChild,
        childIsViewer: ctx.childIsViewer,
        locale,
      },
    ),
    section_sos_script: buildFamilySosSection({
      scoringSignals: ctx.familyPairAnalysis.scoringSignals,
      countsParent: ctx.tenGod.countsParent,
      childNickname: ctx.childNickname,
      parentNickname: ctx.parentNickname,
      childIsViewer: ctx.childIsViewer,
      locale,
    }),
    section_filial_frequency: buildFamilyFilialFrequencySection({
      countsParent: ctx.tenGod.countsParent,
      parentNickname: ctx.parentNickname,
      childIsViewer: ctx.childIsViewer,
      locale,
    }),
  };

  const snapshot_panel = buildFamilyParentSnapshotPanel(
    ctx,
    {
      gaugeLabel: pick(locale, "Child DNA Playbook · Family Snapshot", "Child DNA Playbook · 패밀리 스냅샷"),
      representativeLine: family.section_snapshot.one_line_family,
    },
    {
      psychA: params.psychMasterA ?? null,
      psychB: params.psychMasterB ?? null,
    },
  );

  const personCoreMeta = buildPersonCoreRelationMeta(params);
  const psychBundle = buildFamilyPsychMatchBundle(
    params.psychMasterA,
    params.psychMasterB,
    locale,
  );

  if (psychBundle?.psych_match) {
    family.section_filial_reward = {
      ...family.section_filial_reward,
      future_reward: appendFilialRecognitionEnrichment(
        family.section_filial_reward.future_reward,
        psychBundle.psych_match,
        locale,
      ),
    };
  }

  family.section_child_dna = {
    ...family.section_child_dna,
    praise_trigger_note: buildFamilyPraiseTriggerNote({
      childNickname: ctx.childNickname,
      parentNickname: ctx.parentNickname,
      psychChild,
      locale,
    }),
  };

  // ---- 가족 6개 갭 항목 — 데이터 원천 분리 원칙(사용자 지정) ----
  // 사주 Pair CE만: 1(부모가 채워줘야 할 것), 2(성취 압박), 3(관계 진화)
  // 11축 psych만: 4(간섭 트리거), 5(역할 역전), 6(사랑의 언어)
  // 새 카드 없이 기존 필드에 append — join(...)은 falsy를 건너뛴다.
  const join = (...parts: Array<string | null | undefined>) =>
    parts.filter((p): p is string => Boolean(p && p.trim())).join(" ");

  const parentGivingLine = buildParentGivingLine({
    chartParent: ctx.chartParent,
    chartChild: ctx.chartChild,
    parentNickname: ctx.parentNickname,
    childNickname: ctx.childNickname,
    locale,
  });
  const achievementPressureLine = buildAchievementPressureLine({
    countsParent: ctx.tenGod.countsParent,
    parentNickname: ctx.parentNickname,
    childNickname: ctx.childNickname,
    locale,
  });
  const relationshipEvolutionLine = buildRelationshipEvolutionLine({
    pairFamily: params.pairFamily,
    parentNickname: ctx.parentNickname,
    childNickname: ctx.childNickname,
    locale,
  });
  const interferenceTriggerLine = buildInterferenceTriggerLine({
    psychParent,
    psychChild,
    parentNickname: ctx.parentNickname,
    childNickname: ctx.childNickname,
    locale,
  });
  const roleReversalLine = buildRoleReversalLine({
    psychParent,
    psychChild,
    parentNickname: ctx.parentNickname,
    childNickname: ctx.childNickname,
    locale,
  });
  const loveLanguageLine = buildLoveLanguageLine({
    psychParent,
    psychChild,
    parentNickname: ctx.parentNickname,
    childNickname: ctx.childNickname,
    locale,
  });

  // 항목 1 — 부모가 해줘야 할 것 / 아이가 원하는 것.
  family.parent_lens_summary = join(family.parent_lens_summary, parentGivingLine);
  // 항목 2 — 통제 vs 자율 & 성취 기대.
  family.section_growth_tunnel = {
    ...family.section_growth_tunnel,
    current_challenge: join(family.section_growth_tunnel.current_challenge, achievementPressureLine),
  };
  // 항목 3 — 성장하며 관계가 어떻게 바뀌어야 하는가.
  family.section_destiny = {
    ...family.section_destiny,
    harmony_one_liner: join(family.section_destiny.harmony_one_liner, relationshipEvolutionLine),
  };
  // 항목 4 — 간섭으로 느껴지는 지점.
  if (family.section_relationship_index) {
    family.section_relationship_index = {
      ...family.section_relationship_index,
      safe_distance_note: join(family.section_relationship_index.safe_distance_note, interferenceTriggerLine),
    };
  }
  // 항목 5 — 누가 보호하고 누가 기대는가.
  if (family.section_sos_script) {
    family.section_sos_script = {
      ...family.section_sos_script,
      sos_line: join(family.section_sos_script.sos_line, roleReversalLine),
    };
  }
  // 항목 6 — 사랑과 관심을 어떻게 표현하는가.
  if (family.section_household_roles) {
    family.section_household_roles = {
      ...family.section_household_roles,
      complement: join(family.section_household_roles.complement, loveLanguageLine),
    };
  }

  const prescription_family = buildFamilyPrescriptions({
    pair: params.pairFamily ?? null,
    parentNickname: ctx.parentNickname,
    childNickname: ctx.childNickname,
    locale,
  });

  const comparisonTyped = comparisonTableValueFromResolver({
    countsParent: ctx.tenGod.countsParent,
    countsChild: ctx.tenGod.countsChild,
    chartParent: ctx.chartParent,
    chartChild: ctx.chartChild,
    familySignalsParent: ctx.familySignalsParent,
    familySignalsChild: ctx.familySignalsChild,
  });
  const comparisonProjection = buildFamilyComparisonTableClientProjection(
    buildFamilyComparisonTableCanonical(comparisonTyped)?.value,
  );

  let reportBody: FamilyParentReportBody = {
    headline: family.section_snapshot.one_line_family,
    summary_line: `🔥 ${ctx.masterScores.bond}% · 🧩 ${ctx.masterScores.synergy}% · ⚡ ${ctx.masterScores.risk}%`,
    one_line_family: family.section_snapshot.one_line_family,
    snapshot_panel,
    family,
    meta: {
      report_schema_version: FAMILY_REPORT_SCHEMA_VERSION,
      grade: ctx.grade,
      grade_reason: ctx.gradeReason,
      uncertain_items: ctx.uncertainItems,
      bond_pct: ctx.masterScores.bond,
      synergy_pct: ctx.masterScores.synergy,
      risk_pct: ctx.masterScores.risk,
      parent_role: ctx.parentRole,
      parent_type: ctx.parentType,
      child_nickname: ctx.childNickname,
      parent_nickname: ctx.parentNickname,
      nickname_a: ctx.nicknameA,
      nickname_b: ctx.nicknameB,
      psych_master_a: params.psychMasterA ?? null,
      psych_master_b: params.psychMasterB ?? null,
      ...(personCoreMeta ? { person_core: personCoreMeta } : {}),
      ...(psychBundle
        ? {
            psych_match: psychBundle.psych_match,
            psych_lens: psychBundle.psych_lens,
          }
        : {}),
      prescription_family,
    },
    context_output: buildFamilyContextOutput(ctx, family, {
      personCoreMeta: params.personCoreMeta,
      psychChild,
    }),
    canonical_projections: {
      story_plan: buildCanonicalFamilyStoryPlan(ctx, family, psychParent, psychChild),
    },
  };

  reportBody = injectFamilyComparisonTableClientProjection(
    reportBody,
    comparisonProjection,
  );

  return reportBody;
}
