import type { FamilyParentRole } from "@/lib/relationship/familyParent/types";
import type { RelationshipKind } from "@/lib/relationship/relationshipKind";

export type FamilyPerspective = "parent" | "child";

export function buildRelationshipAnalyzeUrl(
  relationshipReportId: string,
  viewerReportId: string,
  kind: RelationshipKind,
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
  if (options?.autostart !== false) {
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
