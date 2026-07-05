import type { FamilyRuleContext } from "./buildFamilyRuleContext";
import type {
  ChildDnaSection,
  DestinyScoreSection,
  FilialRewardSection,
  GrowthTunnelSection,
  FamilySnapshotSection,
} from "./familyKillerSections";
import type { ChildDeEscalationCard } from "./childDeEscalationPrescriptions";
import type { FamilyParentRole } from "./types";

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
};

export function buildFamilyParentChildReport(
  ctx: FamilyRuleContext,
): FamilyParentChildReport {
  const roleLabel = ctx.parentRole === "mother" ? "엄마" : "아빠";
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
