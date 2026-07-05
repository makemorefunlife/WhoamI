/**
 * 가족 관계 pair metadata — 자녀-부모 역할 (엄마/아빠 분리)
 *
 * TODO: relationship_reports.family_roles jsonb 컬럼 또는 pair 설정 UI와 연동
 */
import type { FamilyParentPairRoles, FamilyPairRole } from "@/lib/relationship/familyParent/types";
import { FAMILY_ROLE_LABELS } from "@/lib/relationship/familyParent/types";

export type FamilyRolePickerValue = FamilyParentPairRoles;

export const FAMILY_PARENT_ROLE_OPTIONS: {
  value: FamilyPairRole;
  label: string;
  description: string;
}[] = [
  {
    value: "child",
    label: FAMILY_ROLE_LABELS.child,
    description: "자녀 · 아들/딸",
  },
  {
    value: "mother",
    label: FAMILY_ROLE_LABELS.mother,
    description: "엄마 · 모",
  },
  {
    value: "father",
    label: FAMILY_ROLE_LABELS.father,
    description: "아빠 · 부",
  },
];

/** 기본값 — UX 연동 전 임시 (A=자녀, B=엄마) */
export function defaultFamilyParentRoles(): FamilyParentPairRoles {
  return { roleA: "child", roleB: "mother" };
}
