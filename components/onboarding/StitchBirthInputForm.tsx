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
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { convertLunarToSolarDate } from "@/lib/v2/onboarding/lunarCalendar";
import type { CalendarType } from "@/components/onboarding/StitchBirthDateTimeFields";

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
  const { messages, locale } = useLocale();
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
  const [calendarType, setCalendarType] = useState<CalendarType>("solar");
  const [birthPlace, setBirthPlace] = useState(initialBirthPlace?.trim() ?? "");
  const [birthPlaceUnknown, setBirthPlaceUnknown] = useState(
    initialBirthPlaceUnknown === true,
  );
  const showCalendarToggle = locale === "ko-KR";

  const birthDate = useMemo(() => {
    if (calendarType !== "lunar") {
      return buildISODateFromParts(year, month, day);
    }
    const y = Number.parseInt(year, 10);
    const mo = Number.parseInt(month, 10);
    const d = Number.parseInt(day, 10);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
      return "";
    }
    const solar = convertLunarToSolarDate(y, mo, d);
    if (!solar) return "";
    return buildISODateFromParts(
      String(solar.year),
      String(solar.month).padStart(2, "0"),
      String(solar.day).padStart(2, "0"),
    );
  }, [year, month, day, calendarType]);

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
    "w-full rounded-2xl border border-outline-variant/60 bg-white px-3 py-3.5 text-center text-lg tabular-nums text-on-surface outline-none transition focus:border-primary/45 focus:ring-2 focus:ring-primary/15";

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
          {messages.birthForm.heading}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          {messages.birthForm.subtitle}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="stitch-hero-panel space-y-6 rounded-extra-large p-6 sm:p-8"
      >
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Date of birth
            </p>
            {showCalendarToggle ? (
              <div
                className="flex gap-1 rounded-full bg-surface-container-low/80 p-0.5"
                role="radiogroup"
                aria-label={messages.relationshipForm.calendarTypeLabel}
              >
                {(
                  [
                    { v: "solar" as const, label: messages.relationshipForm.calendarTypeSolar },
                    { v: "lunar" as const, label: messages.relationshipForm.calendarTypeLunar },
                  ] as const
                ).map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={calendarType === v}
                    disabled={busy}
                    onClick={() => setCalendarType(v)}
                    className={`min-h-[28px] rounded-full px-3 text-[11px] font-semibold transition disabled:opacity-40 ${
                      calendarType === v
                        ? "bg-primary text-on-primary"
                        : "text-on-surface-variant"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
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
                ? messages.birthForm.dateConfirmed(birthDate)
                : messages.birthForm.dateIncomplete}
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
              {messages.birthForm.timeUnknownNotice}
            </p>
          ) : timeComplete ? (
            <p className="text-center text-xs text-secondary">
              {period === "am" ? messages.birthForm.amLabel : messages.birthForm.pmLabel} {hour}:{minute}
            </p>
          ) : (
            <p className="text-center text-xs text-on-surface-variant">
              {messages.birthForm.timeRangeHint}
            </p>
          )}
          <button
            type="button"
            disabled={busy || birthTimeUnknown}
            onClick={skipTime}
            className="w-full rounded-2xl border border-outline-variant/60 bg-surface px-4 py-3 text-sm font-medium text-on-surface transition hover:border-primary/35 disabled:opacity-50"
          >
            {messages.birthForm.skipTime}
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
            placeholder={messages.birthForm.placePlaceholder}
            disabled={busy || birthPlaceUnknown}
            autoComplete="address-level2"
            className={`${inputClass} text-base disabled:opacity-40`}
          />
          {birthPlaceUnknown ? (
            <p className="rounded-xl border border-secondary/25 bg-secondary/8 px-3 py-2.5 text-xs leading-relaxed text-on-surface-variant">
              <span className="font-medium text-primary">
                {messages.birthForm.placeUnknownNoticeLabel}
              </span>{" "}
              {messages.birthForm.placeUnknownNoticeBody}
            </p>
          ) : !placeComplete && dateComplete ? (
            <p className="text-center text-[10px] text-on-surface-variant">
              {messages.birthForm.placeNeededHint}
            </p>
          ) : null}
          {birthPlaceUnknown ? (
            <button
              type="button"
              disabled={busy}
              onClick={enablePlaceInput}
              className="w-full rounded-2xl border border-outline-variant/60 px-4 py-3 text-sm font-medium text-primary transition hover:border-primary/35"
            >
              {messages.birthForm.enterPlaceManually}
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={skipPlace}
              className="w-full rounded-2xl border border-outline-variant/60 bg-surface px-4 py-3 text-sm font-medium text-on-surface transition hover:border-primary/35"
            >
              {messages.birthForm.skipPlace}
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
