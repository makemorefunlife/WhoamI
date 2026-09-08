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

  let ownerName: string | null | undefined;
  if (token) {
    const supabase = createRouteSupabaseClient();
    if (supabase) {
      ownerName = await resolveConnectLinkOwnerName(supabase, token);
    }
  }

  const title =
    ownerName !== undefined
      ? messages.connect.invitedByTitle(ownerName ?? messages.connect.someoneFallbackName)
      : messages.connect.invalidTitle;
  const description = ownerName !== undefined ? messages.connect.invitedByBody : messages.connect.invalidBody;

  const base = buildPageMetadata({ locale, path: ROUTES.connect, title, description });

  if (ownerName === undefined) return base;

  const ogImageUrl = `/api/og/connect?token=${encodeURIComponent(token)}&locale=${locale}`;
  return {
    ...base,
    openGraph: { ...base.openGraph, images: [{ url: ogImageUrl, width: 1200, height: 630 }] },
    twitter: { ...base.twitter, card: "summary_large_image", images: [ogImageUrl] },
  };
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
