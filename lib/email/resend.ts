/**
 * Resend transactional email (SERVER ONLY). https://resend.com/docs/api-reference/emails/send-email
 *
 * Env:
 *   RESEND_API_KEY   API key (never logged / returned)
 *   MAIL_FROM        Sender, e.g. "Aha! It's me <no-reply@ahaitsme.com>". The
 *                    domain must be verified in Resend (SPF/DKIM). Resend's
 *                    shared test sender (onboarding@resend.dev) only delivers
 *                    to the Resend account owner's own address.
 *
 * Idempotency: every call carries an Idempotency-Key (Resend keeps it for 24
 * hours), so a retry after a timeout / crash with the same key does not send
 * a second copy. Callers build the key from the order id + email generation.
 *
 * Returns a typed outcome instead of throwing:
 *   sent         accepted by Resend (has an id)
 *   retryable    transient (network / timeout / 5xx / 429) -- retry later,
 *                honoring retryAfterSeconds when Resend sent Retry-After
 *   failed       permanent (bad sender / invalid recipient / auth) -- needs a fix
 *   not_configured  RESEND_API_KEY or MAIL_FROM missing
 */

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Resend tag value (no personal data). */
  tag: string;
  idempotencyKey: string;
};

export type MailResult =
  | { kind: "sent"; messageId: string }
  | { kind: "retryable"; reason: string; retryAfterSeconds?: number }
  | { kind: "failed"; reason: string }
  | { kind: "not_configured" };

export type MailSender = (msg: MailMessage) => Promise<MailResult>;

const RESEND_URL = "https://api.resend.com/emails";
const TIMEOUT_MS = 10_000;

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.MAIL_FROM?.trim());
}

function retryAfter(res: Response): number | undefined {
  const raw = res.headers.get("retry-after");
  if (!raw) return undefined;
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 0) return Math.min(Math.ceil(n), 3600);
  const at = Date.parse(raw);
  return Number.isFinite(at) ? Math.min(Math.max(Math.ceil((at - Date.now()) / 1000), 0), 3600) : undefined;
}

export const sendResendEmail: MailSender = async (msg) => {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim();
  if (!key || !from) return { kind: "not_configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": msg.idempotencyKey,
      },
      body: JSON.stringify({
        from,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        tags: [{ name: "category", value: msg.tag }],
      }),
      signal: controller.signal,
    });
    const body = (await res.json().catch(() => null)) as { id?: string; name?: string } | null;
    if (res.ok && body && typeof body.id === "string") return { kind: "sent", messageId: body.id };
    const reason = `resend_${res.status}_${(body?.name ?? "error").replace(/[^a-z_]/gi, "").slice(0, 40)}`;
    if (res.status === 429 || res.status >= 500) return { kind: "retryable", reason, retryAfterSeconds: retryAfter(res) };
    // 409 = same Idempotency-Key with a different payload, or still in flight:
    // do not resend under this key -- treat as transient and look again later.
    if (res.status === 409) return { kind: "retryable", reason, retryAfterSeconds: 60 };
    return { kind: "failed", reason };
  } catch {
    return { kind: "retryable", reason: "resend_network_or_timeout" };
  } finally {
    clearTimeout(timer);
  }
};
