"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SpaceBackground from "@/components/space/SpaceBackground";
import BirthInputForm, {
  type BirthFormSubmitPayload,
} from "@/components/onboarding/BirthInputForm";
import GlowButton from "@/components/space/GlowButton";
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

function BirthOnboardingContent() {
  const router = useRouter();
  const { messages, href: localize } = useLocale();
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

      if (!hasSurveyV2Session(canonicalId)) {
        router.replace(
          localize(`/survey-v2?reportId=${encodeURIComponent(canonicalId)}`),
        );
        return;
      }

      if (!wantReset && !wantEdit) {
        const birth = await ensureBirthSession(canonicalId);
        if (hasMinimalBirth(birth)) {
          router.replace(
            localize(`/blueprint-preview?reportId=${encodeURIComponent(canonicalId)}`),
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

  const handleSubmit = useCallback(
    async (payload: BirthFormSubmitPayload) => {
      if (!reportId || busy) return;
      setBusy(true);
      writeBirthV2Session(reportId, {
        birthDate: payload.birthDate,
        birthTime: payload.birthTime,
        birthTimeUnknown: payload.birthTimeUnknown,
        birthPlace: payload.birthPlace,
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
            birthPlace: payload.birthPlace,
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
      } catch (e) {
        console.error("[onboarding/birth] save_error");
        alert(messages.survey.birthSaveNetworkError);
        setBusy(false);
        return;
      }

      router.push(
        localize(`/blueprint-preview?reportId=${encodeURIComponent(reportId)}`),
      );
    },
    [busy, messages, reportId, router, localize],
  );

  const existingBirth =
    ready && !resetBusy && !wantReset ? readBirthV2Session(reportId) : null;

  const submitLabel = wantEdit ? messages.account.birthFormSaveBirthInfo : undefined;

  if (!ready || resetBusy) {
    return (
      <SpaceBackground showProbe={false}>
        <div className="flex min-h-screen items-center justify-center px-6">
          <p className="text-sm text-[rgba(255,255,255,0.55)]">
            {resetBusy ? messages.onboarding.resetting : messages.account.loading}
          </p>
        </div>
      </SpaceBackground>
    );
  }

  return (
    <SpaceBackground showProbe={false}>
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 py-16">
        {resetNotice ? (
          <p className="max-w-md rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-center text-sm text-emerald-100/95">
            {resetNotice}
          </p>
        ) : null}
        <BirthInputForm
          key={formKey}
          busy={busy}
          initialBirthDate={existingBirth?.birthDate}
          initialBirthTime={existingBirth?.birthTime}
          initialBirthTimeUnknown={existingBirth?.birthTimeUnknown}
          initialBirthPlace={existingBirth?.birthPlace}
          submitLabel={submitLabel}
          onSubmit={handleSubmit}
        />
        {existingBirth?.birthDate ? (
          <GlowButton
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              if (!window.confirm(messages.onboarding.resetConfirm)) {
                return;
              }
              void runReset(reportId);
            }}
          >
            {messages.onboarding.resetCta}
          </GlowButton>
        ) : null}
      </main>
    </SpaceBackground>
  );
}

export default function BirthOnboardingPage() {
  const { messages } = useLocale();
  return (
    <Suspense
      fallback={
        <SpaceBackground showProbe={false}>
          <div className="flex min-h-screen items-center justify-center px-6">
            <p className="text-sm text-[rgba(255,255,255,0.55)]">
              {messages.account.loading}
            </p>
          </div>
        </SpaceBackground>
      }
    >
      <BirthOnboardingContent />
    </Suspense>
  );
}
