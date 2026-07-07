import type { AnalysisLogListItem } from "@/components/relationship/RelationshipAnalysisHistory";
import type { RelationshipListItem } from "@/components/relationship/RelationshipCard";
import { RELATIONSHIP_KIND_LABELS } from "@/lib/relationship/relationshipKind";

export type HubAnalysisFeedItem = AnalysisLogListItem & {
  partner_name: string;
  relationship_report_id: string;
};

export async function fetchHubAnalysisFeed(
  viewerReportId: string,
  relationships: RelationshipListItem[],
  limit = 3,
): Promise<HubAnalysisFeedItem[]> {
  const withId = relationships.filter((r) => r.relationship_report_id);
  const targets = withId.slice(0, 10);
  const results = await Promise.all(
    targets.map(async (rel) => {
      const rrId = rel.relationship_report_id!;
      try {
        const res = await fetch(
          `/api/relationship/logs?relationshipReportId=${encodeURIComponent(rrId)}&viewerReportId=${encodeURIComponent(viewerReportId)}`,
        );
        const data = await res.json();
        if (!res.ok) return [] as HubAnalysisFeedItem[];
        const logs = (data.logs ?? []) as AnalysisLogListItem[];
        return logs.map((log) => ({
          ...log,
          partner_name: rel.partner_name,
          relationship_report_id: rrId,
        }));
      } catch {
        return [] as HubAnalysisFeedItem[];
      }
    }),
  );
  return results
    .flat()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, limit);
}

export function formatHubAnalysisDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export function hubAnalysisKindLabel(
  log: Pick<AnalysisLogListItem, "relationship_kind" | "analysis_level">,
): string {
  const kind =
    log.relationship_kind === "unspecified"
      ? "관계"
      : RELATIONSHIP_KIND_LABELS[log.relationship_kind];
  const level = log.analysis_level === "premium" ? "심화" : "기본";
  return `${kind} · ${level}`;
}
