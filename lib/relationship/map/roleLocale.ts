import type { Locale } from "@/lib/i18n/locale";
import type { RelationshipRoleDefinition } from "./relationshipRoleSsot";

/**
 * The role SSOT is bilingual by design (spec section 4: "Create ONE
 * canonical source for... KR label, EN label..."), so role copy is read
 * straight from it rather than duplicated into the ko-KR/en-US catalogs.
 */
export function roleLabel(role: RelationshipRoleDefinition, locale: Locale): string {
  return locale === "ko-KR" ? role.labelKo : role.labelEn;
}

export function roleDescription(
  role: RelationshipRoleDefinition,
  locale: Locale,
): string {
  return locale === "ko-KR" ? role.descriptionKo : role.descriptionEn;
}
