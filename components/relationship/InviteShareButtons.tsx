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
import { useMessages } from "@/lib/i18n/LocaleProvider";

const primaryBtn =
  "flex-1 rounded-xl border border-white/18 bg-white/[0.05] px-3 py-2.5 text-xs font-medium text-[var(--space-text)] transition hover:border-white/30 hover:bg-white/[0.08]";

const shareOptionBtn =
  "rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2 text-xs text-[var(--space-text-muted)] transition hover:border-white/25 hover:bg-white/[0.06] hover:text-[var(--space-text)]";

export default function InviteShareButtons({
  inviteToken,
  compact = false,
}: {
  inviteToken: string;
  compact?: boolean;
}) {
  const messages = useMessages();
  const [shareOpen, setShareOpen] = useState(false);
  const url = buildInviteUrl(inviteToken);

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
        <p className="break-all text-[10px] text-white/45">{url}</p>
      ) : null}

      <div className="flex gap-2">
        <button type="button" className={primaryBtn} onClick={() => void onCopy()}>
          {messages.hub.copyLink}
        </button>
        <button
          type="button"
          className={[
            primaryBtn,
            shareOpen ? "border-[#67B7FF]/40 bg-[#67B7FF]/10" : "",
          ].join(" ")}
          onClick={toggleShare}
          aria-expanded={shareOpen}
        >
          {messages.hub.shareToggleCta}{shareOpen ? " ↑" : ""}
        </button>
      </div>

      {shareOpen ? (
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
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
