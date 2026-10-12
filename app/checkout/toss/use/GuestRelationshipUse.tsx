"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ROUTES } from "@/constants/routes";
import TossResultShell from "../TossResultShell";
import StitchBirthInputForm, {
  isStitchBirthFormReady,
  type StitchBirthFormState,
} from "@/components/onboarding/StitchBirthInputForm";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import GuestSurveyStep from "@/components/payment/GuestSurveyStep";
import RelationshipPremiumSection from "@/components/relationship/detail/RelationshipPremiumSection";
import MadeWithInfoNote from "@/components/common/MadeWithInfoNote";
import { setAuthPrefillEmail } from "@/lib/auth/prefillEmail";
import { parseRomanticDeepViewModel } from "@/lib/relationship/detail/parseRomanticDeepViewModel";
import type { RelationshipKind } from "@/lib/relationship/relationshipKind";
import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import type { MarriageReportBody } from "@/lib/relationship/marriage/buildMarriageReport";
import type { FamilyParentReportBody } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import type { FriendReportBody } from "@/lib/relationship/friend/buildFriendReport";
import type { RomanticV4PrototypePayload } from "@/lib/relationship/romantic/prototypeV4/types";

/**
 * Guest (no-account) use of a single Relationship purchase. Purchase
 * verification is shared with guest Personal (GuestUseClient). Then:
 *   1. my info (+ optional survey in KR, required in en-US),
 *   2. the other person's info + relationship + the required notice,
 *   3. explicit "create" (uses the purchase once),
 *   4. result + "save to account" (verified purchase email only).
 * Opening / refreshing this page never generates or uses the purchase.
 */

type Person = {
  name: string | null;
  birthDate: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  birthPlace: string | null;
  birthPlaceUnknown: boolean;
};

type State = {
  status: "needs_input" | "ready" | "generating" | "generated" | "saved" | "expired" | "linked" | "not_available" | "unverified" | "error";
  surveyRequired?: boolean;
  isTest?: boolean;
  expiresAt?: string | null;
  input?: {
    me: Person & { hasSurvey: boolean };
    partner: Person;
    kind: RelationshipKind | null;
    familyOptions: { parentType: "mother" | "father"; childIsViewer: boolean } | null;
    consented: boolean;
  } | null;
  result?: { kind: RelationshipKind; payload: { report?: unknown } | null; generatedAt: string | null; romanticV4: unknown; romanticV4Enabled: boolean; viewerIsReportA: boolean } | null;
  savedRelationshipId?: string | null;
  savedReportId?: string | null;
  email?: string | null;
};

const KINDS: RelationshipKind[] = ["romantic", "cohabitation", "friendship", "work", "family"];

function toForm(p: Person | undefined | null): StitchBirthFormState | null {
  if (!p) return null;
  return {
    birthDate: p.birthDate,
    birthTime: p.birthTimeUnknown ? null : p.birthTime,
    birthTimeUnknown: p.birthTimeUnknown,
    birthPlace: p.birthPlaceUnknown ? null : p.birthPlace,
    birthPlaceUnknown: p.birthPlaceUnknown || !p.birthPlace,
  };
}

function personBody(name: string, f: StitchBirthFormState) {
  const placeUnknown = f.birthPlaceUnknown || !f.birthPlace;
  return {
    name: name.trim() || null,
    birthDate: f.birthDate,
    birthTime: f.birthTimeUnknown ? null : f.birthTime,
    birthTimeUnknown: f.birthTimeUnknown,
    birthPlace: placeUnknown ? null : f.birthPlace,
    birthPlaceUnknown: placeUnknown,
  };
}

const inputClass = "mt-1 w-full rounded-xl border border-[#D4CFC4] bg-white px-3 py-2.5 text-sm text-[#1A3328]";
const chipClass = (on: boolean) =>
  [
    "rounded-full border px-3.5 py-2 text-sm font-semibold transition",
    on ? "border-[#3A8F6E] bg-[#EAF4EF] text-[#1A3328]" : "border-[#D4CFC4] bg-white text-[#4A5C52]",
  ].join(" ");

