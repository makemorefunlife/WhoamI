import type { SupabaseClient } from "@supabase/supabase-js";
import { getMessages } from "@/lib/i18n/messages";
import { localizedPath, type Locale } from "@/lib/i18n/locale";
import { claimTokenFor } from "@/lib/payment/guestClaimToken";
import { isGuestUsePlan } from "@/lib/payment/tossCatalog";
import { maskEmail } from "@/lib/payment/guestCheckout";
import { accountLinkCopy, formatPurchaseDate } from "@/lib/payment/accountLinkCopy";
import { sendResendEmail, type MailSender } from "@/lib/email/resend";
import { logServerError, logServerEvent } from "@/lib/security/safeLog";

/**
 * Purchase-guide email for a paid GUEST order (sent once the server has
 * confirmed the Toss approval). It is a guide, not a receipt: Toss's own
 * receipt page is linked when Toss returned one.
 *
 * The email is a QUEUE ENTRY on the order (queue_guest_purchase_email at
 * approval). It is sent:
 *   1. right away by the confirm request (fast path), and
 *   2. by processDueGuestEmails() -- the background route
 *      /api/cron/guest-emails (Vercel Cron / any scheduler) and
 *      opportunistic calls after later requests -- for every entry that is
 *      pending, due for retry (transient error / 429 with backoff) or whose
 *      'sending' lease expired.
 * claim_guest_purchase_email gives exactly one sender a 2-minute lease; the
 * Resend Idempotency-Key (order id + generation) stops a second copy even if
 * a sender crashed after Resend accepted the message. Mail failures never
 * touch the payment or the pass.
 */

export type GuestEmailStatus = "sent" | "failed" | "pending" | "skipped" | "not_applicable";

type OrderRow = {
  order_id: string;
  plan_id: string;
  amount: number | string;
  currency: string;
  guest_email: string | null;
  locale: string | null;
  is_test: boolean | null;
  approved_at: string | null;
  receipt_url: string | null;
  claim_token_nonce: string | null;
};

export function appBaseUrl(): string | null {
  const raw = process.env.APP_BASE_URL?.trim() ?? "";
  if (!/^https?:\/\/[^/\s]+$/.test(raw.replace(/\/+$/, ""))) return null;
  return raw.replace(/\/+$/, "");
}

export function orderLocale(raw: string | null | undefined): Locale {
  return raw === "en-US" ? "en-US" : "ko-KR";
}

export function formatOrderAmount(amount: number | string, currency: string, locale: Locale): string {
  const n = Number(amount);
  if (currency === "KRW") return locale === "ko-KR" ? `${n.toLocaleString("ko-KR")}원` : `₩${n.toLocaleString("en-US")}`;
  return `$${n.toFixed(2)}`;
}

const formatDate = formatPurchaseDate;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export type GuestEmailContent = { subject: string; html: string; text: string };

