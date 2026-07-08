import type { AnalysisLogListItem } from "@/components/relationship/RelationshipAnalysisHistory";
import type { RelationshipListItem } from "@/components/relationship/RelationshipCard";
import { RELATIONSHIP_KIND_LABELS } from "@/lib/relationship/relationshipKind";

export type HubAnalysisFeedItem = AnalysisLogListItem & {
  partner_name: string;
  relationship_report_id: string;
};

type FeedPage = {
  items: HubAnalysisFeedItem[];
  hasMore: boolean;
};

export async function fetchHubAnalysisFeed(
  viewerReportId: string,
  relationships: RelationshipListItem[],
  limit = 5,
  maxTargets = 10,
): Promise<FeedPage> {
  const withId = relationships.filter((r) => r.relationship_report_id);
  const targets = withId.slice(0, Math.max(1, maxTargets));
  const perRelationshipLimit = Math.max(3, Math.min(limit + 1, 20));
  const results = await Promise.all(
    targets.map(async (rel) => {
      const rrId = rel.relationship_report_id!;
      try {
        const res = await fetch(
          `/api/relationship/logs?relationshipReportId=${encodeURIComponent(rrId)}&viewerReportId=${encodeURIComponent(viewerReportId)}&limit=${perRelationshipLimit}&offset=0`,
        );
        const data = await res.json();
        if (!res.ok) return { items: [], hasMore: false } as FeedPage;
        const logs = (data.logs ?? []) as AnalysisLogListItem[];
        return {
          items: logs.map((log) => ({
          ...log,
          partner_name: rel.partner_name,
          relationship_report_id: rrId,
          })),
          hasMore: data.hasMore === true,
        } as FeedPage;
      } catch {
        return { items: [], hasMore: false } as FeedPage;
      }
    }),
  );
  const merged = results
    .flatMap((result) => result.items)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  const hasMore = merged.length > limit || results.some((result) => result.hasMore);
  return {
    items: merged.slice(0, limit),
    hasMore,
  };
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
