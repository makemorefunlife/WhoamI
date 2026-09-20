"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useClerkReady } from "@/lib/clerk/useClerkReady";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import StitchBirthInputForm, {
  isStitchBirthFormReady,
  type StitchBirthFormState,
} from "@/components/onboarding/StitchBirthInputForm";
import SignUpConsentFields from "@/components/legal/SignUpConsentFields";
import SignUpUsNotice from "@/components/legal/SignUpUsNotice";
import { getUnknownBirthFallback } from "@/lib/v2/onboarding/birthFallbackPolicy";
import { ROUTES, blueprintRoute, relationshipHubRoute } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import ConnectionSuccessModal from "@/components/relationship/ConnectionSuccessModal";
import {
  readPendingBirthDraft,
  writePendingBirthDraft,
  clearPendingBirthDraft,
} from "@/lib/home/pendingBirthDraft";
import { completeInviteOrConnectSignup } from "@/lib/home/completeInviteOrConnectSignup";

const HomeAuthSignInPanel = dynamic(
  () => import("@/components/home/HomeAuthSignInPanel"),
  { ssr: false, loading: () => null },
);
const HomeAuthSignUpPanel = dynamic(
  () => import("@/components/home/HomeAuthSignUpPanel"),
  { ssr: false, loading: () => null },
);

/**
 * Birth-data-first entry for the INVITE / CONNECT flow only. Deliberately a
 * separate page from app/onboarding/birth/page.tsx (which hard-requires a
 * completed survey and is also shared with the account birth-info editor).
 *
 * Two modes, distinguished by the `reportId` query param:
 *
 * - "draft" mode (no reportId): an invite/connect link lands an
 *   unauthenticated visitor here directly (see app/homecontent.tsx's
 *   invite/connect auto-run effects). Three states (`entryMode` below),
 *   matching the agreed flow:
 *     초대 링크 -> 기존회원: 로그인 / 신규회원: 생년월일시·장소 입력 ->
 *     [우리 관계 확인하기] -> 이메일 + 필수동의 -> 관계 발견 결과
 *     - "form" (default): birth date/time/place only -- "우리 관계
 *       확인하기" stashes the draft (lib/home/pendingBirthDraft.ts) and
 *       moves to...
 *     - "signup": "결과를 저장하려면 가입이 필요해요" -- (ko-KR) the same
 *       required legal-consent checkboxes app/sign-up uses, then Clerk's
 *       <SignUp> inline. The moment isSignedIn flips true, the stashed
 *       draft creates the report, completes the invite/connect, and
 *       saves the birth data -- nothing left to redo.
 *     - "login": Clerk's <SignIn> shown inline, no birth form involved at
 *       all -- for someone who already has an account (the "이미
 *       회원이신가요?" row at the top switches here). Their birth data
 *       already lives on their existing report, so once signed in this
 *       just hands off to "/" and lets app/homecontent.tsx's normal
 *       (unmodified) signed-in invite/connect handling finish the
 *       connection against that existing report -- no new report is
 *       created for this path.
 * - "existing" mode (reportId present): the original post-auth entry,
 *   still used when a report already exists for this person (e.g. they
 *   resumed an in-progress invite/connect from app/homecontent.tsx while
 *   already signed in). POST/GET /api/report/birth, same as every other
 *   birth-entry surface in the app. Also recovers an interrupted draft
 *   left in localStorage (Clerk bounced back through the normal
 *   signed-in path instead of straight back to draft mode) so that path
 *   never forces a re-type either.
 */
function InviteBirthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { messages, href: localize, locale } = useLocale();
  const { isLoaded, isSignedIn } = useClerkReady();
  const reportId = searchParams.get("reportId")?.trim() ?? "";

  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [birthForm, setBirthForm] = useState<StitchBirthFormState | null>(null);
  const draftCompleteRanRef = useRef(false);
  const [readyModal, setReadyModal] = useState<{
    sharerName: string;
    alreadyConnected: boolean;
    onConfirm: () => void;
    onSecondary: () => void;
  } | null>(null);

  // -- draft-mode-only state --
  const [entryMode, setEntryMode] = useState<"form" | "signup" | "login">("form");
  const [ageChecked, setAgeChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [marketingChecked, setMarketingChecked] = useState(false);

  const hasPendingToken = useCallback(() => {
    if (typeof window === "undefined") return false;
    return Boolean(
      localStorage.getItem("inviteToken")?.trim() ||
        localStorage.getItem("connectToken")?.trim(),
    );
  }, []);

  // "existing" mode boot: fetch any already-saved birth data for this
  // report. Falls back to a leftover draft-mode entry (see module doc)
  // rather than an empty form, since reaching this branch with no saved
  // birth data but a stashed draft means the draft-mode auto-complete
  // below never got the chance to run (Clerk redirected somewhere else).
  useEffect(() => {
    if (!reportId) return;
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
        } else {
          const leftover = readPendingBirthDraft();
          if (leftover) setBirthForm(leftover);
        }
      } catch {
        const leftover = readPendingBirthDraft();
        if (leftover) setBirthForm(leftover);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  // "draft" mode boot: no reportId yet. This page only makes sense here
  // as part of an invite/connect completion, so bail to home if there's
  // no token to complete against (e.g. a stray direct visit). Otherwise
  // prefill from any draft already stashed (a reload, or coming back from
  // an abandoned sign-up attempt).
  useEffect(() => {
    if (reportId) return;
    if (!hasPendingToken()) {
      router.replace(localize("/"));
      return;
    }
    const leftover = readPendingBirthDraft();
    if (leftover) setBirthForm(leftover);
  }, [reportId, hasPendingToken, router, localize]);

  // "draft" mode, "signup" path: once Clerk reports signed in, run the
  // whole create-report + complete-invite/connect + save-birth sequence
  // using the stashed draft -- nothing left for the person to redo. Keyed
  // off the stashed draft itself (not `entryMode`, which resets to "form"
  // on a fresh page load) so it still fires correctly if Clerk's OAuth
  // step did a full-page round trip back to this same URL.
  useEffect(() => {
    if (reportId) return;
    if (!isLoaded || !isSignedIn || draftCompleteRanRef.current) return;
    const draft = readPendingBirthDraft() ?? birthForm;
    if (!draft || !isStitchBirthFormReady(draft)) return;

    draftCompleteRanRef.current = true;
    setBusy(true);

    const inviteToken = localStorage.getItem("inviteToken")?.trim() ?? "";
    const connectToken = localStorage.getItem("connectToken")?.trim() ?? "";

    void (async () => {
      const result = await completeInviteOrConnectSignup({
        draft,
        inviteToken,
        connectToken,
        locale,
        genericErrorMessage: messages.errors.generic,
        networkErrorMessage: messages.errors.network,
      });

      if (!result.ok || !result.reportId) {
        setBusy(false);
        alert(result.errorMessage ?? messages.errors.generic);
        // Draft stays in localStorage on failure -- the "existing" mode
        // boot effect above recovers it if the person retries via the
        // normal signed-in invite/connect path from home.
        router.replace(localize("/"));
        return;
      }

      clearPendingBirthDraft();
      const finishedReportId = result.reportId;
      const goToRelationship = () => {
        router.push(
          localize(relationshipHubRoute(finishedReportId, result.relationshipReportId || undefined)),
        );
      };

      setBusy(false);

      if (result.sharerName) {
        setReadyModal({
          sharerName: result.sharerName,
          alreadyConnected: result.alreadyConnected,
          onConfirm: goToRelationship,
          onSecondary: () => router.push(localize(blueprintRoute(finishedReportId))),
        });
        return;
      }
      goToRelationship();
    })();
  }, [reportId, isLoaded, isSignedIn, birthForm, locale, messages, router, localize]);

  // "draft" mode, "login" path: an already-registered person signed in
  // from here -- their birth data lives on their existing report already,
  // so there's no draft to complete. Hand off to "/" and let
  // app/homecontent.tsx's normal signed-in invite/connect branches (never
  // touched by this feature) finish the connection against that report.
  useEffect(() => {
    if (reportId) return;
    if (!isLoaded || !isSignedIn) return;
    if (entryMode !== "login") return;
    if (readPendingBirthDraft()) return; // a stray draft exists -- let the effect above own it instead
    router.replace(localize("/"));
  }, [reportId, isLoaded, isSignedIn, entryMode, router, localize]);

  const birthReady = birthForm ? isStitchBirthFormReady(birthForm) : false;
  const consentReady = locale === "ko-KR" ? ageChecked && termsChecked && privacyChecked : true;

  // "existing" mode submit -- unchanged from before: save directly via
  // /api/report/birth (the person is already signed in with a report).
  const handleSubmit = useCallback(async () => {
    if (!reportId || !birthForm || !birthReady || busy) return;
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

    clearPendingBirthDraft();

    const pendingRelationshipReportId =
      localStorage.getItem("pendingRelationshipReportId")?.trim() ?? "";
    const pendingConnectionSharerName =
      localStorage.getItem("pendingConnectionSharerName")?.trim() ?? "";
    const pendingConnectionAlreadyConnected =
      localStorage.getItem("pendingConnectionAlreadyConnected")?.trim() === "1";

    const goToRelationship = () => {
      router.push(
        localize(relationshipHubRoute(reportId, pendingRelationshipReportId || undefined)),
      );
    };

    setBusy(false);

    if (pendingConnectionSharerName) {
      localStorage.removeItem("pendingRelationshipReportId");
      localStorage.removeItem("pendingConnectionSharerName");
      localStorage.removeItem("pendingConnectionAlreadyConnected");
      setReadyModal({
        sharerName: pendingConnectionSharerName,
        alreadyConnected: pendingConnectionAlreadyConnected,
        onConfirm: goToRelationship,
        onSecondary: () => router.push(localize(blueprintRoute(reportId))),
      });
      return;
    }

    if (pendingRelationshipReportId) {
      localStorage.removeItem("pendingRelationshipReportId");
    }
    goToRelationship();
  }, [birthForm, birthReady, busy, locale, localize, messages, reportId, router]);

  // "draft" mode, "form" submit ("우리 관계 확인하기") -- no API call yet:
  // stash the birth data, then move to the "signup" step (email +
  // consent live there, not here -- see module doc).
  const handleDraftFormSubmit = useCallback(() => {
    if (!birthForm || !birthReady || busy) return;
    writePendingBirthDraft(birthForm);
    setEntryMode("signup");
  }, [birthForm, birthReady, busy]);

  const draftMode = !reportId;

  // Existing mode: loading only while fetching any already-saved birth
  // data. Draft mode: loading while Clerk itself is still resolving, and
  // again once sign-in completes and the auto-complete effect takes over
  // (busy) -- busy is cleared right before readyModal is set or the page
  // navigates away.
  const showLoadingShell = draftMode ? !isLoaded || busy : !ready;

  if (showLoadingShell) {
    return (
      <StitchSurveyShell>
        <div className="flex items-center justify-center px-6 py-24">
          <p className="text-sm text-on-surface-variant">{messages.report.chrome.loading}</p>
        </div>
      </StitchSurveyShell>
    );
  }

  const readyModalNode = (
    <ConnectionSuccessModal
      open={readyModal != null}
      title={
        readyModal?.alreadyConnected
          ? messages.connect.alreadyConnectedTitle(readyModal?.sharerName ?? "")
          : messages.connect.discoveryReadyTitle(readyModal?.sharerName ?? "")
      }
      body={
        readyModal?.alreadyConnected
          ? messages.connect.alreadyConnectedBody
          : messages.connect.discoveryReadyBody
      }
      primaryLabel={messages.connect.discoverRelationshipCta}
      onPrimary={() => {
        if (!readyModal) return;
        const { onConfirm } = readyModal;
        setReadyModal(null);
        onConfirm();
      }}
      secondaryLabel={messages.connect.connectedJoinerPersonalAnalysisCta}
      onSecondary={() => {
        if (!readyModal) return;
        const { onSecondary } = readyModal;
        setReadyModal(null);
        onSecondary();
      }}
    />
  );

  if (draftMode && entryMode === "login") {
    return (
      <StitchSurveyShell>
        <main className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 px-5 py-16 sm:px-6">
          <header className="space-y-2 text-center">
            <h1 className="stitch-headline text-2xl text-primary sm:text-3xl">
              {locale === "ko-KR" ? "로그인" : "Sign in"}
            </h1>
            <p className="text-sm text-on-surface-variant">
              {locale === "ko-KR"
                ? "기존 계정으로 로그인하면 저장된 정보로 바로 이어집니다."
                : "Sign in with your existing account to continue with what's already saved."}
            </p>
          </header>
          <div className="w-full max-w-[400px] rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <HomeAuthSignInPanel />
          </div>
          <button
            type="button"
            onClick={() => setEntryMode("form")}
            className="text-sm text-on-surface-variant underline underline-offset-2"
          >
            {locale === "ko-KR" ? "← 처음이에요, 정보 입력할게요" : "← Never mind, I'll enter my info"}
          </button>
        </main>
        {readyModalNode}
      </StitchSurveyShell>
    );
  }

  if (draftMode && entryMode === "signup") {
    return (
      <StitchSurveyShell>
        <main className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 px-5 py-16 sm:px-6">
          <header className="space-y-2 text-center">
            <h1 className="stitch-headline text-2xl text-primary sm:text-3xl">
              {locale === "ko-KR" ? "결과를 저장하려면 가입이 필요해요" : "Sign up to save your results"}
            </h1>
            <p className="text-sm text-on-surface-variant">
              {locale === "ko-KR"
                ? "이메일과 약관 동의만 하면 바로 이어집니다."
                : "Just your email and consent, and you're in."}
            </p>
          </header>

          {locale === "ko-KR" ? (
            <SignUpConsentFields
              ageChecked={ageChecked}
              termsChecked={termsChecked}
              privacyChecked={privacyChecked}
              marketingChecked={marketingChecked}
              onAgeChange={setAgeChecked}
              onTermsChange={setTermsChecked}
              onPrivacyChange={setPrivacyChecked}
              onMarketingChange={setMarketingChecked}
            />
          ) : null}

          {consentReady ? (
            <div className="w-full max-w-[400px] rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
              <HomeAuthSignUpPanel fallbackRedirectPath={ROUTES.inviteBirth} />
              {locale !== "ko-KR" ? (
                <SignUpUsNotice
                  marketingChecked={marketingChecked}
                  onMarketingChange={setMarketingChecked}
                />
              ) : null}
            </div>
          ) : (
            <div className="w-full max-w-[400px] rounded-xl border border-dashed border-outline-variant/40 px-5 py-8 text-center">
              <p className="text-sm text-on-surface-variant">{messages.legalConsent.gateHint}</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setEntryMode("form")}
            className="text-sm text-on-surface-variant underline underline-offset-2"
          >
            {locale === "ko-KR" ? "← 정보 다시 확인하기" : "← Back to my info"}
          </button>
        </main>
        {readyModalNode}
      </StitchSurveyShell>
    );
  }

  return (
    <StitchSurveyShell>
      <main className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-5 py-16 sm:px-6">
        <header className="space-y-2 text-center">
          <h1 className="stitch-headline text-2xl text-primary sm:text-3xl">
            {draftMode
              ? locale === "ko-KR"
                ? "두 사람은 서로 어떤 사람일까요?"
                : "What are you to each other?"
              : locale === "ko-KR"
                ? "생년월일을 알려주세요"
                : "When were you born?"}
          </h1>
          <p className="text-sm text-on-surface-variant">
            {draftMode
              ? locale === "ko-KR"
                ? "생년월일시와 장소만 알려주시면 바로 확인할 수 있어요."
                : "Just your birth date, time, and place -- see it right away."
              : locale === "ko-KR"
                ? "설문 없이도 바로 무료로 볼 수 있어요."
                : "No survey needed -- these are free the moment you sign up."}
          </p>
        </header>

        {/*
          Existing members shouldn't have to fill in birth data they
          already have on file just to find the login path -- this sits
          above the birth form, not buried below it, so returning people
          can bail into "login" mode before touching anything else.
        */}
        {draftMode && (
          <div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3">
            <span className="text-sm text-on-surface-variant">
              {locale === "ko-KR" ? "이미 회원이신가요?" : "Already a member?"}
            </span>
            <button
              type="button"
              onClick={() => setEntryMode("login")}
              className="stitch-cta-secondary shrink-0 px-5 py-2 text-sm"
            >
              {locale === "ko-KR" ? "로그인" : "Sign in"}
            </button>
          </div>
        )}

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
            disabled={!birthReady || busy}
            onClick={() => (draftMode ? handleDraftFormSubmit() : void handleSubmit())}
            className="stitch-cta-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? messages.survey.saving
              : draftMode
                ? locale === "ko-KR"
                  ? "우리 관계 확인하기"
                  : "Check our relationship"
                : messages.survey.viewResults}
          </button>
        </div>
      </main>

      {readyModalNode}
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