export function buildGuestPurchaseEmail(params: {
  locale: Locale;
  planId: string;
  amount: number | string;
  currency: string;
  approvedAt: string | null;
  isTest: boolean;
  /** Purchase link (claim-link). Personal: opens the no-account use page; others: account linking. */
  claimUrl: string;
  refundUrl: string;
  receiptUrl: string | null;
  /** Masked purchase email, shown in the account-linking steps. */
  maskedEmail?: string | null;
}): GuestEmailContent {
  const m = getMessages(params.locale);
  const t = m.payments.guestEmail;
  const plans = m.pricing.regionalPlans as Record<string, { name: string; validityNotes?: string[] } | undefined>;
  const plan = plans[params.planId];
  const planName = plan?.name ?? params.planId;
  const validity = (plan?.validityNotes ?? []).join(" · ") || t.validityFallback;
  const amount = formatOrderAmount(params.amount, params.currency, params.locale);
  const date = formatDate(params.approvedAt, params.locale);
  const notes = t.plans[params.planId];
  const guestUse = isGuestUsePlan(params.planId);

  const subject = params.isTest ? `${t.testSubjectPrefix} ${t.subject}` : t.subject;
  const rows: [string, string][] = [
    [t.productLabel, planName],
    [t.amountLabel, params.isTest ? `${amount} ${t.testAmountSuffix}` : amount],
    [t.purchasedAtLabel, date],
    [t.validityLabel, validity],
  ];

  // Account products: the same wording as the claim page (lib/payment/accountLinkCopy.ts).
  const link = guestUse ? null : accountLinkCopy(m, params.locale, params.planId, { maskedEmail: params.maskedEmail, approvedAt: params.approvedAt });
  const intro = guestUse ? t.useIntro : link ? link.title : t.accountIntro;
  const introBody: string[] = guestUse ? [] : link ? [link.body, ...link.extras] : [];
  const cta = guestUse ? t.useCta : (link?.primaryCta ?? t.accountCta);
  const steps: string[] = guestUse
    ? t.useSteps
    : [
        t.accountStep1,
        link ? `${link.emailLine} ${t.accountStep2}` : params.maskedEmail ? `${t.accountStep2} (${params.maskedEmail})` : t.accountStep2,
        params.locale === "ko-KR"
          ? `이용권이 계정에 연결되면 ${notes?.next ?? "이용 화면"}으로 이어져요.`
          : `Once the pass is linked, you'll go straight to ${notes?.next ?? "your analysis"}.`,
      ];
  const afterCta: string[] = guestUse
    ? [t.useStorage, t.useLinkExpiry]
    : [...(link?.footers ?? []), t.notYetGranted, t.accountOnce, t.linkExpiry];
  const refundLine = notes?.refund ?? t.validityFallback;

  const text = [
    params.isTest ? `${t.testBanner}\n` : "",
    t.greeting,
    intro,
    ...introBody,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    `${t.stepsTitle}`,
    ...steps.map((st, i) => `${i + 1}. ${st}`),
    "",
    `${cta}: ${params.claimUrl}`,
    "",
    ...afterCta,
    "",
    `${t.refundTitle}: ${refundLine}`,
    `${t.refundLabel}: ${params.refundUrl}`,
    params.receiptUrl ? `${t.receiptLabel}: ${params.receiptUrl}` : "",
    "",
    t.footer,
  ]
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n");

  const p = (txt: string, style = "") =>
    `<p style="margin:0 0 10px;font-size:14px;line-height:1.6;${style}">${esc(txt)}</p>`;
  const html = `<!doctype html><html><body style="margin:0;background:#FAF7F0;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#1A3328">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFDF8;border:1px solid #D4CFC4;border-radius:16px">
<tr><td style="padding:28px 24px">
${params.isTest ? `<p style="margin:0 0 16px;padding:10px 12px;border-radius:10px;background:#FBEDEA;color:#A3301F;font-weight:600;font-size:14px">${esc(t.testBanner)}</p>` : ""}
<p style="margin:0 0 6px;font-size:13px;color:#3A8F6E;font-weight:700">Aha! It's me</p>
<h1 style="margin:0 0 16px;font-size:20px">${esc(t.heading)}</h1>
${p(t.greeting)}
${p(intro, "font-weight:600")}
${introBody.map((x) => p(x)).join("\n")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 16px;font-size:14px;border-top:1px solid #EDE8DD">
${rows.map(([k, v]) => `<tr><td style="padding:8px 0;color:#4A5C52;width:38%;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;font-weight:600">${esc(v)}</td></tr>`).join("\n")}
</table>
<p style="margin:0 0 6px;font-size:14px;font-weight:700">${esc(t.stepsTitle)}</p>
<ol style="margin:0 0 18px;padding-left:20px;font-size:14px;line-height:1.6">${steps.map((st) => `<li style="margin-bottom:4px">${esc(st)}</li>`).join("")}</ol>
<p style="margin:0 0 16px;text-align:center"><a href="${esc(params.claimUrl)}" style="display:inline-block;padding:13px 22px;border-radius:999px;background:#3A8F6E;color:#fff;text-decoration:none;font-weight:600;font-size:15px">${esc(cta)}</a></p>
${afterCta.map((x) => p(x, "font-size:13px;color:#4A5C52")).join("\n")}
<p style="margin:14px 0 4px;font-size:14px;font-weight:700">${esc(t.refundTitle)}</p>
${p(refundLine, "font-size:13px")}
<p style="margin:0 0 6px;font-size:13px"><a href="${esc(params.refundUrl)}" style="color:#3A8F6E">${esc(t.refundLabel)}</a></p>
${params.receiptUrl ? `<p style="margin:0 0 6px;font-size:13px"><a href="${esc(params.receiptUrl)}" style="color:#3A8F6E">${esc(t.receiptLabel)}</a></p>` : ""}
<p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#4A5C52">${esc(t.footer)}</p>
</td></tr></table></td></tr></table></body></html>`;

  return { subject, html, text };
}

function statusFromClaim(result: string): GuestEmailStatus {
  switch (result) {
    case "sent":
      return "sent";
    case "in_progress":
    case "not_due":
    case "pending":
    case "retry":
      return "pending";
    case "failed":
      return "failed";
    case "skipped":
      return "skipped";
    default:
      return "not_applicable";
  }
}

async function finish(
  supabase: SupabaseClient,
  orderId: string,
  outcome: "sent" | "retry" | "failed" | "skipped",
  messageId: string | null,
  error: string | null,
  retryAfterSeconds?: number,
) {
  const { error: e } = await supabase.rpc("finish_guest_purchase_email", {
    p_order_id: orderId,
    p_outcome: outcome,
    p_message_id: messageId,
    p_error: error,
    p_retry_after_seconds: retryAfterSeconds ?? null,
  });
  if (e) logServerError("guestEmail", e, "finish_failed");
}

