"use client";

import { useMemo } from "react";
import {
  buildISODateFromParts,
} from "@/lib/report/reportBirthUtils";
import {
  convert12hTo24h,
  type AmPm,
} from "@/lib/v2/onboarding/birthTime";
import { convertLunarToSolarDate } from "@/lib/v2/onboarding/lunarCalendar";
import { useLocale } from "@/lib/i18n/LocaleProvider";

function digitsOnly(value: string, max: number) {
  return value.replace(/\D/g, "").slice(0, max);
}

export type CalendarType = "solar" | "lunar";

type Props = {
  year: string;
  month: string;
  day: string;
  onYearChange: (v: string) => void;
  onMonthChange: (v: string) => void;
  onDayChange: (v: string) => void;
  period: AmPm;
  onPeriodChange: (v: AmPm) => void;
  hour: string;
  minute: string;
  onHourChange: (v: string) => void;
  onMinuteChange: (v: string) => void;
  birthTimeUnknown: boolean;
  onBirthTimeUnknownChange: (v: boolean) => void;
  /** ko-KR only — defaults to "solar" when omitted, and the toggle itself only renders for ko-KR. */
  calendarType?: CalendarType;
  onCalendarTypeChange?: (v: CalendarType) => void;
  busy?: boolean;
  theme?: "space" | "stitch";
};

export function useStitchBirthDateTimeState() {
  return {
    year: "",
    month: "",
    day: "",
    period: "am" as AmPm,
    hour: "",
    minute: "",
    birthTimeUnknown: false,
    calendarType: "solar" as CalendarType,
  };
}

/**
 * Builds the ISO birth date, converting from 음력(lunar) to 양력(solar)
 * first when `calendarType === "lunar"` — everything downstream (session,
 * DB, Saju/astrology calculation) only ever sees a solar date. Regular
 * lunar dates only (no leap-month option), per product spec.
 */
export function stitchBirthIsoDate(
  year: string,
  month: string,
  day: string,
  calendarType: CalendarType = "solar",
) {
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
}

export function stitchBirthTime24h(
  period: AmPm,
  hour: string,
  minute: string,
  unknown: boolean,
): string | null {
  if (unknown) return null;
  const h = hour.trim();
  const m = minute.trim();
  // Allow 1-digit minutes ("0"/"5") — same padStart idea as birth date parts.
  if (!h || !m || m.length > 2) return null;
  return convert12hTo24h(period, Number(h), Number(m.padStart(2, "0")));
}

