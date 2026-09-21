"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

export type DiscoveryItem = {
  relationshipReportId: string;
  otherReportId: string;
  name: string;
};

/**
 * Relationship Discovery Flow V1 -- one unseen connection at a time.
 * Deliberately the lightest possible affordance: no unread count, no
 * notification center, no stack of cards -- just "here is one new
 * connection, look at it". RelationHubDashboard only ever renders this
 * for `discoveries[0]`; confirming one reveals the next on the following
 * render, if any are left.
 */
export default function RelationshipDiscoveryCard({
  discovery,
  busy,
  onConfirm,
}: {
  discovery: DiscoveryItem;
  busy: boolean;
  onConfirm: () => void;
}) {
  const { messages } = useLocale();

  return (
    <div className="space-y-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 p-4">
      <p className="text-sm font-semibold text-on-surface">
        {messages.connect.discoveryTitle}
      </p>
      <p className="text-sm text-on-surface-variant">
        {messages.connect.discoveryBody(discovery.name)}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={onConfirm}
        className="min-h-[40px] rounded-full bg-primary px-4 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:opacity-50"
      >
        {messages.connect.discoveryConfirmCta}
      </button>
    </div>
  );
}
