import { parseRelationshipKind, type RelationshipKind } from "@/lib/relationship/relationshipKind";
import { resolvePartnerDisplayName } from "@/lib/relationship/resolvePartnerDisplayName";

export type SharedInboxRow = {
  id: string;
  relationship_report_id: string;
  kind: string;
  owner_report_id: string;
  created_at: string;
};

export type SharedInboxItem = {
  id: string;
  relationship_report_id: string;
  relationship_kind: RelationshipKind;
  analysis_level: "premium";
  result_format: "shared";
  created_at: string;
  summary_title: string;
  summary_subtitle: string;
  partner_name: string;
};

/**
 * Shapes one active relationship_report_shares row (recipient side) into a
 * hub feed item — pure, no I/O, so it can be exercised without Supabase or
 * Clerk (see resolveShareAccess.ts / resolveShareRecipient.ts for the same
 * pattern). The owner's name is looked up by the caller and passed in raw;
 * resolvePartnerDisplayName is what decides whether it's a plausible real
 * name or should fall back to a generic label.
 */
export function buildSharedInboxItem(
  row: SharedInboxRow,
  ownerReportName: string | null,
  copy: {
    partnerFallbackLabel: string;
    kindLabel: (kind: RelationshipKind) => string;
    sharedAnalysisTitle: (kindLabel: string) => string;
    sharedAnalysisSubtitle: (partnerName: string) => string;
  },
): SharedInboxItem {
  const kind = parseRelationshipKind(row.kind);
  const partnerName = resolvePartnerDisplayName(
    ownerReportName,
    null,
    copy.partnerFallbackLabel,
  );
  return {
    id: row.id,
    relationship_report_id: row.relationship_report_id,
    relationship_kind: kind,
    analysis_level: "premium",
    result_format: "shared",
    created_at: row.created_at,
    summary_title: copy.sharedAnalysisTitle(copy.kindLabel(kind)),
    summary_subtitle: copy.sharedAnalysisSubtitle(partnerName),
    partner_name: partnerName,
  };
}
