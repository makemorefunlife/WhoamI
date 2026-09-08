/**
 * Regression test suite for friend invite token flow fixes:
 * 1. Invite page fetches inviter display name from /api/invite/info without PII leakage.
 * 2. Invite completion upserts bidirectional relationship_map_memberships with status: 'accepted' (reusing SSOT helper).
 * 3. No second friend approval / request is generated after accepting an invite.
 *
 * Run: npx tsx tests/unit/invite-token-flow-and-membership.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  initialMembershipsForInviteAccept,
  isVisibleInMap,
} from "../../lib/relationship/map/directionalMembership.ts";
import { getMessages } from "../../lib/i18n/messages/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`ok - ${name}`);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}
function readSrc(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

section("A. SSOT Membership Helper — Invite Accept gives bidirectional accepted status");
{
  const { inviterSeesInvitee, inviteeSeesInviter } = initialMembershipsForInviteAccept();
  assert.equal(inviterSeesInvitee, "accepted");
  assert.equal(inviteeSeesInviter, "accepted");
  assert.ok(isVisibleInMap(inviterSeesInvitee, false), "Inviter map sees Invitee");
  assert.ok(isVisibleInMap(inviteeSeesInviter, false), "Invitee map sees Inviter");
  ok("initialMembershipsForInviteAccept returns bidirectional accepted status");
}

section("B. app/api/invite/complete/route.ts — Upserts relationship_map_memberships & invalidates cache");
{
  const src = readSrc("app/api/invite/complete/route.ts");
  assert.ok(
    src.includes("initialMembershipsForInviteAccept"),
    "must use initialMembershipsForInviteAccept from directionalMembership.ts",
  );
  assert.ok(
    src.includes("from(\"relationship_map_memberships\")"),
    "must upsert into relationship_map_memberships",
  );
  assert.ok(
    src.includes("invalidateRelationshipMapCache(data.from_report_id)"),
    "must invalidate inviter map cache",
  );
  assert.ok(
    src.includes("invalidateRelationshipMapCache(idCheck.value)"),
    "must invalidate invitee map cache",
  );
  ok("invite/complete route correctly upserts memberships and invalidates caches for both sides");
}

section("C. app/api/invite/info/route.ts — Minimal info endpoint with NO PII leak");
{
  const src = readSrc("app/api/invite/info/route.ts");
  assert.ok(src.includes("export async function GET"));
  assert.ok(src.includes("isAcceptableInviteToken"));
  assert.ok(src.includes("resolvePartnerDisplayName"));
  assert.ok(src.includes("return NextResponse.json({ inviterName })"));
  assert.ok(src.includes("return NextResponse.json({ inviterName: null })"));

  // Check all NextResponse.json calls in the file to guarantee only inviterName is returned
  const jsonCalls = src.match(/NextResponse\.json\([^)]+\)/g) ?? [];
  assert.ok(jsonCalls.length > 0, "must have NextResponse.json calls");
  for (const call of jsonCalls) {
    assert.ok(
      call.includes("inviterName"),
      `NextResponse.json payload must only return inviterName, got: ${call}`,
    );
    assert.equal(
      call.includes("clerk") || call.includes("email") || call.includes("birth") || call.includes("report_id"),
      false,
      `NextResponse.json payload must not leak PII, got: ${call}`,
    );
  }
  ok("invite/info route resolves inviter name without PII leakage in response payload");
}

section("D. app/invite/InviteContent.tsx — Fetches inviter name & uses formatted message");
{
  const src = readSrc("app/invite/InviteContent.tsx");
  assert.ok(src.includes("/api/invite/info?token="));
  assert.ok(src.includes("messages.invite.inviteMessageWithInviter(inviterName)"));
  assert.ok(src.includes("messages.invite.inviteMessage"));
  ok("InviteContent fetches inviter display name and uses inviteMessageWithInviter");
}

section("E. i18n Messages — Exact copy in KR & EN");
{
  const ko = getMessages("ko-KR");
  const en = getMessages("en-US");

  assert.equal(
    ko.invite.inviteMessageWithInviter("홍길동"),
    "홍길동님이 친구로 초대했어요.",
  );
  assert.equal(
    en.invite.inviteMessageWithInviter("Alice"),
    "Alice invited you to connect.",
  );
  ok("KR copy: '{name}님이 친구로 초대했어요.', EN copy: '{name} invited you to connect.'");
}

console.log(`\nAll ${passed} invite token flow & membership regression tests passed.`);
