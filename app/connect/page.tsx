import type { Metadata } from "next";
import { Suspense } from "react";
import ConnectContent from "./ConnectContent";
import { getRequestLocale } from "@/lib/i18n/serverLocale";
import { getMessages } from "@/lib/i18n/messages";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";
import { createRouteSupabaseClient } from "@/lib/supabase/serverClient";
import { resolveConnectLinkOwnerName } from "@/lib/relationship/personalConnect/personalConnectLinks";
import { ROUTES } from "@/constants/routes";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Personal connect links (the actual "친구 초대" / add-friend share URL, see
 * lib/relationship/inviteShare.ts) previously had NO server-side metadata at
 * all — this page was 100% client-rendered, so a shared link fell all the
 * way through to the generic homepage title/description with no image,
 * which is why KakaoTalk/iMessage/etc. showed no real preview card. Mirrors
 * app/invite/page.tsx's split (server page owns generateMetadata, client
 * ConnectContent owns the interactive landing state), but additionally
 * personalizes with the token owner's name and points openGraph/twitter at
 * a dynamically generated image (app/api/og/connect) — a plain Route
 * Handler rather than the opengraph-image.tsx file convention, since that
 * convention only receives dynamic *path* params, not this route's
 * `?token=` query string.
 */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const sp = await searchParams;
  const tokenParam = sp.token;
  const token = typeof tokenParam === "string" ? tokenParam.trim() : "";

  const title = messages.invite.metaTitle;
  const description = messages.invite.metaDescription;
  const imageUrl =
    locale === "ko-KR"
      ? "https://www.ahaitsme.com/social/invite/invite-friend-ko-v2.png"
      : "https://www.ahaitsme.com/social/invite/invite-friend-en-v2.png";

  return buildPageMetadata({
    locale,
    path: ROUTES.connect,
    title,
    description,
    imageUrl,
  });
}

export default async function ConnectPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  return (
    <Suspense fallback={<div className="p-8">{messages.invite.loadingFallback}</div>}>
      <ConnectContent />
    </Suspense>
  );
}
