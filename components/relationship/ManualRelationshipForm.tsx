"use client";

import { useMemo, useRef, useState } from "react";
import GlowButton from "@/components/space/GlowButton";
import StitchBirthDateTimeFields, {
  stitchBirthIsoDate,
  stitchBirthTime24h,
} from "@/components/onboarding/StitchBirthDateTimeFields";
import { getSurveyQuestions } from "@/lib/v2/survey/getSurveyQuestions";
import type { SurveyAnswersInput } from "@/lib/v2/survey/types";
import type { AmPm } from "@/lib/v2/onboarding/birthTime";
import { useLocale } from "@/lib/i18n/LocaleProvider";

function useFormStyles(theme: "space" | "stitch") {
  const isStitch = theme === "stitch";
  return {
    label: isStitch ? "text-xs font-medium text-on-surface-variant" : "text-xs text-white/55",
    input: isStitch
      ? "w-full rounded-xl border border-outline-variant/50 bg-white px-3 py-3 text-sm text-on-surface outline-none transition focus:border-secondary/50 focus:ring-2 focus:ring-secondary/15 disabled:opacity-40"
      : "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white disabled:opacity-40",
    check: isStitch ? "text-xs text-on-surface-variant" : "text-xs text-white/55",
    surveyBox: isStitch
      ? "space-y-3 rounded-xl border border-outline-variant/25 bg-surface-container-low/40 p-3"
      : "space-y-3 rounded-xl border border-white/10 bg-black/20 p-3",
    surveyTitle: isStitch
      ? "text-xs font-semibold text-secondary"
      : "text-xs font-medium text-[#67B7FF]",
    optionBtn: (selected: boolean) =>
      isStitch
        ? [
            "w-full rounded-xl border px-3 py-2.5 text-left text-[13px] leading-snug transition disabled:opacity-40",
            selected
              ? "border-secondary bg-secondary/10 text-on-surface"
              : "border-outline-variant/50 bg-white text-on-surface hover:border-secondary/40",
          ].join(" ")
        : [
            "w-full rounded-xl border px-3 py-2.5 text-left text-[13px] leading-snug transition disabled:opacity-40",
            selected
              ? "border-[#67B7FF] bg-[#67B7FF]/15 text-[var(--space-text)]"
              : "border-white/12 bg-black/20 text-white/75 hover:border-white/25",
          ].join(" "),
    cancelBtn: isStitch
      ? "flex-1 min-h-[48px] rounded-full border border-outline-variant/45 py-2.5 text-sm font-semibold text-on-surface-variant"
      : "flex-1 rounded-xl border border-white/15 py-2.5 text-xs text-white/60",
    hint: isStitch ? "text-center text-xs text-on-surface-variant" : "text-center text-[10px] text-white/45",
  };
}

