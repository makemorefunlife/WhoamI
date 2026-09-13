"use client";

import { useState } from "react";
import {
  buildInviteUrl,
  copyInviteLink,
  nativeShareInvite,
  openGoogleChatShare,
  openSmsShare,
  openWhatsAppShare,
  shareKakaoInvite,
} from "@/lib/relationship/inviteShare";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { normalizeLocale } from "@/lib/i18n/locale";

// Both current callers (AddFriendSheet, SentRequestsSheet) render this inside
// the light "stitch" theme sheet — these were still the dark "space" theme's
// near-white-on-white-ish tokens, which read as invisible text there.
const primaryBtn =
  "flex-1 rounded-xl border border-outline-variant/45 bg-surface px-3 py-2.5 text-xs font-medium text-on-surface transition hover:border-secondary/40 hover:bg-surface-container-low text-center flex items-center justify-center";

const shareOptionBtn =
  "rounded-xl border border-outline-variant/35 bg-surface px-3 py-2 text-xs text-on-surface-variant transition hover:border-secondary/35 hover:bg-surface-container-low hover:text-on-surface text-center flex items-center justify-center";

export default function InviteShareButtons({
  inviteToken,
  compact = false,
  url: urlOverride,
}: {
  inviteToken: string;
  compact?: boolean;
  /** Share a different link than /invite?token=... (e.g. the personal connect link). */
  url?: string;
}) {
  const { messages, locale } = useLocale();
  const [shareOpen, setShareOpen] = useState(false);
  const url = urlOverride ?? buildInviteUrl(inviteToken, locale);
  const isKo = normalizeLocale(locale) === "ko-KR";

  async function onCopy() {
    const ok = await copyInviteLink(url);
    alert(ok ? messages.hub.inviteLinkCopied : messages.hub.inviteLinkCopyFailed);
  }

  async function onNative() {
    const ok = await nativeShareInvite(
      url,
      messages.hub.inviteShareTitle,
      messages.hub.inviteShareMessage,
    );
    if (!ok) {
      alert(messages.hub.nativeShareUnavailable);
    }
  }

  async function onKakao() {
    const ok = await shareKakaoInvite(
      url,
      messages.invite.metaTitle,
      messages.invite.metaDescription,
      "https://www.ahaitsme.com/social/invite/invite-friend-ko.png",
    );
    if (!ok) {
      const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
      if (!kakaoKey) {
        alert(messages.hub.kakaoKeyMissing);
      } else {
        alert(messages.hub.shareFailedNotice);
      }
    }
  }

  function toggleShare() {
    setShareOpen((v) => !v);
  }

  if (isKo) {
    return (
      <div className={compact ? "space-y-2" : "space-y-3"}>
        {!compact ? (
          <p className="break-all text-[10px] text-on-surface-variant">{url}</p>
        ) : null}

        {/* 1. 카카오톡 (Primary Share Option) */}
        <button
          type="button"
          onClick={() => void onKakao()}
          className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-4 py-2.5 text-xs font-bold text-[#191919] shadow-sm transition hover:bg-[#fada0a] active:scale-[0.98]"
        >
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.27 6.054-.188.702-.682 2.545-.78 2.94-.122.495.18.488.38.356.157-.104 2.496-1.7 3.513-2.392.52.077 1.055.118 1.617.118 4.97 0 9-3.186 9-7.115S16.97 3 12 3z" />
          </svg>
          <span>{messages.hub.shareViaKakao}</span>
        </button>

        {/* 2. 메시지, 3. 링크 복사 */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={primaryBtn}
            onClick={() => openSmsShare(url, messages.hub.inviteShareMessage)}
          >
            {messages.hub.shareViaSms}
          </button>
          <button
            type="button"
            className={primaryBtn}
            onClick={() => void onCopy()}
          >
            {messages.hub.copyLink}
          </button>
        </div>

        {/* 보조 옵션: 다른 앱으로... */}
        <div className="pt-0.5 text-center">
          <button
            type="button"
            className="text-[11px] font-medium text-on-surface-variant underline-offset-2 transition hover:text-on-surface hover:underline"
            onClick={() => void onNative()}
          >
            {messages.hub.shareViaOtherApp}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!compact ? (
        <p className="break-all text-[10px] text-on-surface-variant">{url}</p>
      ) : null}

      <div className="flex gap-2">
        <button type="button" className={primaryBtn} onClick={() => void onCopy()}>
          {messages.hub.copyLink}
        </button>
        <button
          type="button"
          className={[
            primaryBtn,
            shareOpen ? "border-secondary/45 bg-secondary/10" : "",
          ].join(" ")}
          onClick={toggleShare}
          aria-expanded={shareOpen}
        >
          {messages.hub.shareToggleCta}{shareOpen ? " ↑" : ""}
        </button>
      </div>

      {shareOpen ? (
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-outline-variant/25 bg-surface-container-low/60 p-2.5">
          <button
            type="button"
            className={shareOptionBtn}
            onClick={() => openWhatsAppShare(url, messages.hub.inviteShareMessage)}
          >
            WhatsApp
          </button>
          <button
            type="button"
            className={shareOptionBtn}
            onClick={() => openSmsShare(url, messages.hub.inviteShareMessage)}
          >
            {messages.hub.shareViaSms}
          </button>
          <button
            type="button"
            className={shareOptionBtn}
            onClick={() => openGoogleChatShare(url, messages.hub.inviteShareMessage)}
          >
            Google Chat
          </button>
          <button
            type="button"
            className={shareOptionBtn}
            onClick={() => void onNative()}
          >
            {messages.hub.shareViaOtherApp}
          </button>
        </div>
      ) : null}
    </div>
  );
}

