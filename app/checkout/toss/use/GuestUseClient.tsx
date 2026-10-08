"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { localizedPath } from "@/lib/i18n/locale";
import { ROUTES } from "@/constants/routes";
import TossResultShell from "../TossResultShell";
import StitchBirthInputForm, {
  isStitchBirthFormReady,
  type StitchBirthFormState,
} from "@/components/onboarding/StitchBirthInputForm";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import StitchDeepEssenceView from "@/components/results/StitchDeepEssenceView";
import { setAuthPrefillEmail } from "@/lib/auth/prefillEmail";
import type { SlimV1ReportResult } from "@/lib/v1/slim/types";

/**
 * Guest (no-account) use of a single Personal purchase.
 *
 *  1. Purchase verification on every device: the emailed link ("start on
 *     this device" -- an explicit click) or a code sent to the purchase email.
 *  2. Birth date / place (KR: survey optional; en-US needs the survey).
 *  3. Generate (uses the pass once; only on an explicit click).
 *  4. Result + "save to account" (Clerk sign-in / sign-up with the purchase
 *     email; only a matching verified email can save).
 */

type State = {
  status: "unverified" | "needs_input" | "ready" | "generating" | "generated" | "saved" | "expired" | "linked" | "not_available" | "error";
  linkReady?: boolean;
  maskedEmail?: string | null;
  email?: string | null;
  surveyRequired?: boolean;
  input?: {
    birthDate: string | null;
    birthTime: string | null;
    birthTimeUnknown: boolean;
    birthPlace: string | null;
    birthPlaceUnknown?: boolean;
    hasSurvey: boolean;
  } | null;
  report?: SlimV1ReportResult | null;
  retentionExpiresAt?: string | null;
  savedReportId?: string | null;
};

