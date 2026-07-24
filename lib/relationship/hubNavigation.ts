import type { FamilyParentRole } from "@/lib/relationship/familyParent/types";
import type { AnalysisSurface } from "@/lib/relationship/analysisSurface";

export type FamilyPerspective = "parent" | "child";

export function buildRelationshipAnalyzeUrl(
  relationshipReportId: string,
  viewerReportId: string,
  kind: AnalysisSurface,
  family?: {
    perspective: FamilyPerspective;
    parentType?: FamilyParentRole;
  },
  options?: { autostart?: boolean },
): string {
  const params = new URLSearchParams({
    viewer: viewerReportId,
    kind,
  });
  // 기본분석은 심화 autostart 없음. 심화 kind는 기본값 autostart=1
  const autostart =
    kind === "basic" ? options?.autostart === true : options?.autostart !== false;
  if (autostart) {
    params.set("autostart", "1");
  }
  if (kind === "family" && family) {
    params.set(
      "childIsViewer",
      family.perspective === "child" ? "true" : "false",
    );
    params.set("parentType", family.parentType ?? "mother");
  }
  return `/relationship/${relationshipReportId}?${params.toString()}`;
}
