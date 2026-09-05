/**
 * Regression: invite/connect links must open on the SHARER's own locale
 * (en-US or ko-KR), not silently default to en-US regardless of which
 * site generated them. Before this fix, buildInviteUrl/buildConnectUrl
 * never added the `/kr` path prefix, so a link shared from the Korean
 * site always opened the English page for the recipient.
 *
 * Run: npx tsx tests/unit/invite-share-locale.test.mjs
 */
import assert from "node:assert/strict";
import { buildConnectUrl, buildInviteUrl } from "../../lib/relationship/inviteShare.ts";

const ORIGIN = "https://ahaitsme.com";

assert.equal(
  buildConnectUrl("tok123", "en-US", ORIGIN),
  "https://ahaitsme.com/connect?token=tok123",
  "en-US connect link must have no locale prefix",
);
assert.equal(
  buildConnectUrl("tok123", "ko-KR", ORIGIN),
  "https://ahaitsme.com/kr/connect?token=tok123",
  "ko-KR connect link must carry the /kr prefix",
);
assert.equal(
  buildInviteUrl("tok123", "en-US", ORIGIN),
  "https://ahaitsme.com/invite?token=tok123",
  "en-US invite link must have no locale prefix",
);
assert.equal(
  buildInviteUrl("tok123", "ko-KR", ORIGIN),
  "https://ahaitsme.com/kr/invite?token=tok123",
  "ko-KR invite link must carry the /kr prefix",
);

console.log("ok - invite/connect links carry the sharer's own locale prefix");
