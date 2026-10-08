"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getSurveyQuestions } from "@/lib/v2/survey/getSurveyQuestions";
import { isSurveyV2AnswersComplete } from "@/lib/v2/survey/completion";

/**
 * Guest Personal: the member survey (same questions and look as /survey-v2),
 * shown after the birth details. Optional where the locale allows it
 * (skipping is allowed with an accuracy warning); answers are only kept in
 * memory here and sent together with the birth details.
 */
export default function GuestSurveyStep({
  required,
  hasStoredSurvey,
  busy,
  onBack,
  onComplete,
  onSkip,
  onKeepStored,
}: {
  required: boolean;
  hasStoredSurvey: boolean;
  busy: boolean;
  onBack: () => void;
  onComplete: (answers: Record<string, string>) => void;
  onSkip: () => void;
  onKeepStored: () => void;
}) {
  const { locale, messages } = useLocale();
  const t = messages.payments.guestUse;
  const questions = useMemo(() => getSurveyQuestions(locale), [locale]);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [advancing, setAdvancing] = useState(false);

  const skipBlock = !required ? (
    <div className="mt-6 text-center">
      <button
        type="button"
        disabled={busy}
        onClick={onSkip}
        className="text-sm font-medium text-on-surface-variant underline underline-offset-4 hover:text-primary disabled:opacity-50"
      >
        {t.surveySkip}
      </button>
      <p className="mt-1.5 text-[11px] leading-relaxed text-on-surface-variant/80">{t.surveySkipWarning}</p>
    </div>
  ) : null;

  if (!started) {
    return (
      <div className="w-full max-w-[420px] space-y-6">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
            {required ? t.surveyEyebrowRequired : t.surveyEyebrow}
          </p>
          <h2 className="stitch-headline mt-2 text-balance text-xl leading-snug">{t.surveyIntroTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
            {required ? t.surveyIntroBodyRequired : t.surveyIntroBody}
          </p>
        </div>
        <button type="button" disabled={busy} onClick={() => setStarted(true)} className="stitch-cta-primary w-full">
          {t.surveyStart}
        </button>
        {hasStoredSurvey ? (
          <button type="button" disabled={busy} onClick={onKeepStored} className="stitch-cta-secondary w-full">
            {t.surveyKeep}
          </button>
        ) : null}
        {skipBlock}
        <div className="text-center">
          <button type="button" disabled={busy} onClick={onBack} className="text-xs text-on-surface-variant hover:text-primary">
            {t.surveyBackToBirth}
          </button>
        </div>
      </div>
    );
  }

  const q = questions[index];
  const progressPct = Math.round(((index + 1) / questions.length) * 100);

  const pick = (value: string) => {
    if (busy || advancing) return;
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    if (index < questions.length - 1) {
      setAdvancing(true);
      window.setTimeout(() => {
        setIndex((i) => i + 1);
        setAdvancing(false);
      }, 160);
    } else if (isSurveyV2AnswersComplete(next)) {
      onComplete(next);
    }
  };

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
          <span className="text-secondary">{messages.survey.title}</span>
          <span className="tabular-nums text-primary">
            {index + 1} / {questions.length}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-outline-variant/35">
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          <h2 className="mb-8 whitespace-pre-line text-balance text-[1.35rem] font-semibold leading-snug text-on-surface break-keep">
            {q.prompt}
          </h2>
          <div className="flex flex-col gap-3">
            {q.options.map((opt: { value: string; label: string }) => {
              const selected = answers[q.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={busy || advancing}
                  onClick={() => pick(opt.value)}
                  className={`rounded-2xl border px-4 py-3.5 text-left text-[0.95rem] transition break-keep ${
                    selected
                      ? "border-primary bg-primary/10 text-on-surface"
                      : "border-outline-variant/60 bg-surface-container-lowest text-on-surface hover:border-primary/40"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => (index > 0 ? setIndex((i) => i - 1) : setStarted(false))}
          disabled={busy || advancing}
          className="text-sm text-on-surface-variant disabled:opacity-40"
        >
          {messages.survey.previous}
        </button>
        {busy ? <span className="text-sm text-on-surface-variant">{messages.survey.saving}</span> : null}
      </div>
      {skipBlock}
    </div>
  );
}
