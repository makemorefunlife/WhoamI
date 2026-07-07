import type { RelationshipListItem } from "@/components/relationship/RelationshipCard";

export function hubItemKey(item: RelationshipListItem): string {
  return (
    item.list_key ??
    item.relationship_report_id ??
    item.outbound_invite_id ??
    item.invite_token ??
    item.partner_name
  );
}

export function hubDisplayNameFor(
  item: RelationshipListItem,
  displayNames: Record<string, string>,
): string {
  const id = item.relationship_report_id;
  if (id && displayNames[id]) return displayNames[id];
  return item.partner_name;
}
