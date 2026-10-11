"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import GuestSurveyStep from "@/components/payment/GuestSurveyStep";
import FreeRelationshipPreviewCard from "@/components/relationship/map/FreeRelationshipPreviewCard";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { isPsychSurveyRequired } from "@/lib/i18n/localePolicy";
import { ROUTES, relationshipHubRoute } from "@/constants/routes";
import { clearPendingBirthDraft, readPendingBirthDraft } from "@/lib/home/pendingBirthDraft";

type GuestState =
  | { status: "loading" }
  | { status: "none" }
  | {
      status: "active";
      inviterName: string | null;
      expiresAt: string;
      emailVerified: boolean;
      maskedEmail: string | null;
    };

/**
 * Non-member invite participation (IA v2 §4-2).
 *   none + draft  -> consent (+ US survey) -> join -> result
 *   none          -> recover on this browser with a confirmed email
 *   active        -> free relationship result, optional email, sign up to save
 *   signed in     -> link to the account (needs this browser's participation)
 */
export default function GuestInviteClient() {
  const { locale, messages, href } = useLocale();
  const t = messages.guestInvite;
  const router = useRouter();
  const params = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const [state, setState] = useState<GuestState>({ status: "loading" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/invite/guest/state", { cache: "no-store" });
      const data = await res.json();
      setState(data?.status === "active" ? (data as GuestState) : { status: "none" });
    } catch {
      setState({ status: "none" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const link = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/invite/guest/link", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.reportId) {
        setError(t.linkFailed);
        return;
      }
      router.replace(href(relationshipHubRoute(data.reportId, data.relationshipReportId ?? null)));
    } finally {
      setBusy(false);
    }
  }, [router, href, t.linkFailed]);

  // Back from sign-up / sign-in with ?link=1: save to the account once.
  const wantsLink = params.get("link") === "1";
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !wantsLink || state.status !== "active" || busy) return;
    void link();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, wantsLink, state.status]);

  if (state.status === "loading") {
    return (
      <StitchSurveyShell>
        <p className="px-6 py-24 text-center text-sm text-on-surface-variant">{messages.report.chrome.loading}</p>
      </StitchSurveyShell>
    );
  }

  if (state.status === "none") {
    return (
      <StitchSurveyShell>
        <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-5 py-14 sm:px-6">
          <JoinSection onJoined={load} />
          <RecoverSection onRecovered={load} />
        </main>
      </StitchSurveyShell>
    );
  }

  const until = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(
    new Date(state.expiresAt),
  );
  const backHere = href("/invite/guest?link=1");

  return (
    <StitchSurveyShell>
      <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-5 py-12 sm:px-6">
        <header className="space-y-2 text-center">
          <h1 className="stitch-headline text-2xl text-primary">
            {state.inviterName ? t.connectedTitle(state.inviterName) : t.connectedTitleGeneric}
          </h1>
          <p className="text-xs text-on-surface-variant">{t.keepUntil(until)}</p>
        </header>

        <FreeRelationshipPreviewCard relationshipReportId="" viewerReportId="" endpoint="/api/invite/guest/preview" guest />

        <section className="space-y-2 rounded-2xl border border-outline-variant/40 bg-surface/70 p-4">
          {isSignedIn ? (
            <button type="button" className="stitch-cta-primary w-full disabled:opacity-60" disabled={busy} onClick={() => void link()}>
              {busy ? t.linking : t.linkCta}
            </button>
          ) : (
            <>
              <a className="stitch-cta-primary block w-full text-center" href={`${href(ROUTES.signUp)}?redirect_url=${encodeURIComponent(backHere)}`}>
                {t.saveCta}
              </a>
              <a className="block text-center text-sm text-on-surface-variant underline underline-offset-2" href={`${href(ROUTES.signIn)}?redirect_url=${encodeURIComponent(backHere)}`}>
                {t.signInCta}
              </a>
            </>
          )}
          {error ? <p className="text-center text-xs text-red-700">{error}</p> : null}
          <p className="text-center text-[11px] text-on-surface-variant">{t.paidNote}</p>
        </section>

        <EmailSection verified={state.emailVerified} masked={state.maskedEmail} onDone={load} />
      </main>
    </StitchSurveyShell>
  );
}

