"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import StitchBirthInputForm, {
  isStitchBirthFormReady,
  type StitchBirthFormState,
} from "@/components/onboarding/StitchBirthInputForm";
import { getUnknownBirthFallback } from "@/lib/v2/onboarding/birthFallbackPolicy";
import { relationshipDetailRoute, relationshipHubRoute } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * Birth-data-first entry for the INVITE / CONNECT flow only. Deliberately a
 * separate page from app/onboarding/birth/page.tsx (which hard-requires a
 * completed survey and is also shared with the account birth-info editor)
 * -- this page has no survey gate at all, matching the requested flow:
 * invite/connect -> sign in -> birth date -> free 10-role relationship
 * result. Survey stays fully optional, offered later from that result
 * screen (components/relationship/map/FreeRelationshipPreviewCard.tsx).
 *
 * Reused as-is, unmodified: POST/GET /api/report/birth (the same save
 * endpoint every other birth-entry surface in the app uses).
 */
function InviteBirthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { messages, href: localize, locale } = useLocale();
  const reportId = searchParams.get("reportId")?.trim() ?? "";

  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [birthForm, setBirthForm] = useState<StitchBirthFormState | null>(null);

  useEffect(() => {
    if (!reportId) {
      router.replace(localize("/"));
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/report/birth?reportId=${encodeURIComponent(reportId)}`);
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (res.ok && data?.birth_date) {
          setBirthForm({
            birthDate: data.birth_date,
            birthTime: data.birth_time ?? null,
            birthTimeUnknown: !data.birth_time,
            birthPlace: data.birth_place ?? null,
            birthPlaceUnknown: false,
          });
        }
      } catch {
        // No existing birth data yet -- normal for a brand-new invite/connect signup.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId, router, localize]);

  const canSubmit = birthForm ? isStitchBirthFormReady(birthForm) : false;

  const handleSubmit = useCallback(async () => {
    if (!reportId || !birthForm || !canSubmit || busy) return;
    setBusy(true);

    const unknownFallback = getUnknownBirthFallback(locale);
    const birthPlace = birthForm.birthPlaceUnknown
      ? unknownFallback.place
      : birthForm.birthPlace;

    try {
      const res = await fetch("/api/report/birth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          birthDate: birthForm.birthDate,
          birthTime: birthForm.birthTimeUnknown ? null : birthForm.birthTime,
          birthTimeUnknown: birthForm.birthTimeUnknown,
          birthPlace,
          birthPlaceUnknown: birthForm.birthPlaceUnknown,
          birthLatitude: birthForm.birthPlaceUnknown ? unknownFallback.latitude : undefined,
          birthLongitude: birthForm.birthPlaceUnknown ? unknownFallback.longitude : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        alert(data.error ?? messages.survey.birthSaveFailed);
        setBusy(false);
        return;
      }
    } catch {
      alert(messages.survey.birthSaveNetworkError);
      setBusy(false);
      return;
    }

    const pendingRelationshipReportId =
      localStorage.getItem("pendingRelationshipReportId")?.trim() ?? "";
    if (pendingRelationshipReportId) {
      localStorage.removeItem("pendingRelationshipReportId");
      router.push(
        localize(
          relationshipDetailRoute({
            relationshipReportId: pendingRelationshipReportId,
            viewerReportId: reportId,
          }),
        ),
      );
      return;
    }
    router.push(localize(relationshipHubRoute(reportId)));
  }, [birthForm, busy, canSubmit, locale, localize, messages, reportId, router]);

  if (!ready) {
    return (
      <StitchSurveyShell>
        <div className="flex items-center justify-center px-6 py-24">
          <p className="text-sm text-on-surface-variant">{messages.report.chrome.loading}</p>
        </div>
      </StitchSurveyShell>
    );
  }

  return (
    <StitchSurveyShell>
      <main className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-5 py-16 sm:px-6">
        <header className="space-y-2 text-center">
          <h1 className="stitch-headline text-2xl text-primary sm:text-3xl">
            {locale === "ko-KR" ? "생년월일을 알려주세요" : "When were you born?"}
          </h1>
          <p className="text-sm text-on-surface-variant">
            {locale === "ko-KR"
              ? "설문 없이도 바로 무료로 볼 수 있어요."
              : "No survey needed -- these are free the moment you sign up."}
          </p>
        </header>

        {/*
          Sets expectations BEFORE the user commits to entering their birth
          date -- explicitly names what's free so signing up doesn't feel
          like a black box. Two items, matching exactly what the result
          screen actually delivers (10-role relationship map +
          composeFreeRelationshipPreview's 6-item preview, and the existing
          free personal blueprint/analysis) -- no promise this flow doesn't
          keep.
        */}
        <ul className="w-full space-y-2.5 rounded-2xl border border-secondary/25 bg-secondary/8 px-4 py-4">
          <li className="flex items-start gap-2.5 text-sm text-on-surface">
            <span aria-hidden>🔮</span>
            <span>
              {locale === "ko-KR"
                ? "친구와 나의 관계 — 10가지 관계 유형 중 무엇인지 바로 확인"
                : "Your relationship with this friend -- see which of the 10 roles it is, instantly"}
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-sm text-on-surface">
            <span aria-hidden>✨</span>
            <span>
              {locale === "ko-KR"
                ? "나에 대한 무료 개인분석도 함께 볼 수 있어요"
                : "A free personal analysis of you, too"}
            </span>
          </li>
        </ul>

        <StitchBirthInputForm
          initialBirthDate={birthForm?.birthDate}
          initialBirthTime={birthForm?.birthTime}
          initialBirthTimeUnknown={birthForm?.birthTimeUnknown}
          initialBirthPlace={birthForm?.birthPlace}
          initialBirthPlaceUnknown={birthForm?.birthPlaceUnknown}
          busy={busy}
          onChange={setBirthForm}
        />

        <div className="w-full max-w-[420px]">
          <button
            type="button"
            disabled={!canSubmit || busy}
            onClick={() => void handleSubmit()}
            className="stitch-cta-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? messages.survey.saving : messages.survey.viewResults}
          </button>
        </div>
      </main>
    </StitchSurveyShell>
  );
}

function InviteBirthFallback() {
  const { messages } = useLocale();
  return (
    <StitchSurveyShell>
      <div className="flex items-center justify-center px-6 py-24">
        <p className="text-sm text-on-surface-variant">{messages.report.chrome.loading}</p>
      </div>
    </StitchSurveyShell>
  );
}

export default function InviteBirthPage() {
  return (
    <Suspense fallback={<InviteBirthFallback />}>
      <InviteBirthContent />
    </Suspense>
  );
}
