import type { FamilyParentPairRoles, FamilyParentRole } from "./types";

export function resolveFamilyRolesFromViewer(params: {
  viewerReportId: string;
  reportIdA: string;
  reportIdB: string;
  parentType: FamilyParentRole;
  /** true = 시청자(나)가 자녀 */
  childIsViewer: boolean;
}): FamilyParentPairRoles {
  const viewerIsA = params.viewerReportId === params.reportIdA;
  const child = "child" as const;
  const parent = params.parentType;

  if (params.childIsViewer) {
    return viewerIsA
      ? { roleA: child, roleB: parent }
      : { roleA: parent, roleB: child };
  }
  return viewerIsA
    ? { roleA: parent, roleB: child }
    : { roleA: child, roleB: parent };
}