function JoinSection({ onJoined }: { onJoined: () => void }) {
  const { locale, messages } = useLocale();
  const t = messages.guestInvite;
  const [name, setName] = useState("");
  const [age, setAge] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [survey, setSurvey] = useState<Record<string, string> | null>(null);
  const [step, setStep] = useState<"form" | "survey">("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draft = typeof window === "undefined" ? null : readPendingBirthDraft();
  const token = typeof window === "undefined" ? "" : localStorage.getItem("inviteToken")?.trim() ?? "";
  const surveyRequired = isPsychSurveyRequired(locale);

  if (!draft || !token) {
    return <p className="rounded-2xl border border-dashed border-outline-variant/50 p-5 text-center text-sm text-on-surface-variant">{t.noDraft}</p>;
  }

  async function submit(answers: Record<string, string> | null) {
    if (!draft) return;
    if (!privacy || (locale === "ko-KR" && !age)) {
      setError(t.errorConsent);
      return;
    }
    if (surveyRequired && !answers) {
      setStep("survey");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/invite/guest/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteToken: token,
          locale,
          displayName: name,
          ...draft,
          surveyAnswers: answers,
          consent: { age, privacy },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.code === "unavailable" ? t.errorUnavailable : data?.code === "consent_required" ? t.errorConsent : t.errorGeneric);
        return;
      }
      // Participation now lives on the server; the browser copy is not needed.
      clearPendingBirthDraft();
      localStorage.removeItem("inviteToken");
      onJoined();
    } finally {
      setBusy(false);
    }
  }

  if (step === "survey") {
    return (
      <GuestSurveyStep
        required
        hasStoredSurvey={false}
        busy={busy}
        onBack={() => setStep("form")}
        onComplete={(answers) => {
          setSurvey(answers);
          void submit(answers);
        }}
        onSkip={() => setStep("form")}
        onKeepStored={() => setStep("form")}
      />
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-outline-variant/40 bg-surface/70 p-5">
      <h1 className="stitch-headline text-xl text-primary">{t.joinTitle}</h1>
      <p className="text-sm text-on-surface-variant">{t.joinBody}</p>
      <label className="block space-y-1 text-sm">
        <span className="text-on-surface-variant">{t.nameLabel}</span>
        <input
          className="w-full rounded-xl border border-outline-variant/60 bg-white px-3 py-2"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      {locale === "ko-KR" ? (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={age} onChange={(e) => setAge(e.target.checked)} />
          <span>{t.ageConsent}</span>
        </label>
      ) : null}
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
        <span>{t.privacyConsent}</span>
      </label>
      {surveyRequired ? <p className="text-xs text-on-surface-variant">{t.surveyRequired}</p> : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      <button
        type="button"
        className="stitch-cta-primary w-full disabled:opacity-60"
        disabled={busy || !name.trim()}
        onClick={() => void submit(survey)}
      >
        {busy ? t.joining : t.joinCta}
      </button>
    </section>
  );
}

function EmailSection({ verified, masked, onDone }: { verified: boolean; masked: string | null; onDone: () => void }) {
  const { messages } = useLocale();
  const t = messages.guestInvite;
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  if (verified && masked) {
    return <p className="text-center text-xs text-on-surface-variant">{t.emailVerified(masked)}</p>;
  }
  return (
    <section className="space-y-2 rounded-2xl border border-outline-variant/30 p-4">
      <p className="text-sm font-semibold text-primary">{t.emailTitle}</p>
      <p className="text-xs text-on-surface-variant">{t.emailBody}</p>
      <div className="flex gap-2">
        <input className="min-w-0 flex-1 rounded-xl border border-outline-variant/60 bg-white px-3 py-2 text-sm" type="email" placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} />
        <button
          type="button"
          className="stitch-cta-secondary !min-w-0 px-3 text-sm"
          onClick={async () => {
            const res = await fetch("/api/invite/guest/email/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
            setSent(res.ok);
            setNote(res.ok ? t.codeSent : t.errorGeneric);
          }}
        >
          {t.sendCode}
        </button>
      </div>
      {sent ? (
        <div className="flex gap-2">
          <input className="min-w-0 flex-1 rounded-xl border border-outline-variant/60 bg-white px-3 py-2 text-sm" inputMode="numeric" placeholder={t.codePlaceholder} value={code} onChange={(e) => setCode(e.target.value)} />
          <button
            type="button"
            className="stitch-cta-primary !min-w-0 px-3 text-sm"
            onClick={async () => {
              const res = await fetch("/api/invite/guest/email/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
              if (res.ok) onDone();
              else setNote(t.wrongCode);
            }}
          >
            {t.verifyCode}
          </button>
        </div>
      ) : null}
      {note ? <p className="text-xs text-on-surface-variant">{note}</p> : null}
    </section>
  );
}

function RecoverSection({ onRecovered }: { onRecovered: () => void }) {
  const { messages } = useLocale();
  const t = messages.guestInvite;
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  return (
    <section className="space-y-2 rounded-2xl border border-outline-variant/30 p-4">
      <p className="text-sm font-semibold text-primary">{t.recoverTitle}</p>
      <p className="text-xs text-on-surface-variant">{t.recoverBody}</p>
      <div className="flex gap-2">
        <input className="min-w-0 flex-1 rounded-xl border border-outline-variant/60 bg-white px-3 py-2 text-sm" type="email" placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} />
        <button
          type="button"
          className="stitch-cta-secondary !min-w-0 px-3 text-sm"
          onClick={async () => {
            await fetch("/api/invite/guest/recover/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
            setSent(true);
            setNote(t.recoverSent);
          }}
        >
          {t.sendCode}
        </button>
      </div>
      {sent ? (
        <div className="flex gap-2">
          <input className="min-w-0 flex-1 rounded-xl border border-outline-variant/60 bg-white px-3 py-2 text-sm" inputMode="numeric" placeholder={t.codePlaceholder} value={code} onChange={(e) => setCode(e.target.value)} />
          <button
            type="button"
            className="stitch-cta-primary !min-w-0 px-3 text-sm"
            onClick={async () => {
              const res = await fetch("/api/invite/guest/recover/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
              if (res.ok) {
                setNote(t.recoverDone);
                onRecovered();
              } else setNote(t.wrongCode);
            }}
          >
            {t.verifyCode}
          </button>
        </div>
      ) : null}
      {note ? <p className="text-xs text-on-surface-variant">{note}</p> : null}
    </section>
  );
}
