"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * Edits the canonical display name — user.publicMetadata.displayName on
 * Clerk's own User object (see app/api/account/display-name/route.ts and
 * the architecture audit that moved this off reports.name). Auth-only:
 * no reportId, works even for a signed-in user with no report yet.
 */
export default function DisplayNameEditor() {
  const { messages } = useLocale();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeKind, setNoticeKind] = useState<"error" | "success" | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/account/display-name");
        const data = (await res.json().catch(() => ({}))) as { displayName?: string | null };
        if (!cancelled && res.ok) setValue(data.displayName ?? "");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    if (busy) return;
    const trimmed = value.trim();
    if (!trimmed) {
      setNotice(messages.account.displayNameRequired);
      setNoticeKind("error");
      return;
    }
    setBusy(true);
    setNotice(null);
    setNoticeKind(null);
    try {
      const res = await fetch("/api/account/display-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: trimmed }),
      });
      if (!res.ok) {
        setNotice(messages.account.displayNameSaveFailed);
        setNoticeKind("error");
        return;
      }
      setValue(trimmed);
      setNotice(messages.account.displayNameSaved);
      setNoticeKind("success");
    } catch {
      setNotice(messages.account.displayNameSaveFailed);
      setNoticeKind("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
      <h2 className="stitch-headline text-xl text-primary">{messages.account.displayNameTitle}</h2>
      <p className="mt-1 text-sm text-on-surface-variant">{messages.account.displayNameSubtitle}</p>

      {loading ? (
        <p className="mt-4 text-sm text-on-surface-variant">{messages.account.displayNameLoading}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={messages.account.displayNamePlaceholder}
            maxLength={60}
            className="min-h-[44px] flex-1 rounded-xl border border-outline-variant/45 bg-surface px-4 text-sm text-on-surface outline-none focus:border-primary/60"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSave()}
            className="stitch-cta-primary min-h-[44px] !w-auto !min-w-[6rem] !py-0 disabled:opacity-50"
          >
            {busy ? messages.account.displayNameSaving : messages.account.displayNameSave}
          </button>
        </div>
      )}

      {notice ? (
        <p
          className={`mt-3 text-sm ${
            noticeKind === "error" ? "text-rose-700" : "text-primary"
          }`}
        >
          {notice}
        </p>
      ) : null}
    </section>
  );
}
