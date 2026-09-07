import type { Metadata } from "next";
import { Suspense } from "react";
import InviteContent from "./InviteContent";
import { getRequestLocale } from "@/lib/i18n/serverLocale";
import { getMessages } from "@/lib/i18n/messages";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";
import { ROUTES } from "@/constants/routes";

/**
 * Invite-specific title/description so a shared link previews correctly on
 * KakaoTalk/iMessage/Slack/WhatsApp (which fetch this URL server-side, no
 * JS) instead of falling through to the generic homepage metadata in
 * app/layout.tsx. Locale comes from getRequestLocale(), which reads the
 * proxy-forwarded request header first, then the locale cookie — see
 * proxy.ts's withLocaleRequestHeaders for why the header path matters for a
 * crawler's cookie-less first hit to /kr/invite.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  return buildPageMetadata({
    locale,
    path: ROUTES.invite,
    title: messages.invite.metaTitle,
    description: messages.invite.metaDescription,
  });
}

export default async function InvitePage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  return (
    <Suspense fallback={<div className="p-8">{messages.invite.loadingFallback}</div>}>
      <InviteContent />
    </Suspense>
  );
}