/**
 * One send attempt for a queued purchase-guide email (no-op unless it is due
 * and this caller wins the lease). Safe to call from every confirm / retry /
 * background run / operator re-send.
 */
export async function sendGuestPurchaseEmail(
  supabase: SupabaseClient,
  orderId: string,
  deps: { send: MailSender } = { send: sendResendEmail },
): Promise<GuestEmailStatus> {
  const { data, error } = await supabase.rpc("claim_guest_purchase_email", { p_order_id: orderId, p_max_attempts: 6 });
  if (error) {
    logServerError("guestEmail", error, "claim_failed");
    return "pending";
  }
  const claim = (Array.isArray(data) ? data[0] : data) as { result?: string; generation?: number } | undefined;
  if (claim?.result !== "claimed") return statusFromClaim(claim?.result ?? "");
  const generation = Number(claim.generation ?? 0);

  const { data: row, error: readError } = await supabase
    .from("toss_payment_orders")
    .select("order_id, plan_id, amount, currency, guest_email, locale, is_test, approved_at, receipt_url, claim_token_nonce")
    .eq("order_id", orderId)
    .maybeSingle();
  const order = row as OrderRow | null;
  if (readError || !order || !order.guest_email) {
    await finish(supabase, orderId, "failed", null, "order_read_failed");
    return "failed";
  }

  const base = appBaseUrl();
  const token = order.claim_token_nonce ? claimTokenFor(order.order_id, order.claim_token_nonce) : null;
  if (!base || !token) {
    // Configuration problem: keep it queued (slow retry) so it goes out once fixed.
    await finish(supabase, orderId, "retry", null, !base ? "app_base_url_missing" : "claim_token_secret_missing", 600);
    logServerEvent("guestEmail", "config_missing");
    return "pending";
  }

  const locale = orderLocale(order.locale);
  // Server-side exchange: /claim-link checks the token, keeps it only in a
  // short-lived httpOnly cookie, and redirects to the claim page (whose URL
  // carries no token). The token grants nothing by itself.
  const claimUrl = `${base}/api/payments/toss/claim-link?${new URLSearchParams({ orderId: order.order_id, t: token }).toString()}`;
  const refundUrl = `${base}${localizedPath("/refund", locale)}`;
  const content = buildGuestPurchaseEmail({
    locale,
    planId: order.plan_id,
    amount: order.amount,
    currency: order.currency,
    approvedAt: order.approved_at,
    isTest: order.is_test === true,
    claimUrl,
    refundUrl,
    receiptUrl: order.receipt_url,
    maskedEmail: maskEmail(order.guest_email),
  });

  const result = await deps.send({
    to: order.guest_email,
    subject: content.subject,
    html: content.html,
    text: content.text,
    tag: order.is_test ? "guest_purchase_guide_test" : "guest_purchase_guide",
    idempotencyKey: `guest-guide-${order.order_id}-${generation}`,
  });
  if (result.kind === "sent") {
    await finish(supabase, orderId, "sent", result.messageId, null);
    logServerEvent("guestEmail", "sent");
    return "sent";
  }
  if (result.kind === "retryable" || result.kind === "not_configured") {
    const reason = result.kind === "not_configured" ? "mail_not_configured" : result.reason;
    await finish(supabase, orderId, "retry", null, reason, result.kind === "retryable" ? result.retryAfterSeconds : 600);
    logServerEvent("guestEmail", `retry_${reason}`.slice(0, 60));
    return "pending";
  }
  await finish(supabase, orderId, "failed", null, result.reason);
  logServerEvent("guestEmail", `failed_${result.reason}`.slice(0, 60));
  return "failed";
}

/**
 * Background processor: sends every due queue entry (pending, retry whose
 * backoff elapsed, or an expired 'sending' lease). Bounded per run.
 */
export async function processDueGuestEmails(
  supabase: SupabaseClient,
  opts: { limit?: number; send?: MailSender } = {},
): Promise<{ processed: number; sent: number; pending: number; failed: number }> {
  const { data, error } = await supabase.rpc("due_guest_purchase_emails", { p_limit: opts.limit ?? 20 });
  if (error) {
    logServerError("guestEmail", error, "due_list_failed");
    return { processed: 0, sent: 0, pending: 0, failed: 0 };
  }
  const ids = ((data ?? []) as { order_id: string }[]).map((r) => r.order_id);
  const out = { processed: 0, sent: 0, pending: 0, failed: 0 };
  for (const id of ids) {
    const status = await sendGuestPurchaseEmail(supabase, id, opts.send ? { send: opts.send } : undefined);
    out.processed++;
    if (status === "sent") out.sent++;
    else if (status === "failed") out.failed++;
    else if (status === "pending") out.pending++;
  }
  return out;
}
