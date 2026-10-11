import type { Locale } from "@/lib/i18n/locale";
import { sendResendEmail, type MailResult, type MailSender } from "@/lib/email/resend";

/**
 * Code email for a guest invite participation: confirming an email for
 * recovery ("verify") or opening the participation on another browser
 * ("recover"). Sender / reply-to come from MAIL_FROM / MAIL_REPLY_TO
 * (support@ahaitsme.com) -- unchanged.
 */
export function buildInviteCodeEmail(p: { locale: Locale; code: string; purpose: "verify" | "recover" }) {
  const ko = p.locale === "ko-KR";
  const subject = ko ? "[Aha! It's me] 관계 확인 인증코드" : "[Aha! It's me] Your verification code";
  const lines = ko
    ? [
        p.purpose === "verify"
          ? "다른 기기에서도 이어볼 수 있게 이메일을 확인하는 코드예요."
          : "다른 기기에서 친구와의 관계 결과를 이어보기 위한 코드예요.",
        `인증코드: ${p.code}`,
        "10분 안에 화면에 입력해 주세요. 가입하지 않은 참여 정보는 참여일부터 30일 동안 보관돼요.",
        "직접 요청하지 않았다면 이 메일은 무시하셔도 돼요. 코드를 다른 사람에게 알려 주지 마세요.",
      ]
    : [
        p.purpose === "verify"
          ? "Here is a code to confirm your email, so you can pick this up on another device."
          : "Here is a code to continue your friend's relationship result on another device.",
        `Code: ${p.code}`,
        "Enter it within 10 minutes. If you don't sign up, your info is kept for 30 days from when you joined.",
        "If you didn't ask for this, you can ignore this email. Don't share the code with anyone.",
      ];
  const text = lines.join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#FAF7F0;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#1A3328">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFDF8;border:1px solid #D4CFC4;border-radius:16px">
<tr><td style="padding:28px 24px;font-size:14px;line-height:1.6">
<p style="margin:0 0 6px;font-size:13px;color:#3A8F6E;font-weight:700">Aha! It's me</p>
<p style="margin:0 0 14px">${lines[0]}</p>
<p style="margin:0 0 14px;font-size:30px;letter-spacing:6px;font-weight:700;text-align:center">${p.code}</p>
<p style="margin:0 0 10px">${lines[2]}</p>
<p style="margin:0;color:#4A5C52;font-size:12px">${lines[3]}</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, html, text };
}

export async function sendInviteCodeEmail(
  params: { to: string; locale: Locale; code: string; purpose: "verify" | "recover"; idempotencyKey: string },
  send: MailSender = sendResendEmail,
): Promise<MailResult> {
  const c = buildInviteCodeEmail(params);
  return send({
    to: params.to,
    subject: c.subject,
    html: c.html,
    text: c.text,
    tag: `invite_code_${params.purpose}`,
    idempotencyKey: params.idempotencyKey,
  });
}
