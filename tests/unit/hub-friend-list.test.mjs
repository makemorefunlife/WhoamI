/**
 * Hub friend list filter + added_at sort.
 * Run: npx tsx tests/unit/hub-friend-list.test.mjs
 */
import assert from "node:assert/strict";
import {
  filterHubFriendList,
  HUB_FRIEND_STORY_VISIBLE,
  sortHubFriendsByAddedAtDesc,
} from "../../lib/relationship/hubFriendList.ts";
import {
  isoTimestampMs,
  sortByIsoTimestampDesc,
  compareStringTieBreakDesc,
} from "../../lib/relationship/sortByIsoTimestampDesc.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

const base = {
  partner_report_id: "p1",
  analysis_type: "basic",
  status: "completed",
  last_viewed: null,
  invite_token: null,
};

console.log("\n=== newest added first ===");
{
  const sorted = sortHubFriendsByAddedAtDesc([
    {
      ...base,
      list_key: "old",
      relationship_report_id: "rr-old",
      partner_name: "옛날친구",
      partner_report_id: "p-old",
      row_kind: "relationship_manual",
      added_at: "2026-01-01T00:00:00.000Z",
    },
    {
      ...base,
      list_key: "new",
      relationship_report_id: "rr-new",
      partner_name: "새친구",
      partner_report_id: "p-new",
      row_kind: "relationship_manual",
      added_at: "2026-07-01T00:00:00.000Z",
    },
    {
      ...base,
      list_key: "mid",
      relationship_report_id: "rr-mid",
      partner_name: "중간친구",
      partner_report_id: "p-mid",
      row_kind: "relationship_manual",
      added_at: "2026-03-01T00:00:00.000Z",
    },
  ]);
  assert.deepEqual(
    sorted.map((i) => i.partner_name),
    ["새친구", "중간친구", "옛날친구"],
  );
  ok("added_at desc → newest first");
}

console.log("\n=== invalid / missing dates last ===");
{
  const sorted = sortByIsoTimestampDesc(
    [
      { id: "a", at: "not-a-date" },
      { id: "b", at: "2026-06-01T00:00:00.000Z" },
      { id: "c", at: null },
      { id: "d", at: "2026-07-01T00:00:00.000Z" },
    ],
    (r) => r.at,
    (a, b) => compareStringTieBreakDesc(a.id, b.id),
  );
  assert.deepEqual(
    sorted.map((r) => r.id),
    ["d", "b", "c", "a"],
  );
  assert.equal(isoTimestampMs(null), 0);
  assert.equal(isoTimestampMs("bogus"), 0);
  ok("null/invalid timestamps → epoch 0 (last in desc)");
}

console.log("\n=== filter + story cap ===");
{
  const items = [];
  for (let i = 0; i < 5; i++) {
    items.push({
      ...base,
      list_key: `rr-${i}`,
      relationship_report_id: `rr-${i}`,
      partner_name: `친구${i}`,
      partner_report_id: `p-${i}`,
      row_kind: "relationship_manual",
      added_at: `2026-0${i + 1}-01T00:00:00.000Z`,
    });
  }
  items.push({
    ...base,
    list_key: "open-1",
    relationship_report_id: null,
    partner_name: "대기",
    partner_report_id: null,
    row_kind: "outbound_waiting",
    status: "pending",
    added_at: "2026-08-01T00:00:00.000Z",
  });
  const friends = filterHubFriendList(items);
  assert.equal(friends.length, 5);
  assert.equal(friends[0].partner_name, "친구4");
  assert.ok(!friends.some((f) => f.row_kind === "outbound_waiting"));
  const visible = friends.slice(0, HUB_FRIEND_STORY_VISIBLE);
  assert.equal(visible.length, 3);
  assert.ok(friends.length > HUB_FRIEND_STORY_VISIBLE);
  ok("waiting excluded; newest first; >3 needs More");
}

console.log("\nAll hub-friend-list checks passed.");
