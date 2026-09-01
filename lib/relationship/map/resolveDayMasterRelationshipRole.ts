import { calculateTenGod } from "@/lib/saju/repository";
import {
  getRelationshipRoleByTenGod,
  type RelationshipRoleId,
  type TenGodCode,
} from "./relationshipRoleSsot";

export type DayMasterRelationshipRoleInput = {
  /** Viewer's Day Master stem code, e.g. "jeong" (정). */
  viewerDayMaster: string;
  /** The other person's Day Master stem code, e.g. "gap" (갑). */
  otherDayMaster: string;
};

export type DayMasterRelationshipRoleResult = {
  tenGod: TenGodCode;
  roleId: RelationshipRoleId;
};

/**
 * FREE-tier relationship-map role: viewer Day Master x other person's Day
 * Master -> Ten God -> role. Deterministic, no LLM, no full 8-character
 * pair analysis (that belongs to a future paid layer — see AGENTS.md /
 * the Relationship Map spec section 13).
 *
 * Always viewer-centered: resolveDayMasterRelationshipRole({viewer, other})
 * for A-vs-B is not the same as viewer/other swapped, because
 * calculateTenGod(dayStem, targetStem) is not a symmetric relation.
 */
export function resolveDayMasterRelationshipRole({
  viewerDayMaster,
  otherDayMaster,
}: DayMasterRelationshipRoleInput): DayMasterRelationshipRoleResult {
  const tenGodCode = calculateTenGod(viewerDayMaster, otherDayMaster);
  const role = getRelationshipRoleByTenGod(tenGodCode);
  return { tenGod: role.tenGod, roleId: role.roleId };
}