export default function StitchBirthDateTimeFields({
  year,
  month,
  day,
  onYearChange,
  onMonthChange,
  onDayChange,
  period,
  onPeriodChange,
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  birthTimeUnknown,
  onBirthTimeUnknownChange,
  calendarType = "solar",
  onCalendarTypeChange,
  busy,
  theme = "stitch",
}: Props) {
  const isStitch = theme === "stitch";
  const { locale, messages } = useLocale();
  const showCalendarToggle = locale === "ko-KR" && Boolean(onCalendarTypeChange);
  const birthDate = useMemo(
    () => stitchBirthIsoDate(year, month, day, calendarType),
    [year, month, day, calendarType],
  );
  const dateComplete = birthDate.length === 10;
  const timeComplete = Boolean(
    stitchBirthTime24h(period, hour, minute, birthTimeUnknown),
  );

  const fieldClass = isStitch
    ? "w-full rounded-xl border border-outline-variant/50 bg-white px-2 py-3 text-center text-base tabular-nums text-primary outline-none transition focus:border-secondary/50 focus:ring-2 focus:ring-secondary/15 disabled:opacity-40"
    : "w-full rounded-xl border border-white/15 bg-black/30 px-2 py-2.5 text-center text-sm text-white disabled:opacity-40";

  const labelClass = isStitch
    ? "block text-center text-[10px] font-medium text-on-surface-variant"
    : "block text-center text-[10px] text-white/55";

  const sectionTitle = isStitch
    ? "text-xs font-semibold text-primary"
    : "text-xs text-white/55";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className={sectionTitle}>생년월일 (YYYY-MM-DD)</p>
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
                  onClick={() => onCalendarTypeChange?.(v)}
                  className={`min-h-[28px] rounded-full px-3 text-[11px] font-semibold transition disabled:opacity-40 ${
                    calendarType === v
                      ? "bg-secondary text-on-primary"
                      : "text-on-surface-variant"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <label className="space-y-1">
            <span className={labelClass}>연도</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={year}
              onChange={(e) => onYearChange(digitsOnly(e.target.value, 4))}
              placeholder="1990"
              disabled={busy}
              className={fieldClass}
              aria-label="연도 4자리"
            />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>월</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={month}
              onChange={(e) => onMonthChange(digitsOnly(e.target.value, 2))}
              placeholder="01"
              disabled={busy}
              className={fieldClass}
              aria-label="월"
            />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>일</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={day}
              onChange={(e) => onDayChange(digitsOnly(e.target.value, 2))}
              placeholder="15"
              disabled={busy}
              className={fieldClass}
              aria-label="일"
            />
          </label>
        </div>
        {year || month || day ? (
          <p
            className={`text-center text-xs ${isStitch ? "text-on-surface-variant" : "text-white/45"}`}
          >
            {dateComplete
              ? `${birthDate} ✓`
              : "연 4자리 · 월 · 일을 입력해 주세요"}
          </p>
        ) : null}
      </div>

      <div className="space-y-2 border-t border-outline-variant/25 pt-4">
        <p className={sectionTitle}>출생 시간</p>
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
              disabled={busy || birthTimeUnknown}
              onClick={() => onPeriodChange(v)}
              className={`min-h-[48px] rounded-xl border-2 text-sm font-semibold transition disabled:opacity-40 ${
                period === v && !birthTimeUnknown
                  ? isStitch
                    ? "border-secondary bg-secondary/15 text-secondary"
                    : "border-[#67B7FF]/50 bg-[#67B7FF]/15 text-[var(--space-text)]"
                  : isStitch
                    ? "border-outline-variant/45 bg-surface text-on-surface-variant"
                    : "border-white/12 bg-transparent text-white/55"
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
            onChange={(e) => {
              const v = digitsOnly(e.target.value, 2);
              if (v.length === 2 && (Number(v) < 1 || Number(v) > 12)) return;
              onHourChange(v);
              if (birthTimeUnknown) onBirthTimeUnknownChange(false);
            }}
            placeholder="7"
            disabled={busy || birthTimeUnknown}
            aria-label="시"
            className={`${fieldClass} max-w-[5rem]`}
          />
          <span className="text-lg text-on-surface-variant">:</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={minute}
            onChange={(e) => {
              const v = digitsOnly(e.target.value, 2);
              if (v.length === 2 && Number(v) > 59) return;
              onMinuteChange(v);
              if (birthTimeUnknown) onBirthTimeUnknownChange(false);
            }}
            placeholder="30"
            disabled={busy || birthTimeUnknown}
            aria-label="분"
            className={`${fieldClass} max-w-[5rem]`}
          />
        </div>
        {birthTimeUnknown ? (
          <p className="text-center text-xs text-secondary">
            12시 기준으로 계산해요.
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
        <label
          className={`flex min-h-[44px] cursor-pointer items-center gap-2 ${isStitch ? "text-xs text-on-surface-variant" : "text-xs text-white/55"}`}
        >
          <input
            type="checkbox"
            checked={birthTimeUnknown}
            onChange={(e) => {
              onBirthTimeUnknownChange(e.target.checked);
              if (e.target.checked) {
                onHourChange("");
                onMinuteChange("");
              }
            }}
            disabled={busy}
          />
          입력 건너뛰기 · 출생 시간 모름
        </label>
      </div>
    </div>
  );
}
