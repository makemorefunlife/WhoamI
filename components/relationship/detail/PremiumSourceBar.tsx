"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * [내 분석] / [공유받은 분석] / [이전 분석] -- which readable copy of this
 * kind is shown. The server decides what is readable (premiumAccess.ts);
 * this only switches between those copies and offers "create my own" when
 * the viewer has no own report yet.
 */
export default function PremiumSourceBar({
  source,
  sources,
  partnerName,
  busy,
  onSelect,
  onCreateOwn,
}: {
  source: string;
  sources: string[];
  partnerName: string;
  busy: boolean;
  onSelect: (source: string) => void;
  onCreateOwn: () => void;
}) {
  const { messages } = useLocale();
  const t = messages.relationshipMap.reportShare;
  const label = (s: string) =>
    s === "mine" ? t.sourceMine : s === "shared" ? t.sourceShared(partnerName) : t.sourceLegacy;
  const hasMine = sources.includes("mine");

  return (
    <div className="mt-4 space-y-2 rounded-xl border border-outline-variant/40 bg-surface/60 px-4 py-3">
      {sources.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="tablist">
          {sources.map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={s === source}
              disabled={busy}
              onClick={() => s !== source && onSelect(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                s === source ? "bg-primary text-on-primary" : "border border-outline-variant text-on-surface-variant"
              }`}
            >
              {label(s)}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs font-semibold text-primary">{label(source)}</p>
      )}
      {source === "shared" ? <p className="text-xs text-on-surface-variant">{t.sharedNote}</p> : null}
      {source === "legacy" ? <p className="text-xs text-on-surface-variant">{t.legacyNote}</p> : null}
      {!hasMine ? (
        <button
          type="button"
          disabled={busy}
          onClick={onCreateOwn}
          className="stitch-cta-secondary w-full disabled:opacity-50"
        >
          {t.createOwnCta}
        </button>
      ) : null}
    </div>
  );
}
