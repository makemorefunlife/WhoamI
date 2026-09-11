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

/**
 * One batched call for the hub's "recent analyses" feed, instead of one
 * GET /api/relationship/logs request per relationship — with more than a
 * handful of connections, that per-relationship fan-out was directly felt
 * as load latency on the relationship hub.
 */
export async function fetchHubAnalysisFeed(
  viewerReportId: string,
  relationships: RelationshipListItem[],
  limit = 5,
  maxTargets = 10,
): Promise<FeedPage> {
  const withId = relationships.filter((r) => r.relationship_report_id);
  const targets = withId.slice(0, Math.max(1, maxTargets));
  if (targets.length === 0) return { items: [], hasMore: false };

  const partnerNameByRrId = new Map(targets.map((rel) => [rel.relationship_report_id!, rel.partner_name]));

  try {
    const res = await fetch("/api/relationship/logs/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        viewerReportId,
        relationshipReportIds: targets.map((rel) => rel.relationship_report_id),
        limit: limit + 1,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { items: [], hasMore: false };
    const logs = (data.logs ?? []) as (AnalysisLogListItem & { relationship_report_id: string })[];
    const items = logs.map((log) => ({
      ...log,
      partner_name: partnerNameByRrId.get(log.relationship_report_id) ?? "",
      relationship_report_id: log.relationship_report_id,
    }));
    return {
      items: items.slice(0, limit),
      hasMore: items.length > limit,
    };
  } catch {
    return { items: [], hasMore: false };
  }
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
