"use client";

import { useEffect, useState } from "react";
import { hubPanelClass, hubTouchBtn } from "@/components/relationship/hub/relationHubStyles";
import { copyInviteLink } from "@/lib/relationship/inviteShare";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type ShareState = "loading" | "private" | "shared";

/**
 * Explicit, opt-in share consent at the end of a premium report — spec
 * sections 32-36. Reports are PRIVATE by default; nothing here fires until
 * the owner clicks the share button, and nothing here notifies the other
 * person either way.
 */
export default function ReportShareSection({
  relationshipReportId,
  viewerReportId,
  kind,
  recipientName,
}: {
  relationshipReportId: string;
  viewerReportId: string;
  kind: string;
  recipientName: string;
}) {
  const { messages } = useLocale();
  const copy = messages.relationshipMap.reportShare;
  const [state, setState] = useState<ShareState>("loading");
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!relationshipReportId || !viewerReportId || !kind) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/relationship/share/status?relationshipReportId=${encodeURIComponent(relationshipReportId)}&ownerReportId=${encodeURIComponent(viewerReportId)}&kind=${encodeURIComponent(kind)}`,
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
  }, [relationshipReportId, viewerReportId, kind]);

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/relationship/share/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relationshipReportId, ownerReportId: viewerReportId, kind }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.shareToken) {
        alert(data?.error ?? copy.createFailed);
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
    alert(ok ? messages.hub.inviteLinkCopied : messages.hub.inviteLinkCopyFailed);
  }

  async function handleStopSharing() {
    if (busy || !window.confirm(copy.stopSharingConfirm)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/relationship/share/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relationshipReportId, ownerReportId: viewerReportId, kind }),
      });
      if (res.ok) {
        setState("private");
        setShareToken(null);
        alert(copy.stopSharingDone);
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
    </div>
  );
}
