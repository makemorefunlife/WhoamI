/**
 * Relationship deep: creator-only reports + selective share (mock / pure).
 * Run: npx tsx tests/unit/relationship-premium-ownership.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  decidePremiumPost,
  resolvePremiumAccess,
  pickPremiumSource,
  type OwnedPremiumRow,
  type ShareLinkRow,
} from "../../lib/relationship/premiumAccess";
import { resolveShareAccess } from "../../lib/relationship/reportShare/resolveShareAccess";

const RA = "rep-a"; // creator A's participant report
const RB = "rep-b"; // partner B
const RC = "rep-c"; // unrelated C (not a participant)
const rowA: OwnedPremiumRow = {
  id: "prA", relationship_report_id: "rr", owner_report_id: RA, owner_clerk_user_id: "user_a",
  kind: "romantic", locale: "ko-KR", payload: { format: "x", report: { who: "A" } } as never,
};
const rowB: OwnedPremiumRow = { ...rowA, id: "prB", owner_report_id: RB, owner_clerk_user_id: "user_b", payload: { format: "x", report: { who: "B" } } as never };
const share = (status: string, premium = "prA", recipient = RB): ShareLinkRow => ({ id: "s", premium_report_id: premium, recipient_report_id: recipient, status });

const view = (viewer: string, clerk: string | null, partner: string, rows: OwnedPremiumRow[], shares: ShareLinkRow[], legacy: unknown = {}) =>
  resolvePremiumAccess({ viewerReportId: viewer, viewerClerkUserId: clerk, partnerReportId: partner, locale: "ko-KR", rows, shares, legacyByKind: legacy as never }).romantic;

let n = 0;
const ok = (name: string, fn: () => void) => { fn(); n++; console.log(`ok - ${name}`); };

ok("creator sees own report", () => {
  const a = view(RA, "user_a", RB, [rowA], []);
  assert.equal(a.mine?.id, "prA");
  assert.equal(pickPremiumSource(a), "mine");
});
ok("partner before share: nothing readable (no body, no summary)", () => {
  const b = view(RB, "user_b", RA, [rowA], []);
  assert.equal(b.mine, null); assert.equal(b.shared, null); assert.equal(b.legacy, null);
  assert.equal(pickPremiumSource(b), null);
});
ok("partner after share: exactly that report is readable", () => {
  const b = view(RB, "user_b", RA, [rowA], [share("active")]);
  assert.equal(b.shared?.id, "prA");
  assert.equal(pickPremiumSource(b), "shared");
});
ok("partner after revoke: blocked again on the next request", () => {
  const b = view(RB, "user_b", RA, [rowA], [share("revoked")]);
  assert.equal(pickPremiumSource(b), null);
});
ok("share to someone else does not open it for the partner", () => {
  const b = view(RB, "user_b", RA, [rowA], [share("active", "prA", RC)]);
  assert.equal(pickPremiumSource(b), null);
});
ok("unrelated account: even with a leaked share row, nothing (and the route refuses non-participants first)", () => {
  const c = view(RC, "user_c", RA, [rowA], [share("active", "prA", RB)]);
  assert.equal(pickPremiumSource(c), null);
  assert.deepEqual(resolveShareAccess({ status: "active", recipient_report_id: RB }, "user_c", "user_b"), { allowed: false, reason: "wrong_user" });
});
ok("signed-in user must match the owner clerk id (same report id, other account = not mine)", () => {
  const x = view(RA, "user_x", RB, [rowA], []);
  assert.equal(x.mine, null);
});
ok("both create their own: each sees mine; with a share, B can switch to A's", () => {
  const b = view(RB, "user_b", RA, [rowA, rowB], [share("active")]);
  assert.equal(b.mine?.id, "prB"); assert.equal(b.shared?.id, "prA");
  assert.equal(pickPremiumSource(b), "mine");
  assert.equal(pickPremiumSource(b, "shared"), "shared");
  assert.equal(pickPremiumSource(view(RB, "user_b", RA, [rowA, rowB], []), "shared"), "mine", "requesting an unshared copy falls back");
});
ok("legacy (creator unknown) stays as before for both participants", () => {
  const legacy = { romantic: { byLocale: { "ko-KR": { format: "romantic_saju_deep_v1", report: { section_1_summary: {}, meta: {} } } } } };
  // getPremiumPayloadForKindLocale decides validity; only check it is not a mine/shared copy
  const a = view(RA, "user_a", RB, [], [], legacy);
  const b = view(RB, "user_b", RA, [], [], legacy);
  assert.equal(a.mine, null); assert.equal(b.mine, null);
  assert.equal(Boolean(a.legacy), Boolean(b.legacy));
});

ok("POST: own report -> serve mine, no generation (re-open)", () => {
  const d = decidePremiumPost(view(RA, "user_a", RB, [rowA], []), { forceRegenerate: false, createOwn: false });
  assert.deepEqual("serve" in d && d.serve, "mine");
});
ok("POST: partner without share -> generates OWN (never served A's)", () => {
  const d = decidePremiumPost(view(RB, "user_b", RA, [rowA], []), { forceRegenerate: false, createOwn: false });
  assert.deepEqual(d, { generate: "first_generation" });
});
ok("POST: shared -> served free; create_own -> own generation", () => {
  const a = view(RB, "user_b", RA, [rowA], [share("active")]);
  const d = decidePremiumPost(a, { forceRegenerate: false, createOwn: false });
  assert.equal("serve" in d && d.serve, "shared");
  assert.deepEqual(decidePremiumPost(a, { forceRegenerate: false, createOwn: true }), { generate: "first_generation" });
});
ok("POST: force regenerate replaces only own copy", () => {
  const d = decidePremiumPost(view(RA, "user_a", RB, [rowA, rowB], []), { forceRegenerate: true, createOwn: false });
  assert.deepEqual(d, { generate: "user_regenerate" });
});
ok("POST: other language has no own copy -> new generation (language credit rule applies in reserve_credit)", () => {
  const en = resolvePremiumAccess({ viewerReportId: RA, viewerClerkUserId: "user_a", partnerReportId: RB, locale: "en-US", rows: [rowA], shares: [], legacyByKind: {} }).romantic;
  assert.deepEqual(decidePremiumPost(en, { forceRegenerate: false, createOwn: false }), { generate: "first_generation" });
});

ok("wiring: every route uses the same server rule; no legacy writes from new generations", () => {
  const detail = readFileSync("app/api/relationship/detail/route.ts", "utf8");
  assert.match(detail, /loadPremiumAccess\(/);
  assert.match(detail, /buildViewerByKind\(/);
  assert.doesNotMatch(detail, /\.update\(\{ result_premium_by_kind/);
  const premium = readFileSync("app/api/relationship/analyze/premium/route.ts", "utf8");
  assert.match(premium, /decidePremiumPost\(/);
  assert.doesNotMatch(premium, /mergeRelationshipPremiumByKind/);
  assert.ok(premium.indexOf("decidePremiumPost(") < premium.indexOf("reserveRelationshipCredit(supabase"), "serve-before-charge");
  for (const f of ["create", "revoke", "status"]) {
    const src = readFileSync(`app/api/relationship/share/${f}/route.ts`, "utf8");
    assert.match(src, /assertPremiumReportOwner\(/, `${f} must check the creator`);
  }
  for (const f of ["app/api/relationship/list/route.ts", "app/api/relationship/status/route.ts", "lib/relationship/hubRelationshipSummary.ts", "lib/relationship/map/fetchRelationshipMapConnections.ts"]) {
    assert.match(readFileSync(f, "utf8"), /fetchAccessiblePremiumKinds\(/, `${f} readiness by access`);
  }
  const persist = readFileSync("lib/relationship/persistRomanticPremiumResult.ts", "utf8");
  assert.match(persist, /saveOwnedRelationshipPremium\(/);
  const ko = readFileSync("lib/i18n/messages/ko-KR.ts", "utf8");
  assert.match(ko, /이미 본 내용을 되돌리지는 않아요/);
});

console.log(`\n${n} passed`);
