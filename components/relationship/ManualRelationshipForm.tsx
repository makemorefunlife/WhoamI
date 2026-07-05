"use client";

import { useMemo, useState } from "react";
import GlowButton from "@/components/space/GlowButton";
import { SURVEY_V2_QUESTIONS } from "@/lib/v2/survey/questions";
import type { SurveyAnswersInput } from "@/lib/v2/survey/types";

type SurveyMode = "answer" | "skip";

const segmentBtn = (active: boolean) =>
  [
    "flex-1 rounded-lg border py-2 text-xs font-medium transition",
    active
      ? "border-[#67B7FF]/50 bg-[#67B7FF]/15 text-[var(--space-text)]"
      : "border-white/12 bg-transparent text-white/55 hover:border-white/25",
  ].join(" ");

export default function ManualRelationshipForm({
  busy,
  onSubmit,
  onCancel,
}: {
  myReportId: string;
  busy?: boolean;
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
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [birthPlace, setBirthPlace] = useState("");
  const [birthPlaceUnknown, setBirthPlaceUnknown] = useState(false);
  const [surveyMode, setSurveyMode] = useState<SurveyMode>("answer");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const answeredCount = useMemo(
    () => SURVEY_V2_QUESTIONS.filter((q) => answers[q.id]).length,
    [answers],
  );

  const surveyOk =
    surveyMode === "skip" ||
    answeredCount === SURVEY_V2_QUESTIONS.length;

  const canSubmit =
    partnerName.trim().length >= 1 &&
    birthDate.trim().length >= 8 &&
    (birthPlaceUnknown || birthPlace.trim().length >= 1) &&
    surveyOk &&
    (birthTimeUnknown || birthTime.trim().length >= 4);

  const submitHint = useMemo(() => {
    if (canSubmit) return null;
    if (!partnerName.trim()) return "이름을 입력해 주세요.";
    if (!birthDate.trim()) return "생년월일을 선택해 주세요.";
    if (!birthTimeUnknown && birthTime.trim().length < 4) {
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
        <span className="text-xs text-white/55">이름 (또는 별명)</span>
        <input
          value={partnerName}
          onChange={(e) => setPartnerName(e.target.value)}
          className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white"
          placeholder="예: 민수"
          disabled={busy}
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1">
          <span className="text-xs text-white/55">생년월일</span>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white"
            disabled={busy}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-white/55">출생 시간</span>
          <input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            disabled={busy || birthTimeUnknown}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white disabled:opacity-40"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-xs text-white/55">
        <input
          type="checkbox"
          checked={birthTimeUnknown}
          onChange={(e) => setBirthTimeUnknown(e.target.checked)}
          disabled={busy}
        />
        출생 시간 모름 (12시 기준)
      </label>

      <label className="block space-y-1">
        <span className="text-xs text-white/55">태어난 지역</span>
        <input
          value={birthPlace}
          onChange={(e) => setBirthPlace(e.target.value)}
          disabled={busy || birthPlaceUnknown}
          className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white disabled:opacity-40"
          placeholder="예: 서울, 부산"
        />
      </label>

      <label className="flex items-center gap-2 text-xs text-white/55">
        <input
          type="checkbox"
          checked={birthPlaceUnknown}
          onChange={(e) => setBirthPlaceUnknown(e.target.checked)}
          disabled={busy}
        />
        태어난 지역 모름
      </label>

      <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#67B7FF]">친구 설문</p>
          <div className="flex gap-2">
            <button
              type="button"
              className={segmentBtn(surveyMode === "answer")}
              onClick={() => setSurveyMode("answer")}
              disabled={busy}
            >
              설문하기
            </button>
            <button
              type="button"
              className={segmentBtn(surveyMode === "skip")}
              onClick={() => setSurveyMode("skip")}
              disabled={busy}
            >
              생략하기
            </button>
          </div>
        </div>

        {surveyMode === "answer" ? (
          <>
            <p className="text-[10px] text-white/45">
              {answeredCount}/{SURVEY_V2_QUESTIONS.length} 응답
            </p>
            <div className="max-h-64 space-y-4 overflow-y-auto pr-1">
              {SURVEY_V2_QUESTIONS.map((q) => (
                <fieldset key={q.id} className="space-y-2">
                  <legend className="text-[11px] leading-relaxed text-white/75">
                    {q.prompt.split("\n")[0]}
                  </legend>
                  <div className="space-y-1">
                    {q.options.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex cursor-pointer gap-2 rounded-lg border border-white/8 px-2 py-1.5 text-[11px] text-white/65 has-[:checked]:border-[#67B7FF]/40 has-[:checked]:bg-[#67B7FF]/10"
                      >
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
          <p className="text-[11px] leading-relaxed text-white/45">
            설문 없이 관계를 만들어요. 분석은 중립 프로필 기준으로 진행됩니다.
          </p>
        )}
      </div>

      <div className="flex gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl border border-white/15 py-2.5 text-xs text-white/60"
          >
            취소
          </button>
        ) : null}
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
      </div>
      {!canSubmit && submitHint && !busy ? (
        <p className="text-center text-[10px] text-white/45">{submitHint}</p>
      ) : null}
    </div>
  );
}
