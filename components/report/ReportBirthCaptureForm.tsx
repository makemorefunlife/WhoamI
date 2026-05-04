import type { Dispatch, SetStateAction } from "react";
import GlowButton from "@/components/space/GlowButton";

export default function ReportBirthCaptureForm({
  title,
  description,
  sheetYear,
  setSheetYear,
  sheetMonth,
  setSheetMonth,
  sheetDay,
  setSheetDay,
  sheetTime,
  setSheetTime,
  sheetPlace,
  setSheetPlace,
  sheetGender,
  setSheetGender,
  sheetBusy,
  onSubmit,
}: {
  title: string;
  description: string;
  sheetYear: string;
  setSheetYear: Dispatch<SetStateAction<string>>;
  sheetMonth: string;
  setSheetMonth: Dispatch<SetStateAction<string>>;
  sheetDay: string;
  setSheetDay: Dispatch<SetStateAction<string>>;
  sheetTime: string;
  setSheetTime: Dispatch<SetStateAction<string>>;
  sheetPlace: string;
  setSheetPlace: Dispatch<SetStateAction<string>>;
  sheetGender: string;
  setSheetGender: Dispatch<SetStateAction<string>>;
  sheetBusy: boolean;
  onSubmit: () => void | Promise<void>;
}) {
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit();
      }}
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--space-text)]">{title}</h2>
        <p className="text-sm leading-relaxed text-[var(--space-text-muted)]">
          {description}
        </p>
      </div>
      <div className="space-y-2">
        <span className="block text-xs font-medium text-[rgba(255,255,255,0.78)]">
          생년월일
        </span>
        <div className="grid grid-cols-3 gap-2">
          <label className="space-y-1">
            <span className="text-[10px] text-white/50">연도 (4자리)</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="bday-year"
              maxLength={4}
              value={sheetYear}
              onChange={(e) =>
                setSheetYear(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="1990"
              className="w-full rounded-2xl border border-white/18 bg-[#0d121f] px-3 py-3.5 text-center text-[rgba(255,255,255,0.96)] outline-none focus:border-[#67B7FF]/55 focus:ring-2 focus:ring-[#67B7FF]/35"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] text-white/50">월</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="bday-month"
              maxLength={2}
              value={sheetMonth}
              onChange={(e) =>
                setSheetMonth(e.target.value.replace(/\D/g, "").slice(0, 2))
              }
              placeholder="01"
              className="w-full rounded-2xl border border-white/18 bg-[#0d121f] px-3 py-3.5 text-center text-[rgba(255,255,255,0.96)] outline-none focus:border-[#67B7FF]/55 focus:ring-2 focus:ring-[#67B7FF]/35"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] text-white/50">일</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="bday-day"
              maxLength={2}
              value={sheetDay}
              onChange={(e) =>
                setSheetDay(e.target.value.replace(/\D/g, "").slice(0, 2))
              }
              placeholder="15"
              className="w-full rounded-2xl border border-white/18 bg-[#0d121f] px-3 py-3.5 text-center text-[rgba(255,255,255,0.96)] outline-none focus:border-[#67B7FF]/55 focus:ring-2 focus:ring-[#67B7FF]/35"
            />
          </label>
        </div>
      </div>
      <label className="block space-y-2">
        <span className="text-xs font-medium text-[rgba(255,255,255,0.78)]">
          출생 시각
        </span>
        <input
          type="time"
          value={sheetTime}
          onChange={(e) => setSheetTime(e.target.value)}
          className="w-full rounded-2xl border border-white/18 bg-[#0d121f] px-4 py-3.5 text-[rgba(255,255,255,0.96)] outline-none focus:border-[#67B7FF]/55 focus:ring-2 focus:ring-[#67B7FF]/35"
        />
      </label>
      <div className="space-y-2">
        <span className="text-xs font-medium text-[rgba(255,255,255,0.78)]">
          성별
        </span>
        <div
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
          role="group"
          aria-label="성별"
        >
          {(
            [
              { v: "female", label: "여성" },
              { v: "male", label: "남성" },
              { v: "other", label: "기타 · 밝히지 않음" },
            ] as const
          ).map(({ v, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => setSheetGender(v)}
              className={[
                "min-h-[48px] rounded-2xl border-2 px-3 py-2.5 text-sm font-semibold transition",
                sheetGender === v
                  ? "border-[#67B7FF] bg-[rgba(103,183,255,0.22)] text-white shadow-[0_0_20px_rgba(103,183,255,0.25)]"
                  : "border-white/16 bg-[#121a2c] text-[rgba(255,255,255,0.92)] hover:border-[#67B7FF]/45 hover:bg-[#161f34]",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <label className="block space-y-2">
        <span className="text-xs font-medium text-[rgba(255,255,255,0.78)]">
          태어난 장소
        </span>
        <input
          type="text"
          placeholder="예: 서울"
          value={sheetPlace}
          onChange={(e) => setSheetPlace(e.target.value)}
          className="w-full rounded-2xl border border-white/18 bg-[#0d121f] px-4 py-3.5 text-[rgba(255,255,255,0.96)] placeholder:text-white/45 outline-none focus:border-[#67B7FF]/55 focus:ring-2 focus:ring-[#67B7FF]/35"
        />
      </label>
      <div className="pt-2">
        <GlowButton type="submit" variant="secondary" className="w-full" disabled={sheetBusy}>
          {sheetBusy ? "저장 중…" : "다음: 결제하기"}
        </GlowButton>
      </div>
    </form>
  );
}
