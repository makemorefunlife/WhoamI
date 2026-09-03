"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type PendingRequest = {
  relationshipReportId: string;
  otherReportId: string;
  name: string;
};

/**
 * Reciprocal connection requests (spec sections 9-10): someone joined
 * through this viewer's personal link and is waiting to be let into the
 * viewer's own map. Deliberately small and quiet — this is NOT a
 * premium-analysis or report-share request, and NOT a social-network inbox.
 * Renders nothing when there's nothing pending.
 */
export default function ConnectionRequestsPanel({
  reportId,
  onResponded,
}: {
  reportId: string;
  onResponded: () => void;
}) {
  const { messages } = useLocale();
  const [requests, setRequests] = useState<PendingRequest[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/connect/pending?reportId=${encodeURIComponent(reportId)}`);
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        setRequests(res.ok && Array.isArray(data?.requests) ? data.requests : []);
      } catch {
        if (!cancelled) setRequests([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  async function respond(req: PendingRequest, action: "accept" | "decline") {
    if (busyId) return;
    setBusyId(req.relationshipReportId);
    try {
      const res = await fetch("/api/connect/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          relationshipReportId: req.relationshipReportId,
          action,
        }),
      });
      if (res.ok) {
        setRequests((prev) =>
          (prev ?? []).filter((r) => r.relationshipReportId !== req.relationshipReportId),
        );
        onResponded();
      }
    } finally {
      setBusyId(null);
    }
  }

  if (!requests || requests.length === 0) return null;

  return (
    <div className="space-y-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 p-4">
      <p className="text-sm font-semibold text-on-surface">
        {messages.connect.pendingSectionTitle}
      </p>
      <div className="space-y-2">
        {requests.map((req) => (
          <div
            key={req.relationshipReportId}
            className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2.5"
          >
            <p className="text-sm text-on-surface">
              {messages.connect.pendingRequestTitle(req.name)}
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={busyId === req.relationshipReportId}
                onClick={() => void respond(req, "decline")}
                className="min-h-[36px] rounded-full border border-outline-variant/45 px-3 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container-low disabled:opacity-50"
              >
                {messages.connect.declineCta}
              </button>
              <button
                type="button"
                disabled={busyId === req.relationshipReportId}
                onClick={() => void respond(req, "accept")}
                className="min-h-[36px] rounded-full bg-primary px-3 text-xs font-semibold text-on-primary transition disabled:opacity-50"
              >
                {messages.connect.acceptCta}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
