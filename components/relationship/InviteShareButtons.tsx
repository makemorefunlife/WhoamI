"use client";

import { useState } from "react";
import {
  buildInviteUrl,
  copyInviteLink,
  nativeShareInvite,
  openGoogleChatShare,
  openSmsShare,
  openWhatsAppShare,
} from "@/lib/relationship/inviteShare";
import { useLocale } from "@/lib/i18n/LocaleProvider";

// Both current callers (AddFriendSheet, SentRequestsSheet) render this inside
// the light "stitch" theme sheet — these were still the dark "space" theme's
// near-white-on-white-ish tokens, which read as invisible text there.
const primaryBtn =
  "flex-1 rounded-xl border border-outline-variant/45 bg-surface px-3 py-2.5 text-xs font-medium text-on-surface transition hover:border-secondary/40 hover:bg-surface-container-low";

const shareOptionBtn =
  "rounded-xl border border-outline-variant/35 bg-surface px-3 py-2 text-xs text-on-surface-variant transition hover:border-secondary/35 hover:bg-surface-container-low hover:text-on-surface";

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

  async function onCopy() {
    const ok = await copyInviteLink(url);
    alert(ok ? messages.hub.inviteLinkCopied : messages.hub.inviteLinkCopyFailed);
  }

  async function onNative() {
    const ok = await nativeShareInvite(url);
    if (!ok) {
      alert(messages.hub.nativeShareUnavailable);
    }
  }

  function toggleShare() {
    setShareOpen((v) => !v);
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
            onClick={() => openWhatsAppShare(url)}
          >
            WhatsApp
          </button>
          <button
            type="button"
            className={shareOptionBtn}
            onClick={() => openSmsShare(url)}
          >
            {messages.hub.shareViaSms}
          </button>
          <button
            type="button"
            className={shareOptionBtn}
            onClick={() => openGoogleChatShare(url)}
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
