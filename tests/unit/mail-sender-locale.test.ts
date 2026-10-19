/**
 * English emails send From / Reply-To contact@ahaitsme.com; Korean and
 * unspecified-locale emails keep MAIL_FROM / MAIL_REPLY_TO (2026-10-19).
 * Run: npx tsx tests/unit/mail-sender-locale.test.ts
 */
import assert from "node:assert/strict";
import { sendResendEmail, senderFor, type MailMessage } from "../../lib/email/resend";
import { sendGuestCodeEmail } from "../../lib/email/guestCodeEmail";
import { sendInviteCodeEmail } from "../../lib/email/inviteCodeEmail";

process.env.MAIL_FROM = "Aha It's me <support@ahaitsme.com>";
process.env.MAIL_REPLY_TO = "support@ahaitsme.com";
delete process.env.MAIL_FROM_EN_US;
delete process.env.MAIL_REPLY_TO_EN_US;

assert.deepEqual(senderFor("en-US"), { from: "Aha It's me <contact@ahaitsme.com>", replyTo: "contact@ahaitsme.com" });
assert.deepEqual(senderFor("ko-KR"), { from: "Aha It's me <support@ahaitsme.com>", replyTo: "support@ahaitsme.com" }, "Korean unchanged");
assert.deepEqual(senderFor(undefined), { from: "Aha It's me <support@ahaitsme.com>", replyTo: "support@ahaitsme.com" }, "no locale unchanged");
process.env.MAIL_FROM = "support@ahaitsme.com";
assert.equal(senderFor("en-US").from, "contact@ahaitsme.com", "bare address");
process.env.MAIL_FROM_EN_US = "Aha <hello@ahaitsme.com>";
process.env.MAIL_REPLY_TO_EN_US = "hello@ahaitsme.com";
assert.deepEqual(senderFor("en-US"), { from: "Aha <hello@ahaitsme.com>", replyTo: "hello@ahaitsme.com" }, "explicit override");
assert.equal(senderFor("ko-KR").from, "support@ahaitsme.com", "override never touches Korean");
delete process.env.MAIL_FROM_EN_US;
delete process.env.MAIL_REPLY_TO_EN_US;
process.env.MAIL_FROM = "Aha It's me <support@ahaitsme.com>";
console.log("ok - sender per locale");

// The actual Resend request body
async function main() {
  process.env.RESEND_API_KEY = "re_test_dummy";
  const bodies: Record<string, unknown>[] = [];
  globalThis.fetch = (async (_u: unknown, init: { body: string }) => {
    bodies.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ id: "x" }), { status: 200 });
  }) as unknown as typeof fetch;
  const base: Omit<MailMessage, "locale"> = { to: "a@b.test", subject: "s", html: "h", text: "t", tag: "t", idempotencyKey: "k" };
  await sendResendEmail({ ...base, locale: "en-US" });
  await sendResendEmail({ ...base, locale: "ko-KR" });
  assert.equal(bodies[0].from, "Aha It's me <contact@ahaitsme.com>");
  assert.equal(bodies[0].reply_to, "contact@ahaitsme.com");
  assert.equal(bodies[1].from, "Aha It's me <support@ahaitsme.com>");
  assert.equal(bodies[1].reply_to, "support@ahaitsme.com");
  // senders pass their locale through
  const seen: (string | undefined)[] = [];
  const spy = async (m: MailMessage) => (seen.push(m.locale), { kind: "sent" as const, messageId: "m" });
  await sendGuestCodeEmail({ to: "a@b.test", locale: "en-US", code: "123456", isTest: false, idempotencyKey: "k1" }, spy);
  await sendGuestCodeEmail({ to: "a@b.test", locale: "ko-KR", code: "123456", isTest: false, idempotencyKey: "k2" }, spy);
  await sendInviteCodeEmail({ to: "a@b.test", locale: "en-US", code: "123456", purpose: "verify", idempotencyKey: "k3" }, spy);
  await sendInviteCodeEmail({ to: "a@b.test", locale: "ko-KR", code: "123456", purpose: "recover", idempotencyKey: "k4" }, spy);
  assert.deepEqual(seen, ["en-US", "ko-KR", "en-US", "ko-KR"]);
  console.log("ok - Resend request body From/Reply-To per locale; code emails pass locale");
}
main();
