import type { Locale } from "@/lib/i18n/locale";
import { sendResendEmail, type MailResult, type MailSender } from "@/lib/email/resend";
import { CODE_TTL_S } from "@/lib/payment/guestAccess";

/**
 * Purchase-verification code email (sent to the ORDER email only). The code
 * proves the reader controls that inbox; it is valid for 10 minutes.
 */
export function buildGuestCodeEmail(params: { locale: Locale; code: string; isTest: boolean }) {
  const minutes = Math.round(CODE_TTL_S / 60);
  const ko = params.locale === "ko-KR";
  const subject = `${params.isTest ? (ko ? "[테스트] " : "[TEST] ") : ""}${
    ko ? "[Aha! It's me] 구매 확인 인증코드" : "[Aha! It's me] Your purchase verification code"
  }`;
  const lines = ko
    ? [
        "구매 확인을 위한 인증코드예요.",
        `인증코드: ${params.code}`,
        `${minutes}분 안에 화면에 입력해 주세요. 확인되면 이 기기에서 7일간 이용권을 사용할 수 있어요.`,
        "직접 요청하지 않았다면 이 메일은 무시하셔도 돼요. 코드를 다른 사람에게 알려 주지 마세요.",
      ]
    : [
        "Here is your code to confirm your purchase.",
        `Code: ${params.code}`,
        `Enter it within ${minutes} minutes. Once confirmed, you can use your pass on this device for 7 days.`,
        "If you didn't ask for this, you can ignore this email. Don't share the code with anyone.",
      ];
  const text = lines.join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#FAF7F0;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#1A3328">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFDF8;border:1px solid #D4CFC4;border-radius:16px">
<tr><td style="padding:28px 24px;font-size:14px;line-height:1.6">
<p style="margin:0 0 6px;font-size:13px;color:#3A8F6E;font-weight:700">Aha! It's me</p>
<p style="margin:0 0 14px">${lines[0]}</p>
<p style="margin:0 0 14px;font-size:30px;letter-spacing:6px;font-weight:700;text-align:center">${params.code}</p>
<p style="margin:0 0 10px">${lines[2]}</p>
<p style="margin:0;color:#4A5C52;font-size:12px">${lines[3]}</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, html, text };
}

export async function sendGuestCodeEmail(
  params: { to: string; locale: Locale; code: string; isTest: boolean; idempotencyKey: string },
  send: MailSender = sendResendEmail,
): Promise<MailResult> {
  const c = buildGuestCodeEmail(params);
  return send({
    to: params.to,
    subject: c.subject,
    html: c.html,
    text: c.text,
    tag: params.isTest ? "guest_purchase_code_test" : "guest_purchase_code",
    idempotencyKey: params.idempotencyKey,
  });
}