export default function GuestRelationshipUse({ orderId, wantsSave }: { orderId: string; wantsSave: boolean }) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { locale, messages, href } = useLocale();
  const t = messages.payments.guestRelationship;
  const tu = messages.payments.guestUse;

  const [state, setState] = useState<State | null>(null);
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState<"me" | "survey" | "partner">("me");
  const [meName, setMeName] = useState("");
  const [meForm, setMeForm] = useState<StitchBirthFormState | null>(null);
  const [survey, setSurvey] = useState<Record<string, string> | "keep" | null>("keep");
  const [partnerName, setPartnerName] = useState("");
  const [partnerForm, setPartnerForm] = useState<StitchBirthFormState | null>(null);
  const [kind, setKind] = useState<RelationshipKind | null>(null);
  const [parentType, setParentType] = useState<"mother" | "father">("mother");
  const [childIsViewer, setChildIsViewer] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const autoSaved = useRef(false);
  const seeded = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/guest/relationship", { cache: "no-store" });
      const body = (await res.json().catch(() => ({ status: "error" }))) as State;
      setState(body);
    } catch {
      setState({ status: "error" });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  // Already-entered info is shown again, never asked from scratch.
  useEffect(() => {
    const i = state?.input;
    if (!i || seeded.current) return;
    seeded.current = true;
    const timer = setTimeout(() => {
      setMeName(i.me.name ?? "");
      setMeForm(toForm(i.me));
      setPartnerName(i.partner.name ?? "");
      setPartnerForm(toForm(i.partner));
      setKind(i.kind);
      if (i.familyOptions) {
        setParentType(i.familyOptions.parentType);
        setChildIsViewer(i.familyOptions.childIsViewer);
      }
      setConsent(i.consented);
      setSurvey(i.me.hasSurvey ? "keep" : null);
    }, 0);
    return () => clearTimeout(timer);
  }, [state]);

  // While another window is generating, check again every few seconds.
  useEffect(() => {
    if (state?.status !== "generating") return;
    const timer = setTimeout(() => void load(), 4000);
    return () => clearTimeout(timer);
  }, [state, load]);

  const save = useCallback(async () => {
    setBusy(true);
    setNotice("");
    const res = await fetch("/api/guest/relationship/save", { method: "POST" }).catch(() => null);
    const body = (await res?.json().catch(() => ({}))) as { status?: string } | undefined;
    setBusy(false);
    if (body?.status === "saved" || body?.status === "already_saved") return void load();
    setNotice(body?.status === "email_mismatch" ? tu.saveMismatch : t.generateFailed);
  }, [load, t, tu]);

  // Back from Clerk with ?save=1: the user already asked to save.
  useEffect(() => {
    if (!wantsSave || autoSaved.current || !isLoaded || !isSignedIn || state?.status !== "generated") return;
    autoSaved.current = true;
    const timer = setTimeout(() => void save(), 0);
    return () => clearTimeout(timer);
  }, [wantsSave, isLoaded, isSignedIn, state, save]);

  const submitInput = async () => {
    if (!meForm || !partnerForm || !kind) return;
    if (!consent) return setNotice(t.consentRequired);
    setBusy(true);
    setNotice("");
    const res = await fetch("/api/guest/relationship/input", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        me: personBody(meName, meForm),
        partner: personBody(partnerName, partnerForm),
        kind,
        familyParentType: parentType,
        familyChildIsViewer: childIsViewer,
        partnerConsent: consent,
        surveyAnswers: survey && survey !== "keep" ? survey : null,
        keepSurvey: survey === "keep",
      }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => ({}))) as { status?: string } | undefined;
    setBusy(false);
    if (res?.ok) {
      setEditing(false);
      setStep("me");
      return void load();
    }
    setNotice(
      body?.status === "consent_required"
        ? t.consentRequired
        : body?.status === "invalid_input" || body?.status === "survey_required"
          ? t.invalidInput
          : t.generateFailed,
    );
  };

  const generate = async () => {
    setBusy(true);
    setNotice("");
    setState((prev) => (prev ? { ...prev, status: "generating" } : prev));
    const res = await fetch("/api/guest/relationship/generate", { method: "POST" }).catch(() => null);
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

  const view = useMemo(() => {
    const r = state?.result;
    const report = (r?.payload?.report ?? null) as unknown;
    return {
      romantic: r?.kind === "romantic" ? parseRomanticDeepViewModel(report) : null,
      work: r?.kind === "work" ? (report as WorkColleagueReportBody) : null,
      cohabitation: r?.kind === "cohabitation" ? (report as MarriageReportBody) : null,
      family: r?.kind === "family" ? (report as FamilyParentReportBody) : null,
      friendship: r?.kind === "friendship" ? (report as FriendReportBody) : null,
    };
  }, [state]);

  if (!state) return <TossResultShell tone="progress" title={messages.payments.claimWorkingTitle} body={messages.payments.tossConfirmingBody} />;

  if (state.status === "saved") {
    return (
      <TossResultShell tone="success" title={tu.savedTitle} body={t.savedBody}>
        {state.savedRelationshipId ? (
          <button
            type="button"
            className="stitch-cta-primary w-full"
            onClick={() => {
              const q = state.savedReportId ? `?${new URLSearchParams({ viewer: state.savedReportId })}` : "";
              router.push(href(`${ROUTES.relationship}/${encodeURIComponent(state.savedRelationshipId as string)}${q}`));
            }}
          >
            {t.openReport}
          </button>
        ) : null}
      </TossResultShell>
    );
  }
  if (state.status === "linked") {
    return (
      <TossResultShell tone="warning" title={tu.linkedTitle} body={tu.linkedBody}>
        <button type="button" className="stitch-cta-primary w-full" onClick={() => router.push(`${href(ROUTES.signIn)}?${new URLSearchParams({ redirect_url: href(ROUTES.accountBilling) })}`)}>
          {messages.nav.signIn}
        </button>
      </TossResultShell>
    );
  }
  if (state.status === "expired") return <TossResultShell tone="warning" title={tu.expiredTitle} body={tu.expiredBody} />;
  if (state.status === "not_available" || state.status === "error" || state.status === "unverified") {
    return <TossResultShell tone="warning" title={tu.notAvailableTitle} body={tu.notAvailableBody} />;
  }

  // ---------------------------------------------------------------- input
  if (state.status === "needs_input" || editing) {
    if (step === "survey" && meForm && isStitchBirthFormReady(meForm)) {
      return (
        <StitchSurveyShell>
          <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-12">
            <GuestSurveyStep
              required={Boolean(state.surveyRequired)}
              hasStoredSurvey={Boolean(state.input?.me.hasSurvey)}
              busy={busy}
              onBack={() => setStep("me")}
              onComplete={(answers) => {
                setSurvey(answers);
                setStep("partner");
              }}
              onSkip={() => {
                setSurvey(null);
                setStep("partner");
              }}
              onKeepStored={() => {
                setSurvey("keep");
                setStep("partner");
              }}
            />
          </div>
        </StitchSurveyShell>
      );
    }
    if (step === "partner") {
      const ready = Boolean(partnerName.trim() && partnerForm && isStitchBirthFormReady(partnerForm) && kind && consent);
      return (
        <StitchSurveyShell>
          <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center gap-5 px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-10">
            <div className="w-full max-w-[420px] text-left">
              <button type="button" className="text-xs font-semibold text-[#3A8F6E]" disabled={busy} onClick={() => setStep("me")}>
                {t.back}
              </button>
              <h1 className="mt-3 text-lg font-bold text-[#1A3328]">{t.partnerTitle}</h1>
              <p className="mt-1 text-sm leading-relaxed text-[#4A5C52]">{t.partnerBody}</p>
              <label className="mt-4 block text-xs font-medium text-[#4A5C52]">
                {t.partnerNameLabel}
                <input value={partnerName} maxLength={40} onChange={(e) => setPartnerName(e.target.value)} className={inputClass} />
              </label>
              <p className="mt-4 text-xs font-medium text-[#4A5C52]">{t.kindLabel}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {KINDS.map((k) => (
                  <button key={k} type="button" className={chipClass(kind === k)} onClick={() => setKind(k)}>
                    {t.kinds[k as keyof typeof t.kinds]}
                  </button>
                ))}
              </div>
              {kind === "family" ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-[#4A5C52]">{t.familyParentLabel}</p>
                  <div className="flex gap-2">
                    <button type="button" className={chipClass(parentType === "mother")} onClick={() => setParentType("mother")}>{t.familyMother}</button>
                    <button type="button" className={chipClass(parentType === "father")} onClick={() => setParentType("father")}>{t.familyFather}</button>
                  </div>
                  <p className="text-xs font-medium text-[#4A5C52]">{t.familyChildLabel}</p>
                  <div className="flex gap-2">
                    <button type="button" className={chipClass(childIsViewer)} onClick={() => setChildIsViewer(true)}>{t.familyChildMe}</button>
                    <button type="button" className={chipClass(!childIsViewer)} onClick={() => setChildIsViewer(false)}>{t.familyChildPartner}</button>
                  </div>
                </div>
              ) : null}
            </div>
            <StitchBirthInputForm
              initialBirthDate={partnerForm?.birthDate ?? null}
              initialBirthTime={partnerForm?.birthTime ?? null}
              initialBirthTimeUnknown={partnerForm?.birthTimeUnknown}
              initialBirthPlace={partnerForm?.birthPlace ?? null}
              initialBirthPlaceUnknown={partnerForm?.birthPlaceUnknown}
              busy={busy}
              onChange={setPartnerForm}
            />
            <div className="w-full max-w-[420px] space-y-3">
              <label className="flex items-start gap-2.5 rounded-xl border border-[#D4CFC4] bg-white px-3.5 py-3 text-left">
                <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>
                  <span className="block text-sm font-semibold text-[#1A3328]">{t.consentLabel}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[#4A5C52]">{t.consentBody}</span>
                </span>
              </label>
              <button type="button" className="stitch-cta-primary w-full disabled:cursor-not-allowed" disabled={!ready || busy} onClick={() => void submitInput()}>
                {busy ? messages.survey.saving : t.saveCta}
              </button>
              {notice ? <p role="status" className="text-center text-sm text-amber-700">{notice}</p> : null}
            </div>
          </div>
        </StitchSurveyShell>
      );
    }
    const meReady = meForm ? isStitchBirthFormReady(meForm) : false;
    return (
      <StitchSurveyShell>
        <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center gap-5 px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-10">
          <div className="w-full max-w-[420px] text-left">
            <h1 className="text-lg font-bold text-[#1A3328]">{t.meTitle}</h1>
            <label className="mt-3 block text-xs font-medium text-[#4A5C52]">
              {t.meNameLabel}
              <input value={meName} maxLength={40} onChange={(e) => setMeName(e.target.value)} className={inputClass} />
            </label>
          </div>
          <StitchBirthInputForm
            initialBirthDate={meForm?.birthDate ?? null}
            initialBirthTime={meForm?.birthTime ?? null}
            initialBirthTimeUnknown={meForm?.birthTimeUnknown}
            initialBirthPlace={meForm?.birthPlace ?? null}
            initialBirthPlaceUnknown={meForm?.birthPlaceUnknown}
            busy={busy}
            onChange={setMeForm}
          />
          <div className="w-full max-w-[420px]">
            <button type="button" disabled={!meReady || busy} onClick={() => setStep("survey")} className="stitch-cta-primary w-full disabled:cursor-not-allowed">
              {t.nextCta}
            </button>
            {!meReady ? <p className="mt-2 text-center text-[11px] text-on-surface-variant">{messages.survey.birthFormIncompleteHint}</p> : null}
            <p className="mt-4 text-center text-[11px] leading-relaxed text-on-surface-variant">{tu.inputBody}</p>
          </div>
        </div>
      </StitchSurveyShell>
    );
  }

  // ---------------------------------------------------------------- ready / result
  const fmt = (iso: string | null | undefined) =>
    iso ? new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(new Date(iso)) : null;
  const expires = fmt(state.expiresAt);
  const i = state.input;
  const meLabel = i?.me.name?.trim() || t.summaryMe;
  const partnerLabel = i?.partner.name?.trim() || t.summaryPartner;
  const resultKind = state.result?.kind ?? i?.kind ?? "romantic";
  const meIsA = state.result?.viewerIsReportA ?? true;
  const nameA = meIsA ? meLabel : partnerLabel;
  const nameB = meIsA ? partnerLabel : meLabel;

  return (
    <div className="stitch-landing min-h-[80vh] bg-[#FAF7F0]">
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-8 sm:px-6">
        {state.status === "ready" && i ? (
          <section className="stitch-hero-panel space-y-4 rounded-extra-large px-5 py-6 text-center">
            <h1 className="text-lg font-bold text-[#1A3328]">{t.generateTitle}</h1>
            <dl className="mx-auto grid max-w-sm grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-left text-sm text-[#1A3328]">
              <dt className="text-[#4A5C52]">{t.summaryMe}</dt>
              <dd>{meLabel} · {i.me.birthDate} · {i.me.hasSurvey ? t.surveyDone : t.surveyNone}</dd>
              <dt className="text-[#4A5C52]">{t.summaryPartner}</dt>
              <dd>{partnerLabel} · {i.partner.birthDate}</dd>
              <dt className="text-[#4A5C52]">{t.summaryKind}</dt>
              <dd>{i.kind ? t.kinds[i.kind as keyof typeof t.kinds] : ""}</dd>
            </dl>
            <p className="text-sm leading-relaxed text-[#4A5C52]">{t.generateBody}</p>
            <button type="button" className="stitch-cta-primary w-full" disabled={busy} onClick={() => void generate()}>
              {t.generateCta}
            </button>
            <button
              type="button"
              className="text-xs font-semibold text-[#3A8F6E] underline underline-offset-2"
              disabled={busy}
              onClick={() => {
                setStep("me");
                setEditing(true);
              }}
            >
              {t.editInput}
            </button>
          </section>
        ) : null}

        {state.status === "generating" ? (
          <TossResultShell tone="progress" title={t.generateCta} body={t.generatingBody} />
        ) : null}

        {state.status === "generated" && state.result ? (
          <>
            <MadeWithInfoNote generatedAt={state.result.generatedAt} inputsChanged={null} />
            <RelationshipPremiumSection
              busy={false}
              premiumKind={resultKind}
              analysisType="premium"
              premiumReady
              hasSnapshotView={false}
              partnerName={partnerLabel}
              viewerName={meLabel}
              nameA={nameA}
              nameB={nameB}
              displayNameA={nameA}
              displayNameB={nameB}
              viewerIsReportA={meIsA}
              displayPremium={null}
              displayRomanticDeep={view.romantic}
              displayRomanticDeepV4={(state.result.romanticV4 ?? null) as RomanticV4PrototypePayload | null}
              romanticV4Enabled={state.result.romanticV4Enabled}
              displayWorkDeep={view.work}
              displayCohabitationDeep={view.cohabitation}
              displayFamilyDeep={view.family}
              displayFriendshipDeep={view.friendship}
              onRunPremium={async () => false}
              onRegeneratePremium={() => undefined}
              canRegenerate={false}
              familyParentType={i?.familyOptions?.parentType}
              familyChildIsViewer={i?.familyOptions?.childIsViewer}
              premiumKindLoaded
            />
          </>
        ) : null}

        {state.status === "generated" ? (
          <section className="space-y-3 rounded-2xl border border-[#3A8F6E]/30 bg-[#EAF4EF] px-5 py-5">
            <p className="text-sm font-semibold leading-relaxed text-[#1A3328]">{t.saveBanner}</p>
            {isSignedIn ? (
              <button type="button" className="stitch-cta-primary w-full" disabled={busy} onClick={() => void save()}>
                {tu.saveNow}
              </button>
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                <button type="button" className="stitch-cta-primary w-full" onClick={() => goAuth(ROUTES.signUp)}>
                  {tu.saveSignUp}
                </button>
                <button type="button" className="stitch-cta-secondary w-full" onClick={() => goAuth(ROUTES.signIn)}>
                  {tu.saveSignIn}
                </button>
              </div>
            )}
            {expires ? <p className="text-xs leading-relaxed text-[#4A5C52]">{t.retentionNote(expires)}</p> : null}
            <p className="text-xs leading-relaxed text-[#4A5C52]">{t.inviteNote}</p>
          </section>
        ) : null}

        {notice ? <p role="status" className="text-center text-sm text-amber-700">{notice}</p> : null}
        {state.isTest ? <p className="text-center text-xs text-[#4A5C52]/70">{tu.testPurchaseNote}</p> : null}
      </main>
    </div>
  );
}
