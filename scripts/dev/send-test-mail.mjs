// Sends ONE plain test email through Resend with the app's MAIL_FROM /
// MAIL_REPLY_TO, to the address you pass. Prints only the result (no key).
// Usage: node scripts/dev/send-test-mail.mjs you@example.com
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
  if (m && !line.trim().startsWith("#") && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const to = process.argv[2];
if (!to || !to.includes("@")) {
  console.log("Usage: node scripts/dev/send-test-mail.mjs you@example.com");
  process.exit(1);
}
const { RESEND_API_KEY: key, MAIL_FROM: from, MAIL_REPLY_TO: replyTo } = process.env;
if (!key || !from) {
  console.log("RESEND_API_KEY or MAIL_FROM missing in .env.local");
  process.exit(1);
}
const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from,
    to: [to],
    subject: "[테스트] Aha! It's me 메일 발송 확인",
    text: "Resend 발송 설정 확인용 테스트 메일입니다. 결제나 이용권과는 관계없습니다.",
    ...(replyTo ? { reply_to: replyTo } : {}),
  }),
});
const body = await res.json().catch(() => ({}));
console.log(res.ok ? `sent: id=${body.id}` : `failed: HTTP ${res.status} ${body.name ?? ""} ${body.message ?? ""}`);
