"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import StitchBirthInputForm, {
  isStitchBirthFormReady,
  type StitchBirthFormState,
} from "@/components/onboarding/StitchBirthInputForm";
import { getUnknownBirthFallback } from "@/lib/v2/onboarding/birthFallbackPolicy";
import {
  clearBirthV2Session,
  readBirthV2Session,
  writeBirthV2Session,
} from "@/lib/v2/onboarding/birthSession";
import { resolveCanonicalReportIdClient } from "@/lib/home/resolveCanonicalReportIdClient";
import { resetReportBirthOnServer } from "@/lib/v2/onboarding/fetchReportBirthClient";
import {
  ensureBirthSession,
  hasMinimalBirth,
} from "@/lib/v2/onboarding/hydrateBirthSession";
import {
  hasSurveyV2Session,
} from "@/lib/v2/survey/session";
import { clearLiteReports } from "@/lib/v2/lite/session";
import { clearSlimIntegratedCache } from "@/lib/v1/slim/slimIntegratedCache";
import { invalidateReportSession } from "@/lib/home/reportSession";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { consumeSelfProfileReturn } from "@/lib/relationship/selfProfileReturn";
import { isPsychSurveyRequired } from "@/lib/i18n/localePolicy";

function BirthOnboardingContent() {
  const router = useRouter();
  const { messages, href: localize, locale } = useLocale();
  const searchParams = useSearchParams();
  const reportIdParam = searchParams.get("reportId")?.trim() ?? "";
  const wantReset = searchParams.get("reset") === "1";
  const wantEdit = searchParams.get("edit") === "1";
  const [ready, setReady] = useState(false);
  const [reportId, setReportId] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(wantReset);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [birthForm, setBirthForm] = useState<StitchBirthFormState | null>(null);
  const resetStarted = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const id = reportIdParam || localStorage.getItem("reportId")?.trim() || "";
      if (!id && !reportIdParam) {
        router.replace(localize("/"));
        return;
      }

      const resolved = await resolveCanonicalReportIdClient(
        reportIdParam || id,
        "birth-onboarding",
      );
      const canonicalId = resolved.canonicalReportId;
      if (!canonicalId) {
        router.replace(localize("/"));
        return;
      }

      // US/KR onboarding split (lib/i18n/localePolicy.ts): en-US keeps the
      // original mandatory survey-first gate; ko-KR lets Saju birth data
      // stand alone -- the survey stays available, just not blocking.
      if (isPsychSurveyRequired(locale) && !hasSurveyV2Session(canonicalId)) {
        router.replace(
          localize(`/survey-v2?reportId=${encodeURIComponent(canonicalId)}`),
        );
        return;
      }

      if (!wantReset && !wantEdit) {
        const birth = await ensureBirthSession(canonicalId);
        if (hasMinimalBirth(birth)) {
          // Came here to add a friend: details are already in -> straight back.
          const back = consumeSelfProfileReturn(canonicalId);
          router.replace(
            localize(back ?? `/blueprint-preview?reportId=${encodeURIComponent(canonicalId)}`),
          );
          return;
        }
      }

      if (!cancelled) {
        setReportId(canonicalId);
        setReady(true);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [reportIdParam, router, wantReset, wantEdit, localize]);

  const runReset = useCallback(async (id: string) => {
    setResetBusy(true);
    clearBirthV2Session(id);
    const result = await resetReportBirthOnServer(id);
    setFormKey((k) => k + 1);
    setResetNotice(
      result.ok
        ? messages.onboarding.resetSuccess
        : (result.error ?? messages.onboarding.resetFailed),
    );
    setResetBusy(false);
    return result.ok;
  }, [messages]);

  useEffect(() => {
    if (!ready || !reportId || !wantReset || resetStarted.current) return;
    resetStarted.current = true;
    void (async () => {
      await runReset(reportId);
      router.replace(
        localize(`/onboarding/birth?reportId=${encodeURIComponent(reportId)}`),
      );
    })();
  }, [ready, reportId, wantReset, runReset, router, localize]);

  // Same light Stitch form + save payload as the other birth-input screens
  // (survey-v2/complete, guest use): unknown place -> locale fallback.
  const handleSubmit = useCallback(
    async (payload: StitchBirthFormState) => {
      if (!reportId || busy) return;
      setBusy(true);
      const unknownFallback = getUnknownBirthFallback(locale);
      const birthPlace = payload.birthPlaceUnknown ? unknownFallback.place : payload.birthPlace;
      writeBirthV2Session(reportId, {
        birthDate: payload.birthDate,
        birthTime: payload.birthTime,
        birthTimeUnknown: payload.birthTimeUnknown,
        birthPlace,
        birthPlaceUnknown: payload.birthPlaceUnknown,
      });

      try {
        const res = await fetch("/api/report/birth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportId,
            birthDate: payload.birthDate,
            birthTime: payload.birthTimeUnknown ? null : payload.birthTime,
            birthTimeUnknown: payload.birthTimeUnknown,
            birthPlace,
            birthPlaceUnknown: payload.birthPlaceUnknown,
            birthLatitude: payload.birthPlaceUnknown ? unknownFallback.latitude : undefined,
            birthLongitude: payload.birthPlaceUnknown ? unknownFallback.longitude : undefined,
          }),
        });
        const data = (await res.json()) as {
          error?: string;
          own_birth_date_collision_warning?: boolean;
        };
        if (!res.ok) {
          console.error("[onboarding/birth] save_failed");
          alert(data.error ?? messages.survey.birthSaveFailed);
          setBusy(false);
          return;
        }
        if (data.own_birth_date_collision_warning) {
          alert(messages.hub.ownBirthDateCollisionWarning);
        }
        clearLiteReports(reportId);
        clearSlimIntegratedCache(reportId);
        invalidateReportSession(reportId);
      } catch {
        console.error("[onboarding/birth] save_error");
        alert(messages.survey.birthSaveNetworkError);
        setBusy(false);
        return;
      }

      // Started from "add a friend": return there (the free result page
      // stays available from the hub / home later).
      const back = consumeSelfProfileReturn(reportId);
      router.push(
        localize(back ?? `/blueprint-preview?reportId=${encodeURIComponent(reportId)}`),
      );
    },
    [busy, messages, reportId, router, localize, locale],
  );

  const existingBirth =
    ready && !resetBusy && !wantReset ? readBirthV2Session(reportId) : null;

  const submitLabel = wantEdit ? messages.account.birthFormSaveBirthInfo : messages.survey.next;

  if (!ready || resetBusy) {
    return (
      <StitchSurveyShell>
        <div className="flex min-h-[60dvh] items-center justify-center px-6">
          <p className="text-sm text-on-surface-variant">
            {resetBusy ? messages.onboarding.resetting : messages.account.loading}
          </p>
        </div>
      </StitchSurveyShell>
    );
  }

  const formReady = birthForm ? isStitchBirthFormReady(birthForm) : false;

  return (
    <StitchSurveyShell>
      <main className="relative z-10 mx-auto flex max-w-lg flex-col items-center px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-12">
        {resetNotice ? (
          <p role="status" className="mb-4 w-full max-w-[420px] rounded-xl border border-accent-emerald/25 bg-accent-emerald-soft px-4 py-3 text-center text-sm text-primary">
            {resetNotice}
          </p>
        ) : null}
        <StitchBirthInputForm
          key={formKey}
          busy={busy}
          initialBirthDate={existingBirth?.birthDate}
          initialBirthTime={existingBirth?.birthTime}
          initialBirthTimeUnknown={existingBirth?.birthTimeUnknown}
          initialBirthPlace={existingBirth?.birthPlace}
          initialBirthPlaceUnknown={existingBirth?.birthPlaceUnknown}
          onChange={setBirthForm}
        />
        <div className="mt-6 w-full max-w-[420px]">
          <button
            type="button"
            disabled={!formReady || busy}
            onClick={() => {
              if (birthForm) void handleSubmit(birthForm);
            }}
            className="stitch-cta-primary w-full disabled:cursor-not-allowed"
          >
            {busy ? messages.survey.saving : submitLabel}
          </button>
          {!formReady ? (
            <p className="mt-2 text-center text-[11px] text-on-surface-variant">
              {messages.survey.birthFormIncompleteHint}
            </p>
          ) : null}
          {existingBirth?.birthDate ? (
            <button
              type="button"
              disabled={busy}
              className="mt-4 w-full text-center text-xs text-on-surface-variant underline underline-offset-4 hover:text-primary"
              onClick={() => {
                if (!window.confirm(messages.onboarding.resetConfirm)) {
                  return;
                }
                void runReset(reportId);
              }}
            >
              {messages.onboarding.resetCta}
            </button>
          ) : null}
        </div>
      </main>
    </StitchSurveyShell>
  );
}

export default function BirthOnboardingPage() {
  const { messages } = useLocale();
  return (
    <Suspense
      fallback={
        <StitchSurveyShell>
          <div className="flex min-h-[60dvh] items-center justify-center px-6">
            <p className="text-sm text-on-surface-variant">{messages.account.loading}</p>
          </div>
        </StitchSurveyShell>
      }
    >
      <BirthOnboardingContent />
    </Suspense>
  );
}
