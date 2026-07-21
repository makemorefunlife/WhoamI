import type { FamilyParentReportBody } from "@/lib/relationship/familyParent/buildFamilyParentReport";

export const FAMILY_PARENT_CHILD_DEEP_FORMAT =
  "family_parent_child_deep_v2" as const;

export type FamilyParentChildDeepReport = {
  format: typeof FAMILY_PARENT_CHILD_DEEP_FORMAT;
  report: FamilyParentReportBody;
};

export function isFamilyParentChildDeepReport(
  payload: unknown,
): payload is FamilyParentChildDeepReport {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as FamilyParentChildDeepReport;
  // v1·구형 compare = 캐시 miss → 다음 요청에서 Part2 person-contrast meaning으로 재생성
  const compareTable = p.report?.family?.section_compare_table;
  const firstMeaning =
    Array.isArray(compareTable) && compareTable[0]
      ? String((compareTable[0] as { meaning?: string }).meaning ?? "")
      : "";
  const hasPersonContrastLead =
    /쪽은 ‘|모두 ‘|share the same person signal|”: “/.test(firstMeaning);
  return (
    p.format === FAMILY_PARENT_CHILD_DEEP_FORMAT &&
    Boolean(p.report?.family?.section_child_dna?.genius_title) &&
    Array.isArray(compareTable) &&
    compareTable.length > 0 &&
    hasPersonContrastLead
  );
}
