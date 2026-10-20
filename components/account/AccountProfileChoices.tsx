"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatBirthDate, formatBirthPlace, formatBirthTime } from "@/lib/account/formatBirthDisplay";
import type { ProfileChoices } from "@/lib/account/profileChoices";

/**
 * "Which saved details should we use?" -- shown only when the account's
 * grouped reports hold DIFFERENT saved birth details or surveys
 * (app/api/account/profile/choices). Renders nothing otherwise. English site
 * only for now (Korean screen changes wait for approval).
 */
export default function AccountProfileChoices({
  reportId,
  onChanged,
}: {
  reportId: string;
  onChanged?: () => void;
}) {
  const { locale, messages } = useLocale();
  const m = messages.account;
  const [choices, setChoices] = useState<ProfileChoices | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/account/profile/choices?reportId=${encodeURIComponent(reportId)}`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as { choices?: ProfileChoices | null };
      setChoices(res.ok ? (data.choices ?? null) : null);
    } catch {
      setChoices(null);
    }
  }, [reportId]);

  useEffect(() => {
    if (locale !== "en-US") return;
    void load();
  }, [locale, load]);

  const choose = useCallback(
    async (field: "birth" | "survey", sourceReportId: string) => {
      if (busy) return;
      setBusy(true);
      setNotice(null);
      try {
        const res = await fetch("/api/account/profile/choices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId, field, sourceReportId }),
        });
        const data = (await res.json().catch(() => ({}))) as { result?: string };
        if (res.ok && (data.result === "chosen" || data.result === "same")) {
          setNotice({ kind: "ok", text: m.profileChoiceDone });
          await load();
          onChanged?.();
        } else {
          setNotice({ kind: "error", text: m.profileChoiceFailed });
        }
      } catch {
        setNotice({ kind: "error", text: m.profileChoiceFailed });
      } finally {
        setBusy(false);
      }
    },
    [busy, reportId, load, onChanged, m],
  );

  if (locale !== "en-US" || !choices) return notice ? <p role="status" className="text-sm text-primary">{notice.text}</p> : null;
  const hasBirth = choices.birth.options.length > 0;
  const hasSurvey = choices.survey.options.length > 0;
  if (!hasBirth && !hasSurvey) {
    return notice ? (
      <p role="status" className="text-sm text-primary">
        {notice.text}
      </p>
    ) : null;
  }

  const birthLine = (b: { birthDate: string; birthTime: string | null; birthPlace: string | null }) =>
    [
      formatBirthDate(b.birthDate, locale, messages),
      formatBirthTime(
        { birthDate: b.birthDate, birthTime: b.birthTime, birthTimeUnknown: !b.birthTime, birthPlace: b.birthPlace, savedAt: "" },
        locale,
        messages,
      ),
      formatBirthPlace(b.birthPlace, false, messages),
    ].join(" · ");

  return (
    <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8" aria-labelledby="profile-choice-title">
      <h3 id="profile-choice-title" className="text-sm font-semibold text-primary">
        {m.profileChoiceTitle}
      </h3>
      {hasBirth ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-on-surface-variant">{m.profileChoiceBirthLead}</p>
          <ul className="space-y-2">
            <li className="rounded-xl border border-outline-variant/30 px-4 py-3 text-sm">
              <span className="font-medium text-on-surface">
                {choices.birth.current ? birthLine(choices.birth.current) : m.profileChoiceNone}
              </span>
              <span className="ml-2 text-xs text-on-surface-variant">{m.profileChoiceCurrent}</span>
            </li>
            {choices.birth.options.map((o) => (
              <li
                key={o.sourceReportId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-outline-variant/30 px-4 py-3 text-sm"
              >
                <span className="font-medium text-on-surface">{birthLine(o)}</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void choose("birth", o.sourceReportId)}
                  className="stitch-cta-secondary min-h-[36px] px-4 text-xs disabled:opacity-50"
                >
                  {m.profileChoiceUse}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {hasSurvey ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-on-surface-variant">{m.profileChoiceSurveyLead}</p>
          <ul className="space-y-2">
            {choices.survey.options.map((o) => (
              <li
                key={o.sourceReportId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-outline-variant/30 px-4 py-3 text-sm"
              >
                <span className="font-medium text-on-surface">
                  {m.profileChoiceSurveyAnswered(o.answeredAt ? o.answeredAt.slice(0, 10) : "—")}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void choose("survey", o.sourceReportId)}
                  className="stitch-cta-secondary min-h-[36px] px-4 text-xs disabled:opacity-50"
                >
                  {m.profileChoiceUse}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {notice ? (
        <p role="status" className={`mt-3 text-sm ${notice.kind === "error" ? "text-error" : "text-primary"}`}>
          {notice.text}
        </p>
      ) : null}
    </section>
  );
}
