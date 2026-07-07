"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  buildISODateFromParts,
  parseBirthDateParts,
} from "@/lib/report/reportBirthUtils";
import {
  convert12hTo24h,
  parse24hTo12h,
  type AmPm,
} from "@/lib/v2/onboarding/birthTime";

export type StitchBirthFormState = {
  birthDate: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  birthPlace: string | null;
  birthPlaceUnknown: boolean;
};


function digitsOnly(value: string, max: number) {
  return value.replace(/\D/g, "").slice(0, max);
}

export default function StitchBirthInputForm({
  initialBirthDate,
  initialBirthTime,
  initialBirthTimeUnknown,
  initialBirthPlace,
  initialBirthPlaceUnknown,
  busy,
  onChange,
}: {
  initialBirthDate?: string | null;
  initialBirthTime?: string | null;
  initialBirthTimeUnknown?: boolean;
  initialBirthPlace?: string | null;
  initialBirthPlaceUnknown?: boolean;
  busy?: boolean;
  onChange: (state: StitchBirthFormState) => void;
}) {
  const parsed = parseBirthDateParts(initialBirthDate ?? null);
  const parsedTime =
    !initialBirthTimeUnknown && initialBirthTime
      ? parse24hTo12h(initialBirthTime)
      : null;

  const [year, setYear] = useState(parsed.y);
  const [month, setMonth] = useState(parsed.mo);
  const [day, setDay] = useState(parsed.d);
  const [period, setPeriod] = useState<AmPm>(parsedTime?.period ?? "am");
  const [hour, setHour] = useState(parsedTime?.hour ?? "");
  const [minute, setMinute] = useState(parsedTime?.minute ?? "");
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(
    initialBirthTimeUnknown === true,
  );
  const [birthPlace, setBirthPlace] = useState(initialBirthPlace?.trim() ?? "");
  const [birthPlaceUnknown, setBirthPlaceUnknown] = useState(
    initialBirthPlaceUnknown === true,
  );

  const birthDate = useMemo(
    () => buildISODateFromParts(year, month, day),
    [year, month, day],
  );

  const birthTime = useMemo(() => {
    if (birthTimeUnknown) return null;
    const h = Number(hour);
    const m = Number(minute);
    if (!hour || minute.length < 2) return null;
    return convert12hTo24h(period, h, m) ?? null;
  }, [birthTimeUnknown, period, hour, minute]);

  const emit = useCallback(
    (patch: Partial<StitchBirthFormState>) => {
      const next: StitchBirthFormState = {
        birthDate,
        birthTime,
        birthTimeUnknown,
        birthPlace: birthPlaceUnknown ? null : birthPlace.trim() || null,
        birthPlaceUnknown,
        ...patch,
      };
      onChange(next);
    },
    [
      birthDate,
      birthPlace,
      birthPlaceUnknown,
      birthTime,
      birthTimeUnknown,
      onChange,
    ],
  );

  useEffect(() => {
    emit({});
  }, [emit]);

  const dateComplete = birthDate.length === 10;
  const timeComplete = Boolean(birthTime);
  const placeComplete = birthPlaceUnknown || birthPlace.trim().length >= 1;

  const inputClass =
    "w-full rounded-2xl border border-outline-variant/60 bg-surface-container-low px-3 py-3.5 text-center text-lg tabular-nums text-on-surface outline-none transition focus:border-primary/45 focus:ring-2 focus:ring-primary/15";

  const handleYear = (raw: string) => {
    const v = digitsOnly(raw, 4);
    setYear(v);
  };

  const handleMonth = (raw: string) => {
    const v = digitsOnly(raw, 2);
    setMonth(v);
  };

  const handleDay = (raw: string) => {
    const v = digitsOnly(raw, 2);
    setDay(v);
  };

  const handleHour = (raw: string) => {
    const v = digitsOnly(raw, 2);
    if (v.length === 2 && (Number(v) < 1 || Number(v) > 12)) return;
    setHour(v);
    if (birthTimeUnknown) setBirthTimeUnknown(false);
  };

  const handleMinute = (raw: string) => {
    const v = digitsOnly(raw, 2);
    if (v.length === 2 && Number(v) > 59) return;
    setMinute(v);
    if (birthTimeUnknown) setBirthTimeUnknown(false);
  };

  const skipTime = () => {
    setBirthTimeUnknown(true);
    setHour("");
    setMinute("");
    emit({ birthTime: null, birthTimeUnknown: true });
  };

  const skipPlace = () => {
    setBirthPlaceUnknown(true);
    setBirthPlace("");
    emit({ birthPlace: null, birthPlaceUnknown: true });
  };

  const enablePlaceInput = () => {
    setBirthPlaceUnknown(false);
    emit({ birthPlaceUnknown: false });
  };

  return (
    <div className="w-full max-w-[420px] space-y-6">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
          Birth details
        </p>
        <h2 className="stitch-headline mt-2 text-balance text-xl leading-snug">
          생년월일시 · 태어난 장소
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          사주와 점성 해석에 사용돼요. 모르는 항목은 건너뛸 수 있어요.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="stitch-hero-panel space-y-6 rounded-extra-large p-6 sm:p-8"
      >
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Date of birth
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            <label className="space-y-1.5">
              <span className="block text-center text-[10px] text-on-surface-variant">
                Year
              </span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="bday-year"
                maxLength={4}
                value={year}
                onChange={(e) => handleYear(e.target.value)}
                placeholder="1990"
                disabled={busy}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5">
              <span className="block text-center text-[10px] text-on-surface-variant">
                Month
              </span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="bday-month"
                maxLength={2}
                value={month}
                onChange={(e) => handleMonth(e.target.value)}
                placeholder="01"
                disabled={busy}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5">
              <span className="block text-center text-[10px] text-on-surface-variant">
                Day
              </span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="bday-day"
                maxLength={2}
                value={day}
                onChange={(e) => handleDay(e.target.value)}
                placeholder="15"
                disabled={busy}
                className={inputClass}
              />
            </label>
          </div>
          {year || month || day ? (
            <p className="text-center text-xs text-on-surface-variant">
              {dateComplete
                ? `${birthDate} — 확인됐어요`
                : "연·월·일을 모두 입력해 주세요"}
            </p>
          ) : null}
        </section>

        <section className="space-y-3 border-t border-outline-variant/35 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Time of birth
          </p>
          <div
            className="grid grid-cols-2 gap-2"
            role="group"
            aria-label="AM or PM"
          >
            {(
              [
                { v: "am" as const, label: "AM" },
                { v: "pm" as const, label: "PM" },
              ] as const
            ).map(({ v, label }) => (
              <button
                key={v}
                type="button"
                disabled={busy || birthTimeUnknown}
                onClick={() => setPeriod(v)}
                className={`min-h-[44px] rounded-2xl border-2 text-sm font-semibold transition disabled:opacity-40 ${
                  period === v && !birthTimeUnknown
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-outline-variant/50 bg-surface text-on-surface hover:border-primary/35"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={hour}
              onChange={(e) => handleHour(e.target.value)}
              placeholder="7"
              disabled={busy || birthTimeUnknown}
              aria-label="Hour"
              className={`${inputClass} max-w-[5.5rem] disabled:opacity-40`}
            />
            <span className="text-xl font-light text-on-surface-variant">:</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={minute}
              onChange={(e) => handleMinute(e.target.value)}
              placeholder="30"
              disabled={busy || birthTimeUnknown}
              aria-label="Minute"
              className={`${inputClass} max-w-[5.5rem] disabled:opacity-40`}
            />
          </div>
          {birthTimeUnknown ? (
            <p className="text-center text-xs text-secondary">
              출생 시간 모름 — 12시 기준으로 계산해요.
            </p>
          ) : timeComplete ? (
            <p className="text-center text-xs text-secondary">
              {period === "am" ? "오전" : "오후"} {hour}:{minute}
            </p>
          ) : (
            <p className="text-center text-xs text-on-surface-variant">
              1–12시 · 00–59분
            </p>
          )}
          <button
            type="button"
            disabled={busy || birthTimeUnknown}
            onClick={skipTime}
            className="w-full rounded-2xl border border-outline-variant/60 bg-surface px-4 py-3 text-sm font-medium text-on-surface transition hover:border-primary/35 disabled:opacity-50"
          >
            시간 모름 / 입력 안 함
          </button>
        </section>

        <section className="space-y-3 border-t border-outline-variant/35 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Place of birth
          </p>
          <input
            type="text"
            value={birthPlace}
            onChange={(e) => {
              setBirthPlace(e.target.value);
              if (birthPlaceUnknown) setBirthPlaceUnknown(false);
            }}
            placeholder="예: 서울, 부산, Tokyo"
            disabled={busy || birthPlaceUnknown}
            autoComplete="address-level2"
            className={`${inputClass} text-base disabled:opacity-40`}
          />
          {birthPlaceUnknown ? (
            <p className="rounded-xl border border-secondary/25 bg-secondary/8 px-3 py-2.5 text-xs leading-relaxed text-on-surface-variant">
              <span className="font-medium text-primary">안내:</span> 장소를
              모르면 해석 정확도가 떨어질 수 있어요. 가능하면 현재 위치를
              중심으로 대략 계산합니다.
            </p>
          ) : !placeComplete && dateComplete ? (
            <p className="text-center text-[10px] text-on-surface-variant">
              점성 차트에 필요해요. 사주(기질)는 지역과 무관해요.
            </p>
          ) : null}
          {birthPlaceUnknown ? (
            <button
              type="button"
              disabled={busy}
              onClick={enablePlaceInput}
              className="w-full rounded-2xl border border-outline-variant/60 px-4 py-3 text-sm font-medium text-primary transition hover:border-primary/35"
            >
              장소 직접 입력하기
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={skipPlace}
              className="w-full rounded-2xl border border-outline-variant/60 bg-surface px-4 py-3 text-sm font-medium text-on-surface transition hover:border-primary/35"
            >
              장소 입력 안 함
            </button>
          )}
        </section>
      </motion.div>
    </div>
  );
}

export function isStitchBirthFormReady(state: StitchBirthFormState): boolean {
  const dateOk = state.birthDate.length === 10;
  const timeOk = state.birthTimeUnknown || Boolean(state.birthTime);
  const placeOk =
    state.birthPlaceUnknown || Boolean(state.birthPlace?.trim());
  return dateOk && timeOk && placeOk;
}
