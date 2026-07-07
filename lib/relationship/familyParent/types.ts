/** 가족 관계 — 부모 역할 (1차: 엄마 / 아빠 분리) */
export type FamilyParentRole = "mother" | "father";

/** 가족 관계 — 자녀 */
export type FamilyChildRole = "child";

export type FamilyPairRole = FamilyParentRole | FamilyChildRole;

export type FamilyParentPairRoles = {
  /** report A 쪽 역할 */
  roleA: FamilyPairRole;
  /** report B 쪽 역할 */
  roleB: FamilyPairRole;
};

export function isValidParentChildPair(roles: FamilyParentPairRoles): boolean {
  const set = new Set([roles.roleA, roles.roleB]);
  if (!set.has("child")) return false;
  return set.has("mother") || set.has("father");
}

export function resolveParentChildNicknames(params: {
  nicknameA: string;
  nicknameB: string;
  roles: FamilyParentPairRoles;
}): {
  childNickname: string;
  parentNickname: string;
  parentRole: FamilyParentRole;
} {
  if (params.roles.roleA === "child") {
    return {
      childNickname: params.nicknameA,
      parentNickname: params.nicknameB,
      parentRole:
        params.roles.roleB === "father" ? "father" : "mother",
    };
  }
  return {
    childNickname: params.nicknameB,
    parentNickname: params.nicknameA,
    parentRole: params.roles.roleA === "father" ? "father" : "mother",
  };
}

export const FAMILY_ROLE_LABELS: Record<FamilyPairRole, string> = {
  mother: "엄마",
  father: "아빠",
  child: "자녀",
};
