/**
 * Sends ONE real test copy of the guest purchase-guide email through Resend,
 * using the same template and sender as the app (lib/email/*), so the
 * received mail shows the actual From, Reply-To and contact address.
 * Every email (Korean and English) uses MAIL_FROM / MAIL_REPLY_TO.
 * Marked as a TEST purchase; no order / payment / pass is touched.
 * Reads RESEND_API_KEY / MAIL_FROM / MAIL_REPLY_TO from .env.local; prints no key.
 *
 *   npx tsx scripts/dev/send-test-purchase-mail.ts you@example.com           (English)
 *   npx tsx scripts/dev/send-test-purchase-mail.ts you@example.com ko-KR     (Korean, for comparison)
 */
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
  if (m && !line.trim().startsWith("#") && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

async function main() {
  const to = process.argv[2] ?? "";
  const locale = process.argv[3] === "ko-KR" ? "ko-KR" : "en-US";
  if (!to.includes("@")) {
    console.log("Usage: npx tsx scripts/dev/send-test-purchase-mail.ts you@example.com [ko-KR]");
    process.exit(1);
  }
  const { buildGuestPurchaseEmail } = await import("../../lib/email/guestPurchaseEmail");
  const { sendResendEmail } = await import("../../lib/email/resend");
  const base = "https://www.ahaitsme.com";
  const c = buildGuestPurchaseEmail({
    locale,
    planId: locale === "en-US" ? "us_personal_premium" : "kr_personal_premium",
    amount: locale === "en-US" ? 9.99 : 7900,
    currency: locale === "en-US" ? "USD" : "KRW",
    approvedAt: new Date().toISOString(),
    isTest: true,
    claimUrl: `${base}${locale === "en-US" ? "" : "/kr"}/`,
    refundUrl: `${base}${locale === "en-US" ? "" : "/kr"}/refund`,
    receiptUrl: null,
    guestUse: true,
  });
  const from = process.env.MAIL_FROM?.trim() || "(MAIL_FROM not set)";
  const replyTo = process.env.MAIL_REPLY_TO?.trim() || "(none)";
  console.log(`locale=${locale}\nFrom: ${from}\nReply-To: ${replyTo}\nSubject: ${c.subject}`);
  const r = await sendResendEmail({
    to,
    subject: c.subject,
    html: c.html,
    text: c.text,
    tag: "sender_check_test",
    idempotencyKey: `sender-check-${locale}-${Date.now()}`,
  });
  console.log(r.kind === "sent" ? `sent: id=${r.messageId}` : `not sent: ${JSON.stringify(r)}`);
}
main();
