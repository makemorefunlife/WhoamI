import type { RelationshipListItem } from "@/components/relationship/RelationshipCard";
import { isGenericPartnerName } from "@/lib/relationship/resolvePartnerDisplayName";
import {
  compareStringTieBreakDesc,
  sortByIsoTimestampDesc,
} from "@/lib/relationship/sortByIsoTimestampDesc";

/** 허브 친구 아바타 행에 노출할 최대 인원 — 초과분은 More 시트로 */
export const HUB_FRIEND_STORY_VISIBLE = 3;

/** 친구 목록(아바타 행)에 노출할 수 있는 항목인지 */
export function isHubFriendListItem(item: RelationshipListItem): boolean {
  if (item.row_kind === "outbound_waiting") return false;
  if (!item.relationship_report_id) return false;
  if (!isGenericPartnerName(item.partner_name)) return true;
  return (
    item.row_kind === "relationship_manual" && Boolean(item.partner_report_id)
  );
}

/** 최근에 추가한 친구가 앞에 오도록 정렬 (story-row / filtered subset) */
export function sortHubFriendsByAddedAtDesc(
  items: RelationshipListItem[],
): RelationshipListItem[] {
  return sortByIsoTimestampDesc(
    items,
    (item) => item.added_at,
    (a, b) =>
      compareStringTieBreakDesc(
        a.list_key ?? a.relationship_report_id ?? "",
        b.list_key ?? b.relationship_report_id ?? "",
      ),
  );
}

/**
 * Story-row filter. Re-sorts after filter so callers may pass unsorted lists;
 * list API already returns newest-first, but this keeps the story-row contract local.
 */
export function filterHubFriendList(
  items: RelationshipListItem[],
): RelationshipListItem[] {
  return sortHubFriendsByAddedAtDesc(items.filter(isHubFriendListItem));
}
