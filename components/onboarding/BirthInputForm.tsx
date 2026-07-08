"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/space/GlassCard";
import GlowButton from "@/components/space/GlowButton";
import {
  buildISODateFromParts,
  parseBirthDateParts,
} from "@/lib/report/reportBirthUtils";
import {
  convert12hTo24h,
  parse24hTo12h,
  type AmPm,
} from "@/lib/v2/onboarding/birthTime";

type Step = "date" | "time";

export type BirthFormSubmitPayload = {
  birthDate: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  birthPlace: string | null;
};

function focusRef(ref: RefObject<HTMLInputElement | null>) {
  window.requestAnimationFrame(() => ref.current?.focus());
}

function digitsOnly(value: string, max: number) {
  return value.replace(/\D/g, "").slice(0, max);
}

export default function BirthInputForm({
  initialBirthDate,
  initialBirthTime,
  initialBirthTimeUnknown,
  initialBirthPlace,
  busy,
  lockBirthDate = false,
  birthDateLockReason,
  submitLabel = "다음",
  onSubmit,
}: {
  initialBirthDate?: string | null;
  initialBirthTime?: string | null;
  initialBirthTimeUnknown?: boolean;
  initialBirthPlace?: string | null;
  busy?: boolean;
  lockBirthDate?: boolean;
  birthDateLockReason?: string;
  submitLabel?: string;
  onSubmit: (payload: BirthFormSubmitPayload) => void;
}) {
  const parsed = parseBirthDateParts(initialBirthDate ?? null);
  const parsedTime =
    !initialBirthTimeUnknown && initialBirthTime
      ? parse24hTo12h(initialBirthTime)
      : null;

  const [step, setStep] = useState<Step>(
    lockBirthDate && parsed.y && parsed.mo && parsed.d ? "time" : "date",
  );
  const [year, setYear] = useState(parsed.y);
  const [month, setMonth] = useState(parsed.mo);
  const [day, setDay] = useState(parsed.d);
  const [period, setPeriod] = useState<AmPm>(parsedTime?.period ?? "am");
  const [hour, setHour] = useState(parsedTime?.hour ?? "");
  const [minute, setMinute] = useState(parsedTime?.minute ?? "");
  const [birthPlace, setBirthPlace] = useState(initialBirthPlace?.trim() ?? "");

  const yearRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const hourRef = useRef<HTMLInputElement>(null);
  const minuteRef = useRef<HTMLInputElement>(null);

  const birthDate = useMemo(
    () => buildISODateFromParts(year, month, day),
    [year, month, day],
  );

  const birthTime = useMemo(() => {
    const h = Number(hour);
    const m = Number(minute);
    if (!hour || minute.length < 2) return "";
    return convert12hTo24h(period, h, m) ?? "";
  }, [period, hour, minute]);

  const dateComplete = birthDate.length === 10;
  const timeComplete = birthTime.length === 5;
  const placeComplete = birthPlace.trim().length >= 1;

  useEffect(() => {
    if (step === "date") focusRef(yearRef);
    if (step === "time") focusRef(hourRef);
  }, [step]);

  useEffect(() => {
    if (lockBirthDate) return;
    if (step !== "date" || !dateComplete || busy) return;
    const t = window.setTimeout(() => setStep("time"), 220);
    return () => window.clearTimeout(t);
  }, [step, dateComplete, busy]);

  const submitWithTime = useCallback(() => {
    if (!dateComplete || !timeComplete || !placeComplete) return;
    onSubmit({
      birthDate,
      birthTime,
      birthTimeUnknown: false,
      birthPlace: birthPlace.trim(),
    });
  }, [
    birthDate,
    birthPlace,
    birthTime,
    dateComplete,
    onSubmit,
    placeComplete,
    timeComplete,
  ]);

  const submitUnknownTime = useCallback(() => {
    if (!dateComplete || !placeComplete || busy) return;
    onSubmit({
      birthDate,
      birthTime: null,
      birthTimeUnknown: true,
      birthPlace: birthPlace.trim(),
    });
  }, [birthDate, birthPlace, busy, dateComplete, onSubmit, placeComplete]);

  // 시간 입력 후 자동 제출 대신 '다음' 버튼으로 출생지 입력 기회 제공

  const handleYear = (raw: string) => {
    const v = digitsOnly(raw, 4);
    setYear(v);
    if (v.length === 4) focusRef(monthRef);
  };

  const handleMonth = (raw: string) => {
    const v = digitsOnly(raw, 2);
    setMonth(v);
    if (v.length === 2) focusRef(dayRef);
    else if (v.length === 1 && Number(v) > 1) focusRef(dayRef);
  };

  const handleDay = (raw: string) => {
    const v = digitsOnly(raw, 2);
    setDay(v);
  };

  const handleHour = (raw: string) => {
    const v = digitsOnly(raw, 2);
    if (v.length === 2 && (Number(v) < 1 || Number(v) > 12)) return;
    if (v.length === 1 && Number(v) > 1) {
      setHour(v);
      focusRef(minuteRef);
      return;
    }
    setHour(v);
    if (v.length === 2) focusRef(minuteRef);
  };

  const handleMinute = (raw: string) => {
    const v = digitsOnly(raw, 2);
    if (v.length === 2 && Number(v) > 59) return;
    setMinute(v);
  };

  const goPrev = useCallback(() => {
    if (step === "time") setStep("date");
  }, [step]);

  const inputClass =
    "w-full rounded-2xl border border-white/18 bg-[#0d121f] px-3 py-3.5 text-center text-lg tabular-nums text-[rgba(255,255,255,0.96)] outline-none transition focus:border-[#67B7FF]/55 focus:ring-2 focus:ring-[#67B7FF]/35";

  return (
    <div className="w-full max-w-[420px] space-y-6">
      <div className="text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#67B7FF]">
          Birth coordinates
        </p>
        <h1 className="mt-2 text-balance text-lg font-medium leading-snug text-[rgba(255,255,255,0.95)]">
          {step === "date"
            ? "태어난 날을 알려주세요"
            : "태어난 시간을 알려주세요"}
        </h1>
        <p className="mt-2 text-sm text-[rgba(255,255,255,0.55)]">
          {step === "date"
            ? "숫자만 입력해도 다음 칸으로 넘어가요."
            : "오전·오후와 시·분, 태어난 지역을 입력해 주세요. (점성 차트에 필요해요)"}
        </p>
      </div>

      <GlassCard className="!border-white/[0.12] !py-8 !shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <AnimatePresence mode="wait">
          {step === "date" ? (
            <motion.div
              key="date"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {lockBirthDate && dateComplete ? (
                <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs text-white/70">
                  🔒 {birthDate} ·{" "}
                  {birthDateLockReason ?? "생년월일은 잠금 상태입니다."}
                </p>
              ) : null}
              <div className="grid grid-cols-3 gap-2.5">
                <label className="space-y-1.5">
                  <span className="block text-center text-[10px] text-white/50">
                    연도
                  </span>
                  <input
                    ref={yearRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="bday-year"
                    maxLength={4}
                    value={year}
                    onChange={(e) => handleYear(e.target.value)}
                    placeholder="1990"
                    disabled={busy || lockBirthDate}
                    className={inputClass}
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="block text-center text-[10px] text-white/50">
                    월
                  </span>
                  <input
                    ref={monthRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="bday-month"
                    maxLength={2}
                    value={month}
                    onChange={(e) => handleMonth(e.target.value)}
                    placeholder="01"
                    disabled={busy || lockBirthDate}
                    className={inputClass}
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="block text-center text-[10px] text-white/50">
                    일
                  </span>
                  <input
                    ref={dayRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="bday-day"
                    maxLength={2}
                    value={day}
                    onChange={(e) => handleDay(e.target.value)}
                    placeholder="15"
                    disabled={busy || lockBirthDate}
                    className={inputClass}
                  />
                </label>
              </div>
              {year || month || day ? (
                <p className="text-center text-xs text-[rgba(255,255,255,0.45)]">
                  {dateComplete
                    ? `${birthDate} — 확인됐어요`
                    : "연·월·일을 모두 입력해 주세요"}
                </p>
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              key="time"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div
                className="grid grid-cols-2 gap-2"
                role="group"
                aria-label="오전 또는 오후"
              >
                {(
                  [
                    { v: "am" as const, label: "오전" },
                    { v: "pm" as const, label: "오후" },
                  ] as const
                ).map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setPeriod(v);
                      focusRef(hourRef);
                    }}
                    className={`min-h-[48px] rounded-2xl border-2 text-sm font-semibold transition disabled:opacity-50 ${
                      period === v
                        ? "border-[#67B7FF]/70 bg-[#67B7FF]/18 text-white shadow-[0_0_28px_rgba(103,183,255,0.28)]"
                        : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.92)] hover:border-[#67B7FF]/35"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2">
                <input
                  ref={hourRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={hour}
                  onChange={(e) => handleHour(e.target.value)}
                  placeholder="7"
                  disabled={busy}
                  aria-label="시"
                  className={`${inputClass} max-w-[5.5rem]`}
                />
                <span className="text-xl font-light text-white/40">:</span>
                <input
                  ref={minuteRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={minute}
                  onChange={(e) => handleMinute(e.target.value)}
                  placeholder="30"
                  disabled={busy}
                  aria-label="분"
                  className={`${inputClass} max-w-[5.5rem]`}
                />
              </div>

              {timeComplete ? (
                <p className="text-center text-xs text-[#67B7FF]/90">
                  {period === "am" ? "오전" : "오후"} {hour}:{minute} — 확인됐어요
                </p>
              ) : (
                <p className="text-center text-xs text-[rgba(255,255,255,0.45)]">
                  1~12시 · 00~59분
                </p>
              )}

              <label className="block space-y-1.5">
                <span className="block text-center text-[10px] text-white/50">
                  태어난 지역 <span className="text-[#67B7FF]">*</span>
                </span>
                <input
                  type="text"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="예: 서울, 부산, 제주"
                  disabled={busy}
                  autoComplete="address-level2"
                  className={`${inputClass} text-base`}
                />
                <p className="text-center text-[10px] text-white/40">
                  점성 해석에 필요해요. 사주(기질)는 지역과 무관해요.
                </p>
                {!placeComplete && (timeComplete || hour || minute) ? (
                  <p className="text-center text-[10px] text-amber-200/90">
                    태어난 지역을 입력해 주세요.
                  </p>
                ) : null}
              </label>

              <div className="space-y-2 border-t border-white/10 pt-4">
                <button
                  type="button"
                  disabled={busy || !placeComplete}
                  onClick={submitUnknownTime}
                  className="w-full rounded-2xl border-2 border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-3.5 text-sm font-medium text-[rgba(255,255,255,0.88)] transition hover:border-[#67B7FF]/35 disabled:opacity-50"
                >
                  출생 시간 모름 (지역은 입력됨)
                </button>
                <p className="rounded-xl border border-[#67B7FF]/20 bg-[#67B7FF]/8 px-3 py-2.5 text-center text-xs leading-relaxed text-[rgba(200,230,255,0.92)]">
                  <span className="font-medium text-[#8ecfff]">참고로,</span>{" "}
                  출생 시간을 모르면 12시 기준으로 계산하고, 시주·점성
                  라이징은 참고 수준이에요. 시간과 지역을 알면 더 정확해요.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      <div className="flex items-center justify-between gap-3 px-1">
        {step === "time" && !lockBirthDate ? (
          <button
            type="button"
            onClick={goPrev}
            disabled={busy}
            className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-5 py-3 text-sm font-medium text-[rgba(255,255,255,0.75)] transition hover:text-white disabled:opacity-40"
          >
            ← 이전
          </button>
        ) : (
          <span />
        )}
        {step === "time" && timeComplete && placeComplete ? (
          <GlowButton
            type="button"
            variant="primary"
            className="min-w-[8rem]"
            disabled={busy}
            onClick={submitWithTime}
          >
            {busy ? "저장 중…" : submitLabel}
          </GlowButton>
        ) : null}
      </div>
    </div>
  );
}
