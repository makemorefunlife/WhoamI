import type { Locale } from "@/lib/i18n/locale";
import {
  getRelationshipRoleById,
  type RelationshipRoleId,
} from "./relationshipRoleSsot";
import { roleLabel } from "./roleLocale";

export type MapShareRoleSummary = { roleId: RelationshipRoleId; count: number };
export type MapShareSummaryInput = { totalPeople: number; roles: MapShareRoleSummary[] };

export type AnonymousMapShareRole = {
  roleId: RelationshipRoleId;
  label: string;
  count: number;
  percent: number;
};

export type AnonymousMapShare = {
  totalPeople: number;
  roles: AnonymousMapShareRole[];
};

/**
 * Anonymizes the map summary for sharing — spec sections 37, and the gap
 * closure's section 7-9. Input is already name-free (the same
 * {roleId, count} shape /api/relationship/map's default payload returns),
 * so this only adds a localized label + percent; it can never reach for a
 * name, email, report id, person id, birth info, survey data, or Day
 * Master value because none of those are present in `MapShareSummaryInput`
 * to begin with.
 */
export function buildAnonymousMapShare(
  summary: MapShareSummaryInput,
  locale: Locale,
): AnonymousMapShare {
  const roles = summary.roles.map((r) => {
    const role = getRelationshipRoleById(r.roleId);
    const label = role ? roleLabel(role, locale) : r.roleId;
    const percent =
      summary.totalPeople > 0 ? Math.round((r.count / summary.totalPeople) * 100) : 0;
    return { roleId: r.roleId, label, count: r.count, percent };
  });
  return { totalPeople: summary.totalPeople, roles };
}
