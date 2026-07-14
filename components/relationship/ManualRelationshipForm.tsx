"use client";

import { useMemo, useState } from "react";
import GlowButton from "@/components/space/GlowButton";
import StitchBirthDateTimeFields, {
  stitchBirthIsoDate,
  stitchBirthTime24h,
} from "@/components/onboarding/StitchBirthDateTimeFields";
import { SURVEY_V2_QUESTIONS } from "@/lib/v2/survey/questions";
import type { SurveyAnswersInput } from "@/lib/v2/survey/types";
import type { AmPm } from "@/lib/v2/onboarding/birthTime";

type SurveyMode = "answer" | "skip";

function useFormStyles(theme: "space" | "stitch") {
  const isStitch = theme === "stitch";
  return {
    label: isStitch ? "text-xs font-medium text-on-surface-variant" : "text-xs text-white/55",
    input: isStitch
      ? "w-full rounded-xl border-0 bg-surface-container-low/80 px-3 py-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/35 focus:ring-2 focus:ring-primary/15 disabled:opacity-40"
      : "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white disabled:opacity-40",
    check: isStitch ? "text-xs text-on-surface-variant" : "text-xs text-white/55",
    segmentBtn: (active: boolean) =>
      isStitch
        ? [
            "flex-1 rounded-lg border py-2.5 text-xs font-semibold transition",
            active
              ? "border-secondary/50 bg-secondary/15 text-primary"
              : "border-outline-variant/40 bg-transparent text-on-surface-variant",
          ].join(" ")
        : [
            "flex-1 rounded-lg border py-2 text-xs font-medium transition",
            active
              ? "border-[#67B7FF]/50 bg-[#67B7FF]/15 text-[var(--space-text)]"
              : "border-white/12 bg-transparent text-white/55 hover:border-white/25",
          ].join(" "),
    surveyBox: isStitch
      ? "space-y-3 rounded-xl border border-outline-variant/25 bg-surface-container-low/40 p-3"
      : "space-y-3 rounded-xl border border-white/10 bg-black/20 p-3",
    surveyTitle: isStitch
      ? "text-xs font-semibold text-secondary"
      : "text-xs font-medium text-[#67B7FF]",
    optionLabel: isStitch
      ? "flex cursor-pointer gap-2 rounded-lg border border-outline-variant/30 px-2 py-2 text-[11px] text-on-surface-variant has-[:checked]:border-secondary/40 has-[:checked]:bg-secondary/10"
      : "flex cursor-pointer gap-2 rounded-lg border border-white/8 px-2 py-1.5 text-[11px] text-white/65 has-[:checked]:border-[#67B7FF]/40 has-[:checked]:bg-[#67B7FF]/10",
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
  const [surveyMode, setSurveyMode] = useState<SurveyMode>("answer");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const s = useFormStyles(theme);

  const birthDate = useMemo(
    () => stitchBirthIsoDate(year, month, day),
    [year, month, day],
  );
  const birthTime = useMemo(
    () => stitchBirthTime24h(period, hour, minute, birthTimeUnknown),
    [birthTimeUnknown, period, hour, minute],
  );

  const answeredCount = useMemo(
    () => SURVEY_V2_QUESTIONS.filter((q) => answers[q.id]).length,
    [answers],
  );

  const surveyOk =
    surveyMode === "skip" ||
    answeredCount === SURVEY_V2_QUESTIONS.length;

  const canSubmit =
    partnerName.trim().length >= 1 &&
    birthDate.length === 10 &&
    (birthPlaceUnknown || birthPlace.trim().length >= 1) &&
    surveyOk &&
    (birthTimeUnknown || birthTime != null);

  const submitHint = useMemo(() => {
    if (canSubmit) return null;
    if (!partnerName.trim()) return "이름을 입력해 주세요.";
    if (!birthDate.trim() || birthDate.length !== 10) return "생년월일(YYYY-MM-DD)을 입력해 주세요.";
    if (!birthTimeUnknown && !birthTime) {
      return "출생 시간을 입력하거나 「출생 시간 모름」을 선택해 주세요.";
    }
    if (!birthPlaceUnknown && !birthPlace.trim()) {
      return "태어난 지역을 입력하거나 「태어난 지역 모름」을 선택해 주세요.";
    }
    if (surveyMode === "answer" && !surveyOk) {
      return `친구 설문을 완료해 주세요. (${answeredCount}/${SURVEY_V2_QUESTIONS.length})`;
    }
    return "필수 항목을 채워 주세요.";
  }, [
    canSubmit,
    partnerName,
    birthDate,
    birthTimeUnknown,
    birthTime,
    birthPlaceUnknown,
    birthPlace,
    surveyMode,
    surveyOk,
    answeredCount,
  ]);

  return (
    <div className="space-y-4">
      <label className="block space-y-1">
        <span className={s.label}>이름 (또는 별명)</span>
        <input
          value={partnerName}
          onChange={(e) => setPartnerName(e.target.value)}
          className={s.input}
          placeholder="예: 민수"
          disabled={busy}
        />
      </label>

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

      <label className="block space-y-1">
        <span className={s.label}>태어난 장소</span>
        <input
          value={birthPlace}
          onChange={(e) => setBirthPlace(e.target.value)}
          disabled={busy || birthPlaceUnknown}
          className={s.input}
          placeholder="예: 서울, 부산"
        />
      </label>

      <label className={`flex items-center gap-2 ${s.check}`}>
        <input
          type="checkbox"
          checked={birthPlaceUnknown}
          onChange={(e) => setBirthPlaceUnknown(e.target.checked)}
          disabled={busy}
        />
        입력 건너뛰기 · 태어난 장소 모름
      </label>

      <div className={s.surveyBox}>
        <div className="space-y-2">
          <p className={s.surveyTitle}>친구 설문 (10문항)</p>
          <div className="flex gap-2">
            <button
              type="button"
              className={s.segmentBtn(surveyMode === "answer")}
              onClick={() => setSurveyMode("answer")}
              disabled={busy}
            >
              설문하기
            </button>
            <button
              type="button"
              className={s.segmentBtn(surveyMode === "skip")}
              onClick={() => setSurveyMode("skip")}
              disabled={busy}
            >
              입력 건너뛰기
            </button>
          </div>
        </div>

        {surveyMode === "answer" ? (
          <>
            <p className={s.hint}>
              {answeredCount}/{SURVEY_V2_QUESTIONS.length} 응답
            </p>
            <div className="max-h-64 space-y-4 overflow-y-auto pr-1">
              {SURVEY_V2_QUESTIONS.map((q) => (
                <fieldset key={q.id} className="space-y-2">
                  <legend className={`text-[11px] leading-relaxed ${theme === "stitch" ? "text-on-surface" : "text-white/75"}`}>
                    {q.prompt.split("\n")[0]}
                  </legend>
                  <div className="space-y-1">
                    {q.options.map((opt) => (
                      <label key={opt.value} className={s.optionLabel}>
                        <input
                          type="radio"
                          name={q.id}
                          value={opt.value}
                          checked={answers[q.id] === opt.value}
                          onChange={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [q.id]: opt.value,
                            }))
                          }
                          disabled={busy}
                          className="mt-0.5"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </>
        ) : (
          <p className={`text-[11px] leading-relaxed ${theme === "stitch" ? "text-on-surface-variant" : "text-white/45"}`}>
            설문 없이 관계를 만들어요. 분석은 중립 프로필 기준으로 진행됩니다.
          </p>
        )}
      </div>

      <div
        className={
          theme === "stitch"
            ? "sticky bottom-0 z-10 -mx-4 mt-2 space-y-2 border-t border-outline-variant/25 bg-surface-container-low/95 px-4 pb-[max(3.75rem,calc(2.75rem+env(safe-area-inset-bottom)))] pt-3 backdrop-blur-md"
            : "space-y-2"
        }
      >
        <div className="flex gap-2">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className={s.cancelBtn}
            >
              취소
            </button>
          ) : null}
          {theme === "stitch" ? (
            <button
              type="button"
              className="stitch-cta-primary flex-1 !min-h-[48px] !min-w-0 !text-sm disabled:opacity-45"
              disabled={busy || !canSubmit}
              onClick={() =>
                void onSubmit({
                  partnerName: partnerName.trim(),
                  birthDate,
                  birthTime: birthTimeUnknown ? null : birthTime,
                  birthTimeUnknown,
                  birthPlace: birthPlaceUnknown ? null : birthPlace.trim(),
                  birthPlaceUnknown,
                  surveySkipped: surveyMode === "skip",
                  surveyAnswers:
                    surveyMode === "skip"
                      ? null
                      : (answers as SurveyAnswersInput),
                })
              }
            >
              {busy ? "만드는 중…" : "관계 만들기"}
            </button>
          ) : (
            <GlowButton
              type="button"
              className="flex-1 !min-h-[44px] text-sm"
              disabled={busy || !canSubmit}
              onClick={() =>
                void onSubmit({
                  partnerName: partnerName.trim(),
                  birthDate,
                  birthTime: birthTimeUnknown ? null : birthTime,
                  birthTimeUnknown,
                  birthPlace: birthPlaceUnknown ? null : birthPlace.trim(),
                  birthPlaceUnknown,
                  surveySkipped: surveyMode === "skip",
                  surveyAnswers:
                    surveyMode === "skip"
                      ? null
                      : (answers as SurveyAnswersInput),
                })
              }
            >
              {busy ? "만드는 중…" : "관계 만들기"}
            </GlowButton>
          )}
        </div>
        {!canSubmit && submitHint && !busy ? (
          <p className={s.hint}>{submitHint}</p>
        ) : null}
      </div>
    </div>
  );
}
