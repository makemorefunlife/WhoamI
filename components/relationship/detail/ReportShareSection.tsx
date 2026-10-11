"use client";

import { useEffect, useState } from "react";
import { hubPanelClass, hubTouchBtn } from "@/components/relationship/hub/relationHubStyles";
import { copyInviteLink } from "@/lib/relationship/inviteShare";
import { useLocale } from "@/lib/i18n/LocaleProvider";

import NoticeDialog from "@/components/common/NoticeDialog";

type ShareState = "loading" | "private" | "shared";

/**
 * Explicit, opt-in share consent at the end of the viewer's OWN premium
 * report — spec sections 32-36. Reports are PRIVATE to their creator by
 * default; the other participant can open this exact report only while it
 * is shared. Stopping blocks new opens; it does not take back what was read.
 */
export default function ReportShareSection({
  relationshipReportId,
  viewerReportId,
  kind,
  premiumReportId,
  recipientName,
}: {
  relationshipReportId: string;
  viewerReportId: string;
  kind: string;
  /** The viewer's own report being shared (server re-checks the creator). */
  premiumReportId: string;
  recipientName: string;
}) {
  const { messages } = useLocale();
  const copy = messages.relationshipMap.reportShare;
  const [state, setState] = useState<ShareState>("loading");
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!relationshipReportId || !viewerReportId || !kind) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/relationship/share/status?relationshipReportId=${encodeURIComponent(relationshipReportId)}&ownerReportId=${encodeURIComponent(viewerReportId)}&kind=${encodeURIComponent(kind)}&premiumReportId=${encodeURIComponent(premiumReportId)}`,
        );
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (res.ok && data?.status === "shared") {
          setState("shared");
          setShareToken(data.shareToken ?? null);
        } else {
          setState("private");
        }
      } catch {
        if (!cancelled) setState("private");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [relationshipReportId, viewerReportId, kind, premiumReportId]);

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/relationship/share/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relationshipReportId, ownerReportId: viewerReportId, kind, premiumReportId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.shareToken) {
        setNoticeMessage(data?.error ?? copy.createFailed);
        return;
      }
      setShareToken(data.shareToken);
      setState("shared");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!shareToken || typeof window === "undefined") return;
    const url = `${window.location.origin}/relationship/share/${shareToken}`;
    const ok = await copyInviteLink(url);
    setNoticeMessage(ok ? messages.hub.inviteLinkCopied : messages.hub.inviteLinkCopyFailed);
  }

  async function handleStopSharing() {
    if (busy || !window.confirm(copy.stopSharingConfirm)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/relationship/share/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relationshipReportId, ownerReportId: viewerReportId, kind, premiumReportId }),
      });
      if (res.ok) {
        setState("private");
        setShareToken(null);
        setNoticeMessage(copy.stopSharingDone);
      }
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return null;

  return (
    <div className={`${hubPanelClass()} mt-6 space-y-3 p-5`}>
      {state === "private" ? (
        <>
          <h2 className="stitch-headline text-lg text-primary">{copy.sectionTitle}</h2>
          <p className="text-sm text-on-surface-variant">{copy.prompt(recipientName)}</p>
          <p className="text-sm text-on-surface-variant">{copy.explain(recipientName)}</p>
          <button type="button" onClick={() => void handleShare()} disabled={busy} className={hubTouchBtn(true)}>
            {copy.shareButton(recipientName)}
          </button>
          <p className="whitespace-pre-line text-xs text-on-surface-variant">{copy.reassurance}</p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-primary">{copy.linkReadyTitle}</p>
          <p className="text-xs text-on-surface-variant">{copy.copyLinkFallbackHint}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => void handleCopy()} className={hubTouchBtn(false)}>
              {messages.hub.copyLink}
            </button>
            <button
              type="button"
              onClick={() => void handleStopSharing()}
              disabled={busy}
              className={hubTouchBtn(false)}
            >
              {copy.stopSharingCta}
            </button>
          </div>
        </>
      )}
      <NoticeDialog
        open={Boolean(noticeMessage)}
        message={noticeMessage}
        onClose={() => setNoticeMessage(null)}
      />
    </div>
  );
}
