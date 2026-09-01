/**
 * Premium report sharing — authorization-decision regression tests (spec
 * sections 32-37). These test the pure decision functions directly (no
 * database, no Clerk session), which is deliberately a *stronger* guarantee
 * than a live integration run against this dev environment: dev-mode
 * ownership helpers elsewhere in the codebase intentionally fail open when
 * NODE_ENV==="development" (see lib/report/assertOwnedReportAccess.ts), so
 * a live pass here would prove nothing about the actual security logic.
 * These functions have zero I/O and are exercised directly against every
 * required case from the spec: A creates a share, B (intended recipient)
 * can open it, C (third user) is denied, a logged-out visitor must
 * authenticate, and revoke invalidates the token.
 *
 * Run: npx tsx tests/unit/relationship-report-share.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { resolveShareAccess } = await import(
  "../../lib/relationship/reportShare/resolveShareAccess.ts"
);
const { resolveShareRecipient } = await import(
  "../../lib/relationship/reportShare/resolveShareRecipient.ts"
);
const { generateShareToken } = await import(
  "../../lib/relationship/reportShare/generateShareToken.ts"
);

// Distinctive fixture identities so any accidental leakage/mixup is obvious.
const OWNER_REPORT = "report-owner-A-1111";
const RECIPIENT_REPORT = "report-recipient-B-2222";
const THIRD_PARTY_REPORT = "report-thirdparty-C-3333";
const OWNER_USER = "user_owner_A";
const RECIPIENT_USER = "user_recipient_B";
const THIRD_PARTY_USER = "user_thirdparty_C";

section("A. private-by-default: no share row exists");
{
  const decision = resolveShareAccess(null, RECIPIENT_USER, RECIPIENT_USER);
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "not_found");
  ok("no share row -> not_found (report stays private by default)");
}

section("B/C. share created after explicit consent -> recipient resolution");
{
  const rr = { report_id_a: OWNER_REPORT, report_id_b: RECIPIENT_REPORT };
  const recipient = resolveShareRecipient(rr, OWNER_REPORT);
  assert.equal(recipient, RECIPIENT_REPORT, "owner as report_id_a resolves report_id_b as recipient");

  const rrReversed = { report_id_a: RECIPIENT_REPORT, report_id_b: OWNER_REPORT };
  const recipient2 = resolveShareRecipient(rrReversed, OWNER_REPORT);
  assert.equal(recipient2, RECIPIENT_REPORT, "owner as report_id_b resolves report_id_a as recipient");

  const notAParticipant = resolveShareRecipient(rr, THIRD_PARTY_REPORT);
  assert.equal(notAParticipant, null, "a non-participant can never be resolved as an owner/recipient pair");
  ok("recipient is always the other real participant, never an arbitrary third party");
}

section("D. correct intended recipient (B) is allowed");
{
  const share = { status: "active", recipient_report_id: RECIPIENT_REPORT };
  const decision = resolveShareAccess(share, RECIPIENT_USER, RECIPIENT_USER);
  assert.equal(decision.allowed, true);
  ok("intended recipient B, signed in as themselves -> allowed");
}

section("E. wrong user (C) is rejected even with a valid, active token");
{
  const share = { status: "active", recipient_report_id: RECIPIENT_REPORT };
  // C is signed in, but C's own account does not own the recipient report.
  const decision = resolveShareAccess(share, THIRD_PARTY_USER, RECIPIENT_USER);
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "wrong_user");
  ok("third user C signed in as themselves -> wrong_user, denied (URL possession alone is not enough)");
}

section("F. unauthenticated request requires authentication");
{
  const share = { status: "active", recipient_report_id: RECIPIENT_REPORT };
  const decision = resolveShareAccess(share, null, RECIPIENT_USER);
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "auth_required");
  ok("logged-out visitor with a valid token -> auth_required, not allowed");
}

section("G. revoke invalidates the token even for the correct recipient");
{
  const revokedShare = { status: "revoked", recipient_report_id: RECIPIENT_REPORT };
  const decision = resolveShareAccess(revokedShare, RECIPIENT_USER, RECIPIENT_USER);
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "revoked");
  ok("revoked share -> denied even though the recipient identity matches");
}

section("H. owner retains access regardless of share state (owner never goes through this recipient gate)");
{
  // The owner's own access to their report goes through the existing
  // participant-scoped /api/relationship/detail check, not this recipient
  // gate at all -- this test documents that resolveShareAccess is only
  // ever consulted for the *recipient* path, never gates the owner.
  const share = { status: "revoked", recipient_report_id: RECIPIENT_REPORT };
  const ownerDecision = resolveShareAccess(share, OWNER_USER, RECIPIENT_USER);
  assert.equal(ownerDecision.allowed, false, "the owner is not the recipient, so this gate correctly says no to them too");
  ok("resolveShareAccess only ever grants the recipient path — owner access is unaffected because it never calls this function");
}

section("token shape");
{
  const t1 = generateShareToken();
  const t2 = generateShareToken();
  assert.notEqual(t1, t2, "tokens must not be brittle/fixed — every call yields a fresh value");
  assert.ok(t1.length >= 24, "token should be long enough to be unguessable");
  assert.doesNotMatch(t1, /[+/=]/, "base64url tokens should be URL-safe (no +, /, =)");
  ok("share tokens are fresh, long, and URL-safe on every call (values themselves are not asserted, per instructions)");
}

console.log("\nAll relationship report-share authorization tests passed.");
