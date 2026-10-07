"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  buildDiscoveryRoleText,
  fetchDiscoveryRoleIds,
  type DiscoveryRoleText,
} from "@/lib/relationship/map/discoveryRoleText";

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
  viewerReportId,
  discovery,
  busy,
  onConfirm,
}: {
  viewerReportId: string;
  discovery: DiscoveryItem;
  busy: boolean;
  onConfirm: () => void;
}) {
  const { messages, locale } = useLocale();
  const [loaded, setLoaded] = useState<{ key: string; text: DiscoveryRoleText | null } | null>(null);
  const pairKey = `${viewerReportId}:${discovery.relationshipReportId}`;
  const roleText = loaded?.key === pairKey ? loaded.text : null;

  // Best-effort: show "who is who to whom" + its meaning right on the card.
  // On any failure the card keeps its generic copy.
  useEffect(() => {
    let cancelled = false;
    void fetchDiscoveryRoleIds(viewerReportId, discovery.relationshipReportId).then((ids) => {
      if (cancelled || !ids) return;
      setLoaded({
        key: pairKey,
        text: buildDiscoveryRoleText({
          locale,
          partnerName: discovery.name,
          roleId: ids.roleId,
          reciprocalRoleId: ids.reciprocalRoleId,
          messages: messages.relationshipMap,
        }),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [viewerReportId, pairKey, discovery.relationshipReportId, discovery.name, locale, messages]);

  return (
    <div className="space-y-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 p-4">
      <p className="text-sm font-semibold text-on-surface">
        {messages.connect.discoveryTitle}
      </p>
      <p className="text-sm text-on-surface-variant">
        {messages.connect.discoveryBody(discovery.name)}
      </p>
      {roleText
        ? [roleText.other, roleText.viewer].map((l, i) =>
            l ? (
              <div key={i} className="space-y-0.5">
                <p className="text-sm font-semibold text-on-surface">{l.sentence}</p>
                <p className="text-xs leading-relaxed text-on-surface-variant">{l.meaning}</p>
              </div>
            ) : null,
          )
        : null}
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
