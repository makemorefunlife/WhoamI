/**
 * One sender for every email (2026-10-19): Korean and English emails both send
 * From MAIL_FROM / Reply-To MAIL_REPLY_TO (customer contact contact@ahaitsme.com),
 * and both purchase-guide footers show contact@ahaitsme.com.
 * Run: npx tsx tests/unit/mail-sender-locale.test.ts
 */
import assert from "node:assert/strict";
import { sendResendEmail, type MailMessage } from "../../lib/email/resend";
import { sendGuestCodeEmail } from "../../lib/email/guestCodeEmail";
import { sendInviteCodeEmail } from "../../lib/email/inviteCodeEmail";
import { buildGuestPurchaseEmail } from "../../lib/email/guestPurchaseEmail";

async function main() {
  process.env.RESEND_API_KEY = "re_test_dummy";
  process.env.MAIL_FROM = "Aha It's me <contact@ahaitsme.com>";
  process.env.MAIL_REPLY_TO = "contact@ahaitsme.com";
  const bodies: Record<string, unknown>[] = [];
  globalThis.fetch = (async (_u: unknown, init: { body: string }) => {
    bodies.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ id: "x" }), { status: 200 });
  }) as unknown as typeof fetch;

  // Real senders, real Resend request bodies, both languages
  await sendGuestCodeEmail({ to: "a@b.test", locale: "en-US", code: "123456", isTest: false, idempotencyKey: "k1" });
  await sendGuestCodeEmail({ to: "a@b.test", locale: "ko-KR", code: "123456", isTest: false, idempotencyKey: "k2" });
  await sendInviteCodeEmail({ to: "a@b.test", locale: "en-US", code: "123456", purpose: "verify", idempotencyKey: "k3" });
  await sendInviteCodeEmail({ to: "a@b.test", locale: "ko-KR", code: "123456", purpose: "recover", idempotencyKey: "k4" });
  const base: MailMessage = { to: "a@b.test", subject: "s", html: "h", text: "t", tag: "t", idempotencyKey: "k5" };
  await sendResendEmail(base);
  assert.equal(bodies.length, 5);
  for (const b of bodies) {
    assert.equal(b.from, "Aha It's me <contact@ahaitsme.com>");
    assert.equal(b.reply_to, "contact@ahaitsme.com");
  }
  console.log("ok - KO and EN emails: From / Reply-To from MAIL_FROM / MAIL_REPLY_TO");

  // No reply-to set -> none sent; no MAIL_FROM -> not configured (unchanged behaviour)
  delete process.env.MAIL_REPLY_TO;
  bodies.length = 0;
  await sendResendEmail({ ...base, idempotencyKey: "k6" });
  assert.equal(bodies[0].reply_to, undefined);
  delete process.env.MAIL_FROM;
  assert.deepEqual(await sendResendEmail({ ...base, idempotencyKey: "k7" }), { kind: "not_configured" });
  console.log("ok - missing env behaviour unchanged");

  // Body contact address in both purchase-guide emails
  for (const locale of ["ko-KR", "en-US"] as const) {
    const c = buildGuestPurchaseEmail({
      locale,
      planId: locale === "en-US" ? "us_personal_premium" : "kr_personal_premium",
      amount: locale === "en-US" ? 9.99 : 7900,
      currency: locale === "en-US" ? "USD" : "KRW",
      approvedAt: new Date().toISOString(),
      isTest: true,
      claimUrl: "https://www.ahaitsme.com/",
      refundUrl: "https://www.ahaitsme.com/refund",
      receiptUrl: null,
      guestUse: true,
    });
    assert.ok(c.text.includes("contact@ahaitsme.com") && c.html.includes("contact@ahaitsme.com"), locale);
    assert.ok(!/support@/.test(c.text + c.html), locale);
  }
  console.log("ok - KO and EN purchase-guide body contact contact@ahaitsme.com");
}
main();
