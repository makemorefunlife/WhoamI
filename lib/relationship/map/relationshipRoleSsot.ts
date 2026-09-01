/**
 * "My Relationship Map" — canonical 10-role SSOT.
 *
 * Locked mapping: Ten God (십신, from the viewer's Day Master vs. the other
 * person's Day Master) → a warm, non-clinical relationship-role label used
 * only by the free, deterministic Day-Master map. This is the single source
 * for role copy/icon — do not inline these labels elsewhere.
 */

export type TenGodCode =
  | "jeongin"
  | "pyeonin"
  | "jeonggwan"
  | "pyeongwan"
  | "siksin"
  | "sanggwan"
  | "jeongjae"
  | "pyeonjae"
  | "bigyeon"
  | "geopjae";

export type RelationshipRoleId =
  | "my_person"
  | "muse"
  | "compass"
  | "growth_button"
  | "couch"
  | "mic"
  | "keeper"
  | "explorer"
  | "twin"
  | "spark";

/**
 * Icon key only — actual line-art rendering lives in RolePlanetIcon.tsx.
 * "push_button" MUST render as a large industrial/emergency push switch,
 * never a clothing/sewing button (see growth_button role copy).
 */
export type RelationshipRoleIcon =
  | "heart_outline"
  | "star_outline"
  | "compass_outline"
  | "push_button"
  | "couch_outline"
  | "microphone_outline"
  | "treasure_chest_outline"
  | "telescope_outline"
  | "twin_outline"
  | "flame_outline";

export type RelationshipRoleDefinition = {
  tenGod: TenGodCode;
  roleId: RelationshipRoleId;
  labelKo: string;
  labelEn: string;
  descriptionKo: string;
  descriptionEn: string;
  icon: RelationshipRoleIcon;
};

/** Display order used throughout the map (planet layout, role list, etc). */
export const RELATIONSHIP_ROLES: readonly RelationshipRoleDefinition[] = [
  {
    tenGod: "jeongin",
    roleId: "my_person",
    labelKo: "내 편",
    labelEn: "My Person",
    descriptionKo: "나를 이해하고 든든하게 받쳐주는 사람들",
    descriptionEn: "People who make you feel supported and understood.",
    icon: "heart_outline",
  },
  {
    tenGod: "pyeonin",
    roleId: "muse",
    labelKo: "뮤즈",
    labelEn: "Muse",
    descriptionKo: "새로운 생각과 관점을 열어주는 사람들",
    descriptionEn: "People who help you see things differently.",
    icon: "star_outline",
  },
  {
    tenGod: "jeonggwan",
    roleId: "compass",
    labelKo: "나침반",
    labelEn: "Compass",
    descriptionKo: "내가 중심과 방향을 잃지 않게 해주는 사람들",
    descriptionEn: "People who help you find your footing and direction.",
    icon: "compass_outline",
  },
  {
    tenGod: "pyeongwan",
    roleId: "growth_button",
    labelKo: "성장 버튼",
    labelEn: "Growth Button",
    descriptionKo: "나를 긴장시키기도 하지만 결국 더 단단하게 만드는 사람들",
    descriptionEn: "People who push your buttons and push you to grow.",
    icon: "push_button",
  },
  {
    tenGod: "siksin",
    roleId: "couch",
    labelKo: "소파",
    labelEn: "Couch",
    descriptionKo: "힘을 빼고 가장 편하게 나다울 수 있는 사람들",
    descriptionEn: "People you can completely exhale around.",
    icon: "couch_outline",
  },
  {
    tenGod: "sanggwan",
    roleId: "mic",
    labelKo: "마이크",
    labelEn: "Mic",
    descriptionKo: "내 안의 말과 생각을 밖으로 꺼내게 하는 사람들",
    descriptionEn: "People who bring your thoughts and feelings out into the open.",
    icon: "microphone_outline",
  },
  {
    tenGod: "jeongjae",
    roleId: "keeper",
    labelKo: "보물",
    labelEn: "Keeper",
    descriptionKo: "자연스럽게 아끼고 챙기고 싶어지는 사람들",
    descriptionEn: "People you naturally want to care for and keep close.",
    icon: "treasure_chest_outline",
  },
  {
    tenGod: "pyeonjae",
    roleId: "explorer",
    labelKo: "탐험가",
    labelEn: "Explorer",
    descriptionKo: "익숙한 세계 밖으로 데리고 나가 경험을 넓혀주는 사람들",
    descriptionEn: "People who pull you beyond the familiar and widen your world.",
    icon: "telescope_outline",
  },
  {
    tenGod: "bigyeon",
    roleId: "twin",
    labelKo: "짝꿍",
    labelEn: "Twin",
    descriptionKo: "비슷한 눈높이와 결로 함께 움직이는 사람들",
    descriptionEn: 'People who make you think, "Wait, you too?"',
    icon: "twin_outline",
  },
  {
    tenGod: "geopjae",
    roleId: "spark",
    labelKo: "불꽃",
    labelEn: "Spark",
    descriptionKo: "내 에너지와 승부욕을 끌어올리는 사람들",
    descriptionEn: "People who light a fire under you and get your energy moving.",
    icon: "flame_outline",
  },
] as const;

const roleByTenGod = new Map<TenGodCode, RelationshipRoleDefinition>(
  RELATIONSHIP_ROLES.map((role) => [role.tenGod, role]),
);
const roleById = new Map<RelationshipRoleId, RelationshipRoleDefinition>(
  RELATIONSHIP_ROLES.map((role) => [role.roleId, role]),
);

export function isTenGodCode(v: unknown): v is TenGodCode {
  return typeof v === "string" && roleByTenGod.has(v as TenGodCode);
}

export function isRelationshipRoleId(v: unknown): v is RelationshipRoleId {
  return typeof v === "string" && roleById.has(v as RelationshipRoleId);
}

/** Throws if `tenGod` isn't one of the 10 canonical codes — every stem pair must map to exactly one role. */
export function getRelationshipRoleByTenGod(
  tenGod: string,
): RelationshipRoleDefinition {
  const role = roleByTenGod.get(tenGod as TenGodCode);
  if (!role) {
    throw new Error(`relationshipRoleSsot: unknown Ten God code "${tenGod}"`);
  }
  return role;
}

export function getRelationshipRoleById(
  roleId: string,
): RelationshipRoleDefinition | undefined {
  return roleById.get(roleId as RelationshipRoleId);
}
