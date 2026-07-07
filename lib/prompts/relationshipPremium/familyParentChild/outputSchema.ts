import type { FamilyParentReportBody } from "@/lib/relationship/familyParent/buildFamilyParentReport";

export const FAMILY_PARENT_CHILD_DEEP_FORMAT =
  "family_parent_child_deep_v1" as const;

export type FamilyParentChildDeepReport = {
  format: typeof FAMILY_PARENT_CHILD_DEEP_FORMAT;
  report: FamilyParentReportBody;
};

export function isFamilyParentChildDeepReport(
  payload: unknown,
): payload is FamilyParentChildDeepReport {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as FamilyParentChildDeepReport;
  return (
    p.format === FAMILY_PARENT_CHILD_DEEP_FORMAT &&
    Boolean(p.report?.family?.section_child_dna?.genius_title)
  );
}
