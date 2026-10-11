"use client";

import { useId, useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  KOREAN_REGIONS,
  GLOBAL_CITIES,
  type SupportedPlaceOption,
} from "@/lib/report/resolveAstrologyCoordinates";

export type BirthPlaceSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  theme?: "space" | "stitch";
  required?: boolean;
};

export default function BirthPlaceSelector({
  value,
  onChange,
  disabled = false,
  className,
  theme = "stitch",
}: BirthPlaceSelectorProps) {
  const { locale, messages } = useLocale();
  const isKorean = locale === "ko-KR";
  const isStitch = theme === "stitch";
  const id = useId();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Filter global cities based on query
  const filteredGlobalCities = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOBAL_CITIES;
    return GLOBAL_CITIES.filter(
      (c) =>
        c.labelEn.toLowerCase().includes(q) ||
        c.labelKo.toLowerCase().includes(q) ||
        c.value.toLowerCase().includes(q),
    );
  }, [query]);

  const baseSelectClass = isStitch
    ? "w-full rounded-2xl border border-outline-variant/60 bg-white px-3 py-3.5 text-center text-base text-on-surface outline-none transition focus:border-primary/45 focus:ring-2 focus:ring-primary/15 disabled:opacity-40"
    : "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-center text-sm text-white disabled:opacity-40";

  // Korean locale: Dropdown (Select) with 17 metropolitan cities / provinces
  if (isKorean) {
    return (
      <div className="w-full">
        <select
          id={id}
          value={value || ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={className ?? baseSelectClass}
          aria-label={messages.birthForm.placeLabel}
        >
          <option value="" disabled>
            {messages.birthForm.placeSelectPrompt}
          </option>
          {KOREAN_REGIONS.map((region) => (
            <option key={region.value} value={region.value}>
              {region.labelKo}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Global (EN) locale: City Search / Autocomplete Component
  const handleSelectCity = (city: SupportedPlaceOption) => {
    onChange(city.value);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          id={id}
          type="text"
          value={isOpen ? query : value}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setIsOpen(true);
          }}
          placeholder={value || messages.birthForm.placeSearchPrompt}
          disabled={disabled}
          autoComplete="off"
          className={className ?? baseSelectClass}
          aria-label={messages.birthForm.placeLabel}
        />
        {value && !isOpen ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange("");
              setQuery("");
              setIsOpen(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant hover:text-primary"
            aria-label="Clear location"
          >
            ✕
          </button>
        ) : null}
      </div>

      {isOpen && !disabled ? (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className={`absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border shadow-lg ${
              isStitch
                ? "border-outline-variant/60 bg-white text-on-surface"
                : "border-white/20 bg-neutral-900 text-white"
            }`}
            role="listbox"
          >
            {filteredGlobalCities.length > 0 ? (
              filteredGlobalCities.map((city) => (
                <button
                  key={city.value}
                  type="button"
                  role="option"
                  aria-selected={value === city.value}
                  onClick={() => handleSelectCity(city)}
                  className={`w-full px-4 py-2.5 text-left text-sm transition ${
                    isStitch
                      ? "hover:bg-surface-container-low"
                      : "hover:bg-white/10"
                  } ${value === city.value ? "font-semibold text-primary" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span>{city.labelEn}</span>
                    <span className="text-xs opacity-60">UTC{city.timezone >= 0 ? `+${city.timezone}` : city.timezone}</span>
                  </div>
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-center text-xs opacity-60">
                {messages.birthForm.placeSearchNoResults}
              </p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
