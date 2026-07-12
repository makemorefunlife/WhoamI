"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildISODateFromParts,
  parseBirthDateParts,
} from "@/lib/report/reportBirthUtils";
import {
  convert12hTo24h,
  parse24hTo12h,
  type AmPm,
} from "@/lib/v2/onboarding/birthTime";

export type AccountBirthEditPayload = {
  birthDate?: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  birthPlace: string;
};

function digitsOnly(value: string, max: number) {
  return value.replace(/\D/g, "").slice(0, max);
}

export default function AccountBirthEditForm({
  initialBirthDate,
  initialBirthTime,
  initialBirthTimeUnknown,
  initialBirthPlace,
  allowBirthDateEdit = false,
  busy,
  onSubmit,
}: {
  initialBirthDate?: string | null;
  initialBirthTime?: string | null;
  initialBirthTimeUnknown?: boolean;
  initialBirthPlace?: string | null;
  allowBirthDateEdit?: boolean;
  busy?: boolean;
  onSubmit: (payload: AccountBirthEditPayload) => void;
}) {
  const parsedDate = parseBirthDateParts(initialBirthDate ?? null);
  const parsedTime =
    !initialBirthTimeUnknown && initialBirthTime
      ? parse24hTo12h(initialBirthTime)
      : null;

  const [year, setYear] = useState(parsedDate.y);
  const [month, setMonth] = useState(parsedDate.mo);
  const [day, setDay] = useState(parsedDate.d);
  const [period, setPeriod] = useState<AmPm>(parsedTime?.period ?? "am");
  const [hour, setHour] = useState(parsedTime?.hour ?? "");
  const [minute, setMinute] = useState(parsedTime?.minute ?? "");
  const [birthPlace, setBirthPlace] = useState(initialBirthPlace?.trim() ?? "");
  const hourRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const nextDate = parseBirthDateParts(initialBirthDate ?? null);
    const nextTime =
      !initialBirthTimeUnknown && initialBirthTime
        ? parse24hTo12h(initialBirthTime)
        : null;
    setYear(nextDate.y);
    setMonth(nextDate.mo);
    setDay(nextDate.d);
    setPeriod(nextTime?.period ?? "am");
    setHour(nextTime?.hour ?? "");
    setMinute(nextTime?.minute ?? "");
    setBirthPlace(initialBirthPlace?.trim() ?? "");
  }, [
    initialBirthDate,
    initialBirthPlace,
    initialBirthTime,
    initialBirthTimeUnknown,
  ]);

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
  const dateChanged =
    allowBirthDateEdit &&
    Boolean(initialBirthDate?.trim()) &&
    birthDate !== initialBirthDate?.trim();

  const buildPayload = useCallback(
    (timeUnknown: boolean, time: string | null): AccountBirthEditPayload => ({
      ...(allowBirthDateEdit && dateComplete ? { birthDate } : {}),
      birthTime: timeUnknown ? null : time,
      birthTimeUnknown: timeUnknown,
      birthPlace: birthPlace.trim(),
    }),
    [allowBirthDateEdit, birthDate, birthPlace, dateComplete],
  );

  const submitWithTime = useCallback(() => {
    if (!dateComplete || !timeComplete || !placeComplete || busy) return;
    onSubmit(buildPayload(false, birthTime));
  }, [
    birthTime,
    buildPayload,
    busy,
    dateComplete,
    onSubmit,
    placeComplete,
    timeComplete,
  ]);

  const submitUnknownTime = useCallback(() => {
    if (!dateComplete || !placeComplete || busy) return;
    onSubmit(buildPayload(true, null));
  }, [buildPayload, busy, dateComplete, onSubmit, placeComplete]);

  const inputClass =
    "w-full rounded-2xl border border-outline-variant/35 bg-surface-container-lowest px-3 py-3.5 text-center text-lg tabular-nums text-on-surface outline-none transition focus:border-secondary/50 focus:ring-2 focus:ring-secondary/20";

  const saveLabel = allowBirthDateEdit
    ? dateChanged
      ? "생년월일 포함 저장 (1회 수정)"
      : "출생 정보 저장"
    : "출생 시간·지역 저장";

  return (
    <div className="space-y-5">
      {allowBirthDateEdit ? (
        <div className="space-y-3 rounded-2xl border border-accent-rose/25 bg-accent-rose-soft/60 p-4">
          <p className="text-center text-xs leading-relaxed text-primary">
            생년월일은 <strong>이번 한 번만</strong> 바꿀 수 있어요. 저장하면
            이후에는 고객센터로만 변경할 수 있습니다.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <label className="space-y-1">
              <span className="block text-center text-[10px] text-on-surface-variant">
                연도
              </span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={year}
                onChange={(e) => setYear(digitsOnly(e.target.value, 4))}
                placeholder="1990"
                disabled={busy}
                className={inputClass}
              />
            </label>
            <label className="space-y-1">
              <span className="block text-center text-[10px] text-on-surface-variant">
                월
              </span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={month}
                onChange={(e) => setMonth(digitsOnly(e.target.value, 2))}
                placeholder="01"
                disabled={busy}
                className={inputClass}
              />
            </label>
            <label className="space-y-1">
              <span className="block text-center text-[10px] text-on-surface-variant">
                일
              </span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={day}
                onChange={(e) => setDay(digitsOnly(e.target.value, 2))}
                placeholder="15"
                disabled={busy}
                className={inputClass}
              />
            </label>
          </div>
          {dateComplete ? (
            <p className="text-center text-xs text-secondary">
              {birthDate}
              {dateChanged ? " — 변경됨" : ""}
            </p>
          ) : (
            <p className="text-center text-xs text-on-surface-variant">
              연·월·일을 모두 입력해 주세요.
            </p>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2" role="group" aria-label="오전 또는 오후">
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
              hourRef.current?.focus();
            }}
            className={`min-h-[48px] rounded-2xl border-2 text-sm font-semibold transition disabled:opacity-50 ${
              period === v
                ? "border-secondary/60 bg-secondary/12 text-primary"
                : "border-outline-variant/30 bg-surface-container-low/50 text-on-surface-variant hover:border-secondary/35"
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
          onChange={(e) => {
            const v = digitsOnly(e.target.value, 2);
            if (v.length === 2 && (Number(v) < 1 || Number(v) > 12)) return;
            setHour(v);
          }}
          placeholder="7"
          disabled={busy}
          aria-label="시"
          className={`${inputClass} max-w-[5.5rem]`}
        />
        <span className="text-xl font-light text-on-surface-variant">:</span>
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={minute}
          onChange={(e) => {
            const v = digitsOnly(e.target.value, 2);
            if (v.length === 2 && Number(v) > 59) return;
            setMinute(v);
          }}
          placeholder="30"
          disabled={busy}
          aria-label="분"
          className={`${inputClass} max-w-[5.5rem]`}
        />
      </div>

      <label className="block space-y-1.5">
        <span className="block text-center text-xs font-medium text-on-surface-variant">
          태어난 지역 <span className="text-secondary">*</span>
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
        <p className="text-center text-[11px] text-on-surface-variant/80">
          점성 차트에 사용돼요. 사주(본질)는 지역과 무관해요.
        </p>
      </label>

      <div className="space-y-2 border-t border-outline-variant/25 pt-4">
        <button
          type="button"
          disabled={busy || !dateComplete || !placeComplete}
          onClick={submitUnknownTime}
          className="stitch-cta-secondary w-full disabled:opacity-50"
        >
          출생 시간 모름 (지역만 저장)
        </button>
        <button
          type="button"
          disabled={busy || !dateComplete || !placeComplete || !timeComplete}
          onClick={submitWithTime}
          className="stitch-cta-primary w-full disabled:opacity-50"
        >
          {busy ? "저장 중…" : saveLabel}
        </button>
      </div>
    </div>
  );
}
