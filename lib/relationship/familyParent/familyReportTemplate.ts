import type { FamilyRuleContext } from "./buildFamilyRuleContext";
import type {
  ChildDnaSection,
  DestinyScoreSection,
  FilialRewardSection,
  GrowthTunnelSection,
  FamilySnapshotSection,
} from "./familyKillerSections";
import type { ChildDeEscalationCard } from "./childDeEscalationPrescriptions";
import { pick } from "./familyParentCopy";
import type { FamilyParentRole } from "./types";
import type { FamilyCompareRow } from "./familySajuCompareTable";
import type { FamilyHouseholdRolesSection } from "./buildFamilyHouseholdRoles";
import type { FamilyRoleSection } from "./familyPsychRoles";
import type { FamilyRelationshipIndexSection } from "./familyRelationshipIndexSection";
import type { FamilyTalentSection } from "./familyTalentProfile";
import type { FamilySosSection } from "./familySosScript";

export type FamilyRoleMetaSection = {
  child_nickname: string;
  parent_nickname: string;
  parent_role: FamilyParentRole;
  parent_role_label: string;
};

export type FamilyParentChildReport = {
  section_roles: FamilyRoleMetaSection;
  section_child_dna: ChildDnaSection;
  section_snapshot: FamilySnapshotSection;
  section_destiny: DestinyScoreSection;
  section_growth_tunnel: GrowthTunnelSection;
  section_filial_reward: FilialRewardSection;
  section_de_escalation: ChildDeEscalationCard;
  parent_lens_summary: string;
  /** 006/007 로드맵 Step3 — 신규 추가 필드. 기존 필드는 전혀 안 바뀜(순수 추가). */
  section_compare_table?: FamilyCompareRow[];
  /** Part2 — 기존 A/B/C·pair bucket 조합. 구형 캐시에는 없을 수 있음. */
  section_household_roles?: FamilyHouseholdRolesSection;
  /** Part3 — 6대 심리 역할(해결사/중재자/희생자/독립자/감정쓰레기통/강아지). psych 없으면 null. */
  section_family_role?: FamilyRoleSection | null;
  /** Part1 — 훈육 마찰 지수(Track A) / 소통 엇박자 진단(Track B). */
  section_relationship_index?: FamilyRelationshipIndexSection;
  /** Part2 — 공부 타입 & 성공 그릇(Track A) / 부모님 기질 이해(Track B). */
  section_talent?: FamilyTalentSection;
  /** Part5 — 비상시 SOS 룰(Track A: 자녀 위기 대응 / Track B: 부모 케어). */
  section_sos_script?: FamilySosSection;
};

export function buildFamilyParentChildReport(
  ctx: FamilyRuleContext,
): FamilyParentChildReport {
  const roleLabel = pick(
    ctx.locale,
    ctx.parentRole === "mother" ? "Mom" : "Dad",
    ctx.parentRole === "mother" ? "엄마" : "아빠",
  );
  const k = ctx.killerSections;

  return {
    section_roles: {
      child_nickname: ctx.childNickname,
      parent_nickname: ctx.parentNickname,
      parent_role: ctx.parentRole,
      parent_role_label: roleLabel,
    },
    section_child_dna: k.section_child_dna,
    section_snapshot: k.section_snapshot,
    section_destiny: k.section_destiny,
    section_growth_tunnel: k.section_growth_tunnel,
    section_filial_reward: k.section_filial_reward,
    section_de_escalation: k.section_de_escalation,
    parent_lens_summary: ctx.tenGod.parentProfile.lens_summary,
  };
}