function VerifyPanel({ orderId, state, linkExpired, onVerified }: {
  orderId: string;
  state: State;
  linkExpired: boolean;
  onVerified: () => void;
}) {
  const { messages } = useLocale();
  const t = messages.payments.guestUse;
  const [busy, setBusy] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");

  const startWithLink = async () => {
    setBusy(true);
    const res = await fetch("/api/guest/access/link", { method: "POST" }).catch(() => null);
    setBusy(false);
    if (res?.ok) onVerified();
    else setNotice(t.linkExpiredNotice);
  };
  const sendCode = async () => {
    setBusy(true);
    setNotice("");
    const res = await fetch("/api/guest/access/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => ({}))) as { status?: string } | undefined;
    setBusy(false);
    if (body?.status === "sent") {
      setCodeSent(true);
      setNotice(state.maskedEmail ? t.codeSentTo(state.maskedEmail) : "");
    } else if (body?.status === "too_many" || res?.status === 429) setNotice(t.codeTooMany);
    else if (body?.status === "send_failed") setNotice(t.codeSendFailed);
    else setNotice(messages.payments.guestUse.notAvailableBody);
  };
  const verify = async () => {
    setBusy(true);
    const res = await fetch("/api/guest/access/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, code }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => ({}))) as { status?: string } | undefined;
    setBusy(false);
    if (body?.status === "verified") return onVerified();
    setNotice(
      body?.status === "mismatch"
        ? t.codeMismatch
        : body?.status === "locked"
          ? t.codeLocked
          : body?.status === "expired"
            ? t.codeExpired
            : t.codeTooMany,
    );
  };

  return (
    <TossResultShell tone="success" title={t.verifyTitle} body={state.linkReady && state.maskedEmail ? t.linkReadyBody(state.maskedEmail) : t.verifyBody}>
      {linkExpired ? <p className="mb-4 text-xs leading-relaxed text-amber-700">{t.linkExpiredNotice}</p> : null}
      {state.linkReady ? (
        <button type="button" className="stitch-cta-primary mb-4 w-full" disabled={busy} onClick={() => void startWithLink()}>
          {t.startOnDevice}
        </button>
      ) : null}
      {codeSent ? (
        <div className="space-y-3 text-left">
          <label className="block text-xs font-medium text-[#4A5C52]">
            {t.codeLabel}
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-1 w-full rounded-xl border border-[#D4CFC4] bg-white px-3 py-2.5 text-center text-lg tracking-[0.4em] text-[#1A3328]"
            />
          </label>
          <button type="button" className="stitch-cta-primary w-full" disabled={busy || code.length !== 6} onClick={() => void verify()}>
            {t.verifyCta}
          </button>
          <button type="button" className="w-full text-xs font-semibold text-[#3A8F6E] underline underline-offset-2" disabled={busy} onClick={() => void sendCode()}>
            {t.resendCode}
          </button>
        </div>
      ) : (
        <button type="button" className={state.linkReady ? "stitch-cta-secondary w-full" : "stitch-cta-primary w-full"} disabled={busy} onClick={() => void sendCode()}>
          {t.sendCode}
        </button>
      )}
      {notice ? <p role="status" className="mt-3 text-xs leading-relaxed text-[#4A5C52]">{notice}</p> : null}
    </TossResultShell>
  );
}

function LookupPanel() {
  const { messages } = useLocale();
  const t = messages.payments.guestUse;
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    await fetch("/api/guest/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    setBusy(false);
    setDone(true);
  };
  return (
    <TossResultShell tone="warning" title={t.lookupTitle} body={t.lookupBody}>
      {done ? (
        <p role="status" className="text-sm text-[#3A8F6E]">{t.lookupDone}</p>
      ) : (
        <div className="space-y-3">
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[#D4CFC4] bg-white px-3 py-2.5 text-sm text-[#1A3328]"
          />
          <button type="button" className="stitch-cta-primary w-full" disabled={busy || !email.includes("@")} onClick={() => void submit()}>
            {t.lookupCta}
          </button>
        </div>
      )}
    </TossResultShell>
  );
}

function UseContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { locale, messages, href } = useLocale();
  const t = messages.payments.guestUse;
  const orderIdParam = params.get("orderId") ?? "";
  const orderId = /^aha_[a-f0-9]{32}$/.test(orderIdParam) ? orderIdParam : "";
  const linkExpired = params.get("link") === "expired";
  const wantsSave = params.get("save") === "1";

  const [state, setState] = useState<State | null>(null);
  const [editing, setEditing] = useState(false);
  const [birthForm, setBirthForm] = useState<StitchBirthFormState | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const autoSaved = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/guest/personal${orderId ? `?${new URLSearchParams({ orderId })}` : ""}`, { cache: "no-store" });
      const body = (await res.json().catch(() => ({ status: "error" }))) as State;
      setState(body);
    } catch {
      setState({ status: "error" });
    }
  }, [orderId]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  // While another window is generating, check again every few seconds.
  useEffect(() => {
    if (state?.status !== "generating") return;
    const timer = setTimeout(() => void load(), 4000);
    return () => clearTimeout(timer);
  }, [state, load]);

  const save = useCallback(async () => {
    setBusy(true);
    setNotice("");
    const res = await fetch("/api/guest/personal/save", { method: "POST" }).catch(() => null);
    const body = (await res?.json().catch(() => ({}))) as { status?: string; reportId?: string | null } | undefined;
    setBusy(false);
    if (body?.status === "saved" || body?.status === "already_saved") {
      setState((prev) => ({ ...(prev ?? { status: "saved" }), status: "saved", savedReportId: body.reportId ?? null }));
      return;
    }
    setNotice(body?.status === "email_mismatch" ? t.saveMismatch : t.generateFailed);
  }, [t]);

  // Back from Clerk with ?save=1: the user already asked to save.
  useEffect(() => {
    if (!wantsSave || autoSaved.current || !isLoaded || !isSignedIn || state?.status !== "generated") return;
    autoSaved.current = true;
    const timer = setTimeout(() => void save(), 0);
    return () => clearTimeout(timer);
  }, [wantsSave, isLoaded, isSignedIn, state, save]);

  const submitInput = async (payload: StitchBirthFormState) => {
    if (!isStitchBirthFormReady(payload)) return;
    setBusy(true);
    setNotice("");
    const placeUnknown = payload.birthPlaceUnknown || !payload.birthPlace;
    const res = await fetch("/api/guest/personal/input", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        birthDate: payload.birthDate,
        birthTime: payload.birthTimeUnknown ? null : payload.birthTime,
        birthTimeUnknown: payload.birthTimeUnknown,
        birthPlace: placeUnknown ? null : payload.birthPlace,
        birthPlaceUnknown: placeUnknown,
      }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setEditing(false);
      await load();
    } else setNotice(t.generateFailed);
  };

  const generate = async () => {
    setBusy(true);
    setNotice("");
    setState((prev) => (prev ? { ...prev, status: "generating" } : prev));
    const res = await fetch("/api/guest/personal/generate", { method: "POST" }).catch(() => null);
    const body = (await res?.json().catch(() => ({}))) as { status?: string } | undefined;
    setBusy(false);
    if (body?.status === "in_progress") setNotice(t.generateInProgress);
    else if (body?.status !== "generated") setNotice(t.generateFailed);
    await load();
  };

  const goAuth = (path: string) => {
    if (state?.email) setAuthPrefillEmail(state.email);
    const back = href(`/checkout/toss/use?${new URLSearchParams({ orderId, save: "1" })}`);
    router.push(`${href(path)}?${new URLSearchParams({ redirect_url: back })}`);
  };

  if (!state) return <TossResultShell tone="progress" title={messages.payments.claimWorkingTitle} body={messages.payments.tossConfirmingBody} />;

  if (state.status === "unverified") {
    if (!orderId) return <LookupPanel />;
    return <VerifyPanel orderId={orderId} state={state} linkExpired={linkExpired} onVerified={() => void load()} />;
  }
  if (state.status === "saved") {
    return (
      <TossResultShell tone="success" title={t.savedTitle} body={t.savedBody}>
        {state.savedReportId ? (
          <button
            type="button"
            className="stitch-cta-primary w-full"
            onClick={() => router.push(localizedPath(`${ROUTES.blueprint}/${encodeURIComponent(state.savedReportId as string)}/essence/deep`, locale))}
          >
            {t.openReport}
          </button>
        ) : null}
      </TossResultShell>
    );
  }
  if (state.status === "linked") {
    return (
      <TossResultShell tone="warning" title={t.linkedTitle} body={t.linkedBody}>
        <button type="button" className="stitch-cta-primary w-full" onClick={() => router.push(`${href(ROUTES.signIn)}?${new URLSearchParams({ redirect_url: href(ROUTES.accountBilling) })}`)}>
          {messages.nav.signIn}
        </button>
      </TossResultShell>
    );
  }
  if (state.status === "expired") return <TossResultShell tone="warning" title={t.expiredTitle} body={t.expiredBody} />;
  if (state.status === "not_available" || state.status === "error") {
    return <TossResultShell tone="warning" title={t.notAvailableTitle} body={t.notAvailableBody} />;
  }

  // Input step: same shell, colors and form as the member flow (survey-v2/complete).
  if (state.status === "needs_input" || editing) {
    const ready = birthForm ? isStitchBirthFormReady(birthForm) : false;
    return (
      <StitchSurveyShell>
        <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-12">
          <StitchBirthInputForm
            initialBirthDate={state.input?.birthDate ?? null}
            initialBirthTime={state.input?.birthTime ?? null}
            initialBirthTimeUnknown={state.input?.birthTimeUnknown}
            initialBirthPlace={state.input?.birthPlace ?? null}
            initialBirthPlaceUnknown={state.input?.birthPlaceUnknown}
            busy={busy}
            onChange={setBirthForm}
          />
          <div className="mt-6 w-full max-w-[420px]">
            <button
              type="button"
              disabled={!ready || busy}
              onClick={() => birthForm && void submitInput(birthForm)}
              className="stitch-cta-primary w-full disabled:cursor-not-allowed"
            >
              {busy ? messages.survey.saving : t.inputCta}
            </button>
            {!ready ? (
              <p className="mt-2 text-center text-[11px] text-on-surface-variant">
                {messages.survey.birthFormIncompleteHint}
              </p>
            ) : null}
            {notice ? <p role="status" className="mt-3 text-center text-sm text-amber-700">{notice}</p> : null}
            <p className="mt-4 text-center text-[11px] leading-relaxed text-on-surface-variant">{t.inputBody}</p>
          </div>
        </div>
      </StitchSurveyShell>
    );
  }

  const retention = state.retentionExpiresAt
    ? new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(new Date(state.retentionExpiresAt))
    : null;

  return (
    <div className="stitch-landing min-h-[80vh] bg-[#FAF7F0]">
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-8 sm:px-6">
        {state.status === "ready" && !editing ? (
          <section className="stitch-hero-panel rounded-extra-large px-5 py-6 space-y-4 text-center">
            <h1 className="text-lg font-bold text-[#1A3328]">{t.generateTitle}</h1>
            {state.surveyRequired && !state.input?.hasSurvey ? (
              <p className="text-sm leading-relaxed text-amber-700">{t.surveyNeeded}</p>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-[#4A5C52]">{t.generateBody}</p>
                <button type="button" className="stitch-cta-primary w-full" disabled={busy} onClick={() => void generate()}>
                  {t.generateCta}
                </button>
              </>
            )}
            <button type="button" className="text-xs font-semibold text-[#3A8F6E] underline underline-offset-2" disabled={busy} onClick={() => setEditing(true)}>
              {t.editInput}
            </button>
          </section>
        ) : null}

        {state.status === "generating" || state.status === "generated" ? (
          <StitchDeepEssenceView
            data={state.report ? { ok: true, slim_v1: state.report } : null}
            loading={state.status === "generating"}
            inProgress={state.status === "generating" && !busy}
            error={null}
          />
        ) : null}

        {state.status === "generated" ? (
          <section className="rounded-2xl border border-[#3A8F6E]/30 bg-[#EAF4EF] px-5 py-5 space-y-3">
            <p className="text-sm font-semibold leading-relaxed text-[#1A3328]">{t.saveBanner}</p>
            {isSignedIn ? (
              <button type="button" className="stitch-cta-primary w-full" disabled={busy} onClick={() => void save()}>
                {t.saveNow}
              </button>
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                <button type="button" className="stitch-cta-primary w-full" onClick={() => goAuth(ROUTES.signUp)}>
                  {t.saveSignUp}
                </button>
                <button type="button" className="stitch-cta-secondary w-full" onClick={() => goAuth(ROUTES.signIn)}>
                  {t.saveSignIn}
                </button>
              </div>
            )}
            {retention ? <p className="text-xs leading-relaxed text-[#4A5C52]">{t.retentionNote(retention)}</p> : null}
          </section>
        ) : null}

        {notice ? <p role="status" className="text-center text-sm text-amber-700">{notice}</p> : null}
      </main>
    </div>
  );
}

export default function GuestUseClient() {
  return (
    <Suspense fallback={null}>
      <UseContent />
    </Suspense>
  );
}
