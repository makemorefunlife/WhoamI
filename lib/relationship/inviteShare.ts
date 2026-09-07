import { localeToPathPrefix, type Locale } from "@/lib/i18n/locale";

/**
 * `locale` must be the SHARER's own current locale — the link should open
 * on whichever site (en-US or ko-KR) the person sharing it is using, not
 * whatever the recipient's browser happens to default to. Without a path
 * prefix, every invite/connect link silently opened on the en-US default
 * regardless of which site it was generated from.
 */
export function buildInviteUrl(token: string, locale: Locale, origin?: string): string {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}${localeToPathPrefix(locale)}/invite?token=${encodeURIComponent(token)}`;
}

/** Personal connect link (separate, persistent, reusable system) -> /connect. */
export function buildConnectUrl(token: string, locale: Locale, origin?: string): string {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}${localeToPathPrefix(locale)}/connect?token=${encodeURIComponent(token)}`;
}

/**
 * `message` must be the sharer's own locale's copy (messages.hub.inviteShareMessage)
 * — this module has no i18n of its own on purpose, so a caller can never
 * forget which locale's text belongs on which locale's link.
 */
export function inviteShareText(url: string, message: string): string {
  return `${message}\n${url}`;
}

export async function copyInviteLink(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

export function openWhatsAppShare(url: string, message: string) {
  const text = encodeURIComponent(inviteShareText(url, message));
  window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
}

/** iMessage / SMS */
export function openSmsShare(url: string, message: string) {
  const body = encodeURIComponent(inviteShareText(url, message));
  window.location.href = `sms:?&body=${body}`;
}

export function openGoogleChatShare(url: string, message: string) {
  const text = encodeURIComponent(inviteShareText(url, message));
  window.open(
    `https://mail.google.com/chat/u/0/#chat/new?message=${text}`,
    "_blank",
    "noopener,noreferrer",
  );
}

export async function nativeShareInvite(
  url: string,
  title: string,
  message: string,
): Promise<boolean> {
  if (!navigator.share) return false;
  try {
    await navigator.share({
      title,
      text: message,
      url,
    });
    return true;
  } catch {
    return false;
  }
}
