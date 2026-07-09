import type { RelationshipListItem } from "@/components/relationship/RelationshipCard";
import { isGenericPartnerName } from "@/lib/relationship/resolvePartnerDisplayName";

/** 친구 목록(아바타 행)에 노출할 수 있는 항목인지 */
export function isHubFriendListItem(item: RelationshipListItem): boolean {
  if (item.row_kind === "outbound_waiting") return false;
  if (!item.relationship_report_id) return false;
  if (!isGenericPartnerName(item.partner_name)) return true;
  return (
    item.row_kind === "relationship_manual" && Boolean(item.partner_report_id)
  );
}

export function filterHubFriendList(
  items: RelationshipListItem[],
): RelationshipListItem[] {
  return items.filter(isHubFriendListItem);
}