export default function ManualRelationshipForm({
  busy,
  onSubmit,
  onCancel,
  theme = "space",
}: {
  myReportId: string;
  busy?: boolean;
  theme?: "space" | "stitch";
  onSubmit: (payload: {
    partnerName: string;
    birthDate: string;
    birthTime: string | null;
    birthTimeUnknown: boolean;
    birthPlace: string | null;
    birthPlaceUnknown: boolean;
    surveySkipped: boolean;
    surveyAnswers: SurveyAnswersInput | null;
  }) => Promise<void>;
  onCancel?: () => void;
}) {
  const [partnerName, setPartnerName] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [period, setPeriod] = useState<AmPm>("am");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [birthPlace, setBirthPlace] = useState("");
  const [birthPlaceUnknown, setBirthPlaceUnknown] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [advancing, setAdvancing] = useState(false);
  const [hintPulse, setHintPulse] = useState(0);
  const nameRef = useRef<HTMLInputElement>(null);
  const birthBlockRef = useRef<HTMLDivElement>(null);
  const placeRef = useRef<HTMLInputElement>(null);
  const surveyRef = useRef<HTMLDivElement>(null);
  const s = useFormStyles(theme);
  const { locale, messages } = useLocale();
  const surveyQuestions = useMemo(() => getSurveyQuestions(locale), [locale]);

  const birthDate = useMemo(
    () => stitchBirthIsoDate(year, month, day),
    [year, month, day],
  );
  const birthTime = useMemo(
    () => stitchBirthTime24h(period, hour, minute, birthTimeUnknown),
    [birthTimeUnknown, period, hour, minute],
  );

  const answeredCount = useMemo(
    () => surveyQuestions.filter((q) => answers[q.id]).length,
    [answers, surveyQuestions],
  );
  const currentQuestion = surveyQuestions[currentQuestionIndex];

  const surveyOk = answeredCount === surveyQuestions.length;

  const nameOk = partnerName.trim().length >= 1;
  const dateOk = birthDate.length === 10;
  const timeOk = birthTimeUnknown || birthTime != null;
  const placeOk = birthPlaceUnknown || birthPlace.trim().length >= 1;

  const canSubmit = nameOk && dateOk && timeOk && placeOk && surveyOk;

  const submitBlockers = useMemo(() => {
    const blockers: string[] = [];
    if (!nameOk) blockers.push("name");
    if (!dateOk) blockers.push("birth_date");
    if (!timeOk) blockers.push("birth_time");
    if (!placeOk) blockers.push("birth_place");
    if (!surveyOk) blockers.push("survey");
    return blockers;
  }, [nameOk, dateOk, timeOk, placeOk, surveyOk]);

  const submitHint = useMemo(() => {
    if (canSubmit) return null;
    if (!nameOk) return messages.relationshipForm.nameRequired;
    if (!dateOk) return messages.relationshipForm.birthDateRequired;
    if (!timeOk) return messages.relationshipForm.birthTimeRequired;
    if (!placeOk) return messages.relationshipForm.birthPlaceRequired;
    if (!surveyOk) {
      return messages.relationshipForm.surveyIncomplete(
        answeredCount,
        surveyQuestions.length,
      );
    }
    return messages.relationshipForm.fieldsRequired;
  }, [
    canSubmit,
    nameOk,
    dateOk,
    timeOk,
    placeOk,
    surveyOk,
    answeredCount,
    surveyQuestions.length,
    messages,
  ]);

  function focusFirstIncomplete() {
    setHintPulse((n) => n + 1);
    if (!nameOk) {
      nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      nameRef.current?.focus();
      return;
    }
    if (!dateOk || !timeOk) {
      birthBlockRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    if (!placeOk) {
      placeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (!birthPlaceUnknown) placeRef.current?.focus();
      return;
    }
    surveyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleCreateClick() {
    if (busy) return;
    if (!canSubmit) {
      focusFirstIncomplete();
      return;
    }
    void onSubmit({
      partnerName: partnerName.trim(),
      birthDate,
      birthTime: birthTimeUnknown ? null : birthTime,
      birthTimeUnknown,
      birthPlace: birthPlaceUnknown ? null : birthPlace.trim(),
      birthPlaceUnknown,
      surveySkipped: false,
      surveyAnswers: answers as SurveyAnswersInput,
    });
  }

  function pickAnswer(value: string) {
    if (busy || advancing || !currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    const isLast = currentQuestionIndex >= surveyQuestions.length - 1;
    if (!isLast) {
      setAdvancing(true);
      window.setTimeout(() => {
        setCurrentQuestionIndex((i) => i + 1);
        setAdvancing(false);
      }, 160);
    }
  }

  function goPrevQuestion() {
    if (busy || advancing || currentQuestionIndex <= 0) return;
    setCurrentQuestionIndex((i) => i - 1);
  }

  return (
    <div className="space-y-4">
      <label className="block space-y-1">
        <span className={s.label}>{messages.relationshipForm.nameLabel}</span>
        <input
          ref={nameRef}
          value={partnerName}
          onChange={(e) => setPartnerName(e.target.value)}
          className={s.input}
          placeholder={messages.relationshipForm.namePlaceholder}
          disabled={busy}
        />
      </label>

      <div ref={birthBlockRef}>
        <StitchBirthDateTimeFields
          year={year}
          month={month}
          day={day}
          onYearChange={setYear}
          onMonthChange={setMonth}
          onDayChange={setDay}
          period={period}
          onPeriodChange={setPeriod}
          hour={hour}
          minute={minute}
          onHourChange={setHour}
          onMinuteChange={setMinute}
          birthTimeUnknown={birthTimeUnknown}
          onBirthTimeUnknownChange={setBirthTimeUnknown}
          busy={busy}
          theme={theme}
        />
      </div>

      <label className="block space-y-1">
        <span className={s.label}>{messages.onboarding.birthPlace}</span>
        <input
          ref={placeRef}
          value={birthPlace}
          onChange={(e) => setBirthPlace(e.target.value)}
          disabled={busy || birthPlaceUnknown}
          className={s.input}
          placeholder={messages.relationshipForm.birthPlacePlaceholder}
          aria-invalid={!placeOk}
        />
      </label>

      <label className={`flex items-center gap-2 ${s.check}`}>
        <input
          type="checkbox"
          checked={birthPlaceUnknown}
          onChange={(e) => setBirthPlaceUnknown(e.target.checked)}
          disabled={busy}
        />
        {messages.relationshipForm.birthPlaceSkip}
      </label>

      <div ref={surveyRef} className={s.surveyBox}>
        <div className="flex items-baseline justify-between gap-2">
          <p className={s.surveyTitle}>{messages.relationshipForm.surveyTitle}</p>
          <span className={s.hint}>
            {messages.relationshipForm.responses(
              answeredCount,
              surveyQuestions.length,
            )}
          </span>
        </div>

        {currentQuestion ? (
          <fieldset key={currentQuestion.id} className="space-y-2.5">
            <legend className={`text-[13px] leading-relaxed ${theme === "stitch" ? "text-on-surface" : "text-white/75"}`}>
              {currentQuestion.prompt.split("\n")[0]}
            </legend>
            <div className="space-y-2">
              {currentQuestion.options.map((opt: { value: string; label: string }) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={busy || advancing}
                  onClick={() => pickAnswer(opt.value)}
                  className={s.optionBtn(answers[currentQuestion.id] === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex justify-start pt-1">
              <button
                type="button"
                onClick={goPrevQuestion}
                disabled={busy || advancing || currentQuestionIndex <= 0}
                className={`text-xs disabled:opacity-40 ${theme === "stitch" ? "text-on-surface-variant" : "text-white/55"}`}
              >
                {messages.cta.back}
              </button>
            </div>
          </fieldset>
        ) : null}
      </div>

      <div
        className={
          theme === "stitch"
            ? "sticky bottom-0 z-10 -mx-4 mt-2 space-y-2 border-t border-outline-variant/25 bg-surface-container-low/95 px-4 pb-[max(3.75rem,calc(2.75rem+env(safe-area-inset-bottom)))] pt-3 backdrop-blur-md"
            : "space-y-2"
        }
      >
        {!canSubmit && submitHint && !busy ? (
          <p
            key={hintPulse}
            role="status"
            className={
              theme === "stitch"
                ? "rounded-lg bg-accent-rose-soft/80 px-3 py-2 text-center text-xs font-medium text-primary"
                : "text-center text-[10px] text-[#ffb4a2]"
            }
          >
            {submitHint}
          </p>
        ) : null}
        <div className="flex gap-2">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className={s.cancelBtn}
            >
              {messages.cta.cancel}
            </button>
          ) : null}
          {theme === "stitch" ? (
            <button
              type="button"
              className={`stitch-cta-primary flex-1 !min-h-[48px] !min-w-0 !text-sm ${
                busy || !canSubmit ? "opacity-45" : ""
              }`}
              disabled={busy}
              aria-disabled={!canSubmit}
              data-submit-blockers={submitBlockers.join(",") || undefined}
              data-can-submit={canSubmit ? "true" : "false"}
              onClick={handleCreateClick}
            >
              {busy ? messages.common.creating : messages.relationshipForm.createRelationship}
            </button>
          ) : (
            <GlowButton
              type="button"
              className={`flex-1 !min-h-[44px] text-sm ${
                !canSubmit ? "!opacity-45" : ""
              }`}
              disabled={busy}
              aria-disabled={!canSubmit}
              data-submit-blockers={submitBlockers.join(",") || undefined}
              data-can-submit={canSubmit ? "true" : "false"}
              onClick={handleCreateClick}
            >
              {busy ? messages.common.creating : messages.relationshipForm.createRelationship}
            </GlowButton>
          )}
        </div>
      </div>
    </div>
  );
}
