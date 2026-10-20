"use client";

import { blueprintMissingStepPath } from "@/lib/v2/blueprint/blueprintMissingStep";
import OtherSiteCreditNote from "@/components/account/OtherSiteCreditNote";
import { isPsychSurveyRequired } from "@/lib/i18n/localePolicy";
import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import StitchDeepEssenceView from "@/components/results/StitchDeepEssenceView";
import PurchaseSelectorModal from "@/components/payment/PurchaseSelectorModal";
import { useBlueprintBundle } from "@/lib/v2/blueprint/useBlueprintBundle";
import { useSlimV1Integrated } from "@/lib/v1/slim/useSlimV1Integrated";
import {
  ensureBirthSession,
  hasMinimalBirth,
} from "@/lib/v2/onboarding/hydrateBirthSession";
import { readSurveyV2Session } from "@/lib/v2/survey/session";
import { hydrateSurveySession } from "@/lib/v2/survey/surveyClient";
import { resultsDashboardPath } from "@/lib/v2/results/canShowResultsDashboard";
import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { PwaReportActionCard } from "@/components/account/InstallAppButton";
import MadeWithInfoNote from "@/components/common/MadeWithInfoNote";

function EssenceDeepContent() {
  const router = useRouter();
  const { messages, href: localize, locale } = useLocale();
  const params = useParams();
  const reportId = decodeURIComponent(String(params.reportId ?? ""));
  const [ready, setReady] = useState(false);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (!reportId) {
      router.replace(localize(ROUTES.home));
      return;
    }
    setReady(true);
  }, [reportId, router, localize]);

  useEffect(() => {
    if (!ready || !reportId) return;

    void (async () => {
      if (!readSurveyV2Session(reportId)) {
        await hydrateSurveySession(reportId);
      }
      await ensureBirthSession(reportId);
      setBooting(false);
    })();
  }, [ready, reportId]);

  const { bundle, loading: bundleLoading } = useBlueprintBundle(
    reportId,
    ready && !booting,
  );
  const canGenerate =
    ready && !booting && Boolean(bundle?.birth && hasMinimalBirth(bundle.birth));

  const {
    status,
    data,
    otherLocales,
    generatedWith,
    loading,
    inProgress,
    error,
    creditExhausted,
    refresh,
    generate,
    regenerate,
  } = useSlimV1Integrated(reportId, canGenerate, bundle?.birth ?? null);
  const g = messages.blueprint.deepGenerate;
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  // Purchase Selector opens only from the explicit "buy" button after a 402
  // on an explicit generate. After a purchase the page re-reads its state;
  // generating still needs the user's own click (nothing auto-generates).
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const deepHref = localize(
    `/blueprint-preview/${encodeURIComponent(reportId)}/essence/deep`,
  );
  function handlePurchaseSuccess() {
    setPurchaseOpen(false);
    void refresh();
  }
  const busy = loading || inProgress;
  const noSurvey = Boolean(data) && !data?.slim_v1.radar_current;

  useEffect(() => {
    if (!ready || booting || bundleLoading) return;
    if (bundle) return;

    void (async () => {
      // ko-KR: the survey is optional -- a paid Personal deep report works
      // from birth data alone (the generator takes surveyAnswers: null).
      const next = await blueprintMissingStepPath(reportId, isPsychSurveyRequired(locale));
      if (next) router.replace(localize(next));
    })();
  }, [ready, booting, reportId, bundle, bundleLoading, router, localize, locale]);

  if (!ready || booting || bundleLoading) {
    return (
      <StitchSurveyShell className="stitch-survey stitch-results">
        <div className="flex min-h-[50vh] items-center justify-center px-6">
          <p className="text-sm text-on-surface-variant">
            {messages.report.chrome.loading}
          </p>
        </div>
      </StitchSurveyShell>
    );
  }

  if (!bundle) {
    return (
      <StitchSurveyShell className="stitch-survey stitch-results">
        <div className="flex min-h-[50vh] items-center justify-center px-6">
          <p className="text-sm text-on-surface-variant">
            {messages.blueprint.checkingSurveyBirth}
          </p>
        </div>
      </StitchSurveyShell>
    );
  }

  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-rose/30 bg-accent-rose-soft/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
            Premium
          </span>
          <h1 className="stitch-headline mt-4 text-balance text-2xl leading-snug sm:text-3xl">
            {messages.blueprint.deepAnalysisTitle}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
            {messages.blueprint.deepAnalysisSubtitle}
          </p>
        </div>

        {status === "loading" || status === "idle" ? (
          <div className="stitch-hero-panel rounded-extra-large px-6 py-10 text-center">
            <p className="text-sm text-on-surface-variant">{g.viewLoading}</p>
          </div>
        ) : null}

        {status === "legacy_unknown" ? (
          <div className="rounded-2xl border border-accent-rose/25 bg-accent-rose-soft/40 px-4 py-3 text-sm">
            <p className="font-medium text-primary">{g.legacyTitle}</p>
            <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{g.legacyBody}</p>
            <button
              type="button"
              className="stitch-cta-secondary mt-3 w-full disabled:opacity-60"
              onClick={() => void generate()}
              disabled={busy}
            >
              {busy ? messages.blueprint.regenerating : g.legacyGenerateCta}
            </button>
          </div>
        ) : null}

        {status === "not_generated" && !busy ? (
          <div className="stitch-hero-panel rounded-extra-large px-6 py-8 text-center space-y-3">
            <p className="text-base font-bold text-primary">{g.notGeneratedTitle}</p>
            <p className="text-sm text-on-surface-variant leading-relaxed">{g.notGeneratedBody}</p>
            {otherLocales.length > 0 ? (
              <p className="text-xs text-on-surface-variant/80 leading-relaxed">{g.otherLocaleNote}</p>
            ) : null}
            <button
              type="button"
              className="stitch-cta-primary w-full disabled:opacity-60"
              onClick={() => void generate()}
              disabled={busy || creditExhausted}
            >
              {g.generateCta}
            </button>
          </div>
        ) : null}

        {data && (status === "ready" || status === "legacy_unknown") ? (
          <MadeWithInfoNote
            generatedAt={generatedWith.generatedAt}
            inputsChanged={generatedWith.inputsChanged}
          />
        ) : null}

        {noSurvey ? (
          <p className="rounded-2xl border border-outline-variant/40 bg-surface/60 px-4 py-3 text-xs leading-relaxed text-on-surface-variant">
            {g.noSurveyNote}
          </p>
        ) : null}

        {status !== "loading" && status !== "idle" && (busy || data || error) ? (
          <StitchDeepEssenceView
            reportId={reportId}
            data={data}
            loading={loading}
            inProgress={inProgress}
            error={error}
            onRetry={() => void refresh()}
            onRegenerateFresh={status === "ready" ? () => setConfirmRegenerate(true) : undefined}
          />
        ) : null}

        {creditExhausted ? (
          <div className="stitch-hero-panel rounded-extra-large px-6 py-8 text-center space-y-3">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {messages.errors.insufficientCredit}
            </p>
            <OtherSiteCreditNote creditType="personal" />
            <button
              type="button"
              className="stitch-cta-primary w-full"
              onClick={() => setPurchaseOpen(true)}
            >
              {messages.blueprint.creditNeededCta}
            </button>
          </div>
        ) : null}

        {confirmRegenerate ? (
          <div className="stitch-hero-panel rounded-extra-large px-6 py-6 text-center space-y-3" role="dialog" aria-modal="false">
            <p className="text-base font-bold text-primary">{g.regenerateConfirmTitle}</p>
            <p className="text-sm text-on-surface-variant leading-relaxed">{g.regenerateConfirmBody}</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="stitch-cta-primary w-full disabled:opacity-60"
                disabled={busy}
                onClick={() => {
                  setConfirmRegenerate(false);
                  void regenerate();
                }}
              >
                {g.regenerateConfirmCta}
              </button>
              <button type="button" className="stitch-cta-secondary w-full" onClick={() => setConfirmRegenerate(false)}>
                {g.cancel}
              </button>
            </div>
          </div>
        ) : null}

        <PurchaseSelectorModal
          open={purchaseOpen}
          context="personal"
          onClose={() => setPurchaseOpen(false)}
          onSuccess={handlePurchaseSuccess}
          successRedirectPath={deepHref}
        />

        <PwaReportActionCard />

        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="stitch-cta-primary w-full disabled:opacity-60"
            onClick={() => router.push(localize(resultsDashboardPath(reportId)))}
          >
            {messages.blueprint.backToDashboard}
          </button>
          {status === "ready" ? (
            <button
              type="button"
              className="stitch-cta-secondary w-full disabled:opacity-60"
              onClick={() => setConfirmRegenerate(true)}
              disabled={busy || confirmRegenerate}
            >
              {busy ? messages.blueprint.regenerating : messages.blueprint.regenerate}
            </button>
          ) : null}
          {error ? (
            <button
              type="button"
              className="text-sm text-on-surface-variant underline-offset-2 hover:text-primary hover:underline"
              onClick={() => router.push(localize(`${ROUTES.accountProfile}#birth`))}
            >
              {messages.blueprint.editBirthInfo}
            </button>
          ) : null}
        </div>
      </main>
    </StitchSurveyShell>
  );
}

function EssenceDeepFallback() {
  const { messages } = useLocale();
  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <p className="text-sm text-on-surface-variant">
          {messages.report.chrome.loading}
        </p>
      </div>
    </StitchSurveyShell>
  );
}

export default function EssenceDeepPage() {
  return (
    <Suspense fallback={<EssenceDeepFallback />}>
      <EssenceDeepContent />
    </Suspense>
  );
}
