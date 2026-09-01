"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import { hubPanelClass } from "@/components/relationship/hub/relationHubStyles";
import { copyInviteLink } from "@/lib/relationship/inviteShare";
import { buildAnonymousMapShare, type MapShareSummaryInput } from "@/lib/relationship/map/buildAnonymousMapShare";
import { buildAnonymousMapShareText } from "@/lib/relationship/map/anonymousMapShareText";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * "Share my Relationship Map" — spec gap-closure sections 7-9. The preview
 * is built purely from {roleId, count} (the same name-free shape the map's
 * own summary API returns), so there is nothing here that *could* leak a
 * name, id, or Day Master value — see buildAnonymousMapShare.
 */
export default function MapShareButton({ summary }: { summary: MapShareSummaryInput }) {
  const { locale, messages } = useLocale();
  const [open, setOpen] = useState(false);

  const share = buildAnonymousMapShare(summary, locale);
  const text = buildAnonymousMapShareText(
    share,
    messages.relationshipMap.personCount,
    messages.relationshipMap.title,
  );

  async function handleCopy() {
    const ok = await copyInviteLink(text);
    alert(ok ? messages.relationshipMap.mapShare.copied : messages.relationshipMap.mapShare.copyFailed);
  }

  async function handleNativeShare() {
    if (typeof navigator === "undefined" || !navigator.share) {
      await handleCopy();
      return;
    }
    try {
      await navigator.share({ title: messages.relationshipMap.title, text });
    } catch {
      // user cancelled — no-op
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-outline-variant/40 px-3.5 py-1.5 text-xs font-medium text-on-surface-variant transition hover:border-secondary/40 hover:text-primary"
      >
        <Share2 className="h-3.5 w-3.5" />
        {messages.relationshipMap.mapShare.cta}
      </button>

      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${hubPanelClass()} mt-3 space-y-2 p-4`}
        >
          <ul className="space-y-1">
            {share.roles
              .filter((r) => r.count > 0)
              .map((r) => (
                <li key={r.roleId} className="flex items-center justify-between text-sm text-primary">
                  <span>{r.label}</span>
                  <span className="text-on-surface-variant">
                    {messages.relationshipMap.personCount(r.count)} · {r.percent}%
                  </span>
                </li>
              ))}
          </ul>
          <p className="text-[11px] text-on-surface-variant">{messages.relationshipMap.mapShare.previewNote}</p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="flex-1 rounded-xl border border-outline-variant/45 bg-surface px-3 py-2 text-xs font-medium text-on-surface transition hover:border-secondary/40"
            >
              {messages.hub.copyLink}
            </button>
            <button
              type="button"
              onClick={() => void handleNativeShare()}
              className="flex-1 rounded-xl border border-outline-variant/45 bg-surface px-3 py-2 text-xs font-medium text-on-surface transition hover:border-secondary/40"
            >
              {messages.hub.shareToggleCta}
            </button>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
