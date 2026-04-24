"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Wand2 } from "lucide-react";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";
import GlowButton from "@/components/space/GlowButton";
import SurveyAnalyzingJourney from "@/components/space/SurveyAnalyzingJourney";
import UnifiedReportMarkdown from "@/components/report/UnifiedReportMarkdown";
const FREE_ACCORDION_TITLES = [
  "🔍 보여지는 모습",
  "💎 내면의 모습",
  "💫 관계 패턴",
  "🌱 소통 팁",
] as const;

function FreeResultAccordions({
  bodies,
  displayName,
}: {
  bodies: readonly [string, string, string, string];
  displayName: string;
}) {
  const [openIdx, setOpenIdx] = useState<number>(0);

  return (
    <div className="space-y-4">
      <p className="text-center text-sm leading-relaxed text-[var(--space-text)] sm:text-[0.9375rem]">
        ✨ 설문으로 알아본 현재 {displayName}님의 모습이에요
      </p>
      <div className="space-y-2.5">
        {FREE_ACCORDION_TITLES.map((title, i) => {
          const open = openIdx === i;
          const body = bodies[i]?.trim() ?? "";
          return (
            <section
              key={title}
              className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[rgba(10,14,24,0.35)] shadow-[0_6px_24px_rgba(0,0,0,0.14)] backdrop-blur-sm"
            >
              <button
                type="button"
                onClick={() =>
                  setOpenIdx((prev) => (prev === i ? -1 : i))
                }
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.04] sm:px-5 sm:py-4"
                aria-expanded={open}
              >
                <span className="text-[0.9375rem] font-semibold leading-snug tracking-[-0.01em] text-[var(--space-text)] sm:text-base">
                  {title}
                </span>
                <span
                  className="shrink-0 text-[0.65rem] text-[var(--space-text-muted)] tabular-nums opacity-85"
                  aria-hidden
                >
                  {open ? "▼" : "▶"}
                </span>
              </button>
              {open ? (
                <div className="border-t border-white/[0.07] px-4 py-4 sm:px-5 sm:py-5">
                  {body ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--space-text-muted)] sm:text-[0.9375rem]">
                      {body}
                    </p>
                  ) : (
                    <p className="text-sm text-[var(--space-text-muted)]/80">
                      이 구간 요약이 아직 짧게 전달됐어요.
                    </p>
                  )}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function deepReportIntroStorageKey(reportId: string) {
  return `ahaitsme_deep_report_pre_form_intro_v1_${reportId}`;
}

function readDeepReportIntroSeen(reportId: string): boolean {
  if (!reportId || typeof window === "undefined") return false;
  try {
    return localStorage.getItem(deepReportIntroStorageKey(reportId)) === "1";
  } catch {
    return false;
  }
}

function markDeepReportIntroSeen(reportId: string) {
  if (!reportId) return;
  try {
    localStorage.setItem(deepReportIntroStorageKey(reportId), "1");
  } catch {
    /* ignore */
  }
}

function formatTimeInput(t?: string | null) {
  if (!t) return "";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

/** 심화 탐사(핵심 리포트) 안내 — 결제 페이지와 동일한 타이포·플로우 레이아웃 */
function DeepReportIntroPanel({
  onContinue,
  onBackToResult,
}: {
  onContinue: () => void;
  onBackToResult: () => void;
}) {
  return (
    <div className="space-y-6 px-0.5 py-1 sm:space-y-7">
      <header className="space-y-1 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--space-sub)]">
          Deep report
        </p>
        <h2 className="text-balance text-lg font-semibold leading-relaxed text-[var(--space-text)] sm:text-xl">
          <span className="block">지금까지 본 건 현재의 흐름이었어.</span>
          <span className="mt-2 block sm:mt-2.5">
            이제 진짜 &apos;내면의 나&apos;를 만나봐.
          </span>
        </h2>
      </header>

      <div className="rounded-2xl border border-[var(--space-border)] bg-[var(--space-card)]/55 px-4 py-4 sm:px-5">
        <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--space-text-muted)]">
          핵심 리포트가 이어지는 방식
        </p>
        <div className="flex flex-col items-center gap-2 text-[13px] leading-snug text-[var(--space-text)] sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-1 sm:gap-y-1 sm:text-sm">
          <span className="font-medium">기존 설문</span>
          <ArrowRight
            className="hidden h-4 w-4 shrink-0 text-[#67B7FF] sm:inline"
            strokeWidth={2}
            aria-hidden
          />
          <span className="text-white/35 sm:hidden">→</span>
          <span className="font-medium">추가 설문(준비중)</span>
          <ArrowRight
            className="hidden h-4 w-4 shrink-0 text-[#67B7FF] sm:inline"
            strokeWidth={2}
            aria-hidden
          />
          <span className="text-white/35 sm:hidden">→</span>
          <span className="font-medium">행동 패턴·기질</span>
          <ArrowRight
            className="hidden h-4 w-4 shrink-0 text-[#8B7CFF] sm:inline"
            strokeWidth={2}
            aria-hidden
          />
          <span className="text-white/35 sm:hidden">→</span>
          <span className="font-semibold text-[#FFD6A5]">통합 핵심 리포트</span>
        </div>
        <p className="mt-3 text-center text-xs leading-relaxed text-[var(--space-text-muted)]">
          설문으로 읽힌 지금의 흐름과, 출생 맥락에서 정리되는 행동 패턴·기질이
          한 줄기로 엮여 하나의 리포트로 전달돼요.
        </p>
      </div>

      <div className="space-y-8 border-t border-[var(--space-border)] pt-6">
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--space-text)]">
            <Wand2 className="h-4 w-4 text-[#8eb8ff]" strokeWidth={1.75} />
            포함 내용
          </h3>
          <ul className="space-y-3 text-[15px] leading-relaxed text-[var(--space-text-muted)]">
            <li className="flex gap-3">
              <Check
                className="mt-0.5 h-5 w-5 shrink-0 text-[#67B7FF]"
                strokeWidth={2}
              />
              <span>방금 진행한 설문을 바탕으로 한 심화 분석</span>
            </li>
            <li className="flex gap-3">
              <Check
                className="mt-0.5 h-5 w-5 shrink-0 text-[#67B7FF]"
                strokeWidth={2}
              />
              <span>
                행동 패턴과 타고난 기질을 한데 모은 통합 핵심 리포트
              </span>
            </li>
            <li className="flex gap-3">
              <Check
                className="mt-0.5 h-5 w-5 shrink-0 text-[#67B7FF]"
                strokeWidth={2}
              />
              <span>
                1년간 분기별·월별 업데이트
                <span className="mt-1.5 block text-[13px] text-white/55">
                  · 분기별 행동 가이드
                  <br />· 월별 변화에 따른 관계 방향 조언
                </span>
              </span>
            </li>
            <li className="flex gap-3">
              <Check
                className="mt-0.5 h-5 w-5 shrink-0 text-[#67B7FF]"
                strokeWidth={2}
              />
              <span>
                앞으로 더해지는 개인 분석 도구 업데이트는 추가 비용 없이 이용
              </span>
            </li>
          </ul>
        </section>

        <div className="rounded-2xl border border-[#ffd6a5]/25 bg-gradient-to-br from-[#ffd6a5]/[0.08] to-transparent px-4 py-4 sm:px-5">
          <h3 className="mb-2 text-sm font-semibold text-[var(--space-text)]">
            가격 및 환불 정책
          </h3>
          <p className="text-lg font-semibold tracking-tight text-[#ffe8cc] sm:text-xl">
            ₩9,900 / 1년
          </p>
          <p className="mt-0.5 text-xs text-[var(--space-text-muted)]">
            일회성 결제
          </p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--space-text-muted)]">
            <li className="flex items-start gap-2.5">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-[#8fd4a8]"
                strokeWidth={2}
              />
              <span>안전한 결제</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-[#8fd4a8]"
                strokeWidth={2}
              />
              <span>결제 후 7일 이내 미사용 시 전액 환불</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <GlowButton
            type="button"
            className="w-full !min-h-[52px] text-[0.9375rem] font-semibold"
            onClick={onContinue}
          >
            지금 바로 핵심 리포트 받기
          </GlowButton>
          <button
            type="button"
            onClick={onBackToResult}
            className="w-full py-2 text-center text-sm text-[var(--space-text-muted)] underline-offset-4 transition hover:text-[var(--space-text)] hover:underline"
          >
            결과 화면으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportBirthCaptureForm({
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
        <GlowButton type="submit" className="w-full" disabled={sheetBusy}>
          {sheetBusy ? "저장 중…" : "다음: 결제하기"}
        </GlowButton>
      </div>
    </form>
  );
}

function parseBirthDateParts(iso: string | null | undefined): {
  y: string;
  mo: string;
  d: string;
} {
  const s = String(iso ?? "").trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return { y: "", mo: "", d: "" };
  return { y: m[1], mo: m[2], d: m[3] };
}

function buildISODateFromParts(y: string, mo: string, d: string): string {
  const ys = y.replace(/\D/g, "").slice(0, 4);
  if (ys.length !== 4) return "";
  const md = mo.replace(/\D/g, "").slice(0, 2);
  const dd = d.replace(/\D/g, "").slice(0, 2);
  if (!md || !dd) return "";
  const mp = md.padStart(2, "0");
  const dp = dd.padStart(2, "0");
  const mi = Number(mp);
  const di = Number(dp);
  if (mi < 1 || mi > 12 || di < 1 || di > 31) return "";
  return `${ys}-${mp}-${dp}`;
}

function hasCompleteBirthInfo(
  row: {
    birth_date?: string | null;
    birth_time?: string | null;
    birth_place?: string | null;
  } | null,
): boolean {
  if (!row) return false;
  const d = String(row.birth_date ?? "").trim();
  const t = String(row.birth_time ?? "").trim();
  const p = String(row.birth_place ?? "").trim();
  return Boolean(d && t && p);
}

function buildSurveyOnlyPrompt(interpretations: Record<string, string>) {
  const personality = Object.values(interpretations).filter(Boolean).join(", ");
  return `
[설문 기반 성향 — 실제 행동·패턴 해석]
${personality || "(설문 해석 없음)"}

위 설문 해석만을 근거로 분석해줘.
`.trim();
}

function buildAstrologyContextForLlm(astro: {
  sun: string;
  moon: string;
  rising: string;
}) {
  return `[출생 시점 도식에서 읽히는 세 축 — 최종 글에는 아래 라벨·별자리명을 그대로 쓰지 말 것]
1) 삶에서 자기를 드러내고 추구하는 톤: "${astro.sun}" 계열 기질
2) 안식·감정 반응의 리듬: "${astro.moon}" 계열 기질
3) 낯선 사람에게 먼저 비치는 인상·접근 방식: "${astro.rising}" 계열 기질`;
}

function buildIntegratedPrompt({
  interpretations,
  sajuData,
  astrologyText,
}: {
  interpretations: Record<string, string>;
  sajuData: any | null;
  astrologyText?: string | null;
}) {
  const personality = Object.values(interpretations).filter(Boolean).join(", ");
  const s = sajuData;
  const pillars = s?.saju
    ? `${s.saju.yearPillar} ${s.saju.monthPillar} ${s.saju.dayPillar} ${s.saju.hourPillar}`
    : "(사주 미계산)";

  const dayStemBlock = s?.dayStemData
    ? `- 표기: ${s.dayStemData.kor_name ?? ""}
- 비유·기질: ${s.dayStemData.metaphor_ko ?? ""}`
    : "(없음)";

  const dayBranchBlock = s?.dayBranchData
    ? `${s.dayBranchData.kor_name ?? ""}: ${s.dayBranchData.meaning_ko ?? ""}`
    : "(없음)";

  const hiddenBlock =
    Array.isArray(s?.hiddenStemsData) && s.hiddenStemsData.length > 0
      ? s.hiddenStemsData
          .map((h: any) =>
            `${h.stem_code ?? ""} — ${h.meaning_ko ?? ""}`.trim(),
          )
          .join("\n")
      : "(없음)";

  const tenGodBlock =
    Array.isArray(s?.tenGods) && s.tenGods.length > 0
      ? s.tenGods
          .map(
            (t: any) =>
              `${t.pillar ?? ""}: ${t.godData?.kor_name ?? ""} (${t.godData?.meaning_ko ?? ""})`,
          )
          .join("\n")
      : "(없음)";

  const twelveBlock = s?.twelveStageData
    ? `${s.twelveStageData.kor_name ?? ""} — ${s.twelveStageData.meaning_ko ?? ""}`
    : "(없음)";

  const relationsBlock =
    Array.isArray(s?.relations) && s.relations.length > 0
      ? s.relations
          .map((r: any) => `${r.type ?? ""}: ${r.interpretation ?? ""}`)
          .join("\n")
      : "(없음)";

  return `
[설문 기반 성향 — 실제 행동·패턴 해석]
${personality || "(없음)"}

[사주 구조 데이터 — 원국]
- 사주팔자: ${pillars}
- 일간(천간)
${dayStemBlock}
- 일지(지지)
${dayBranchBlock}
- 지장간
${hiddenBlock}
- 십성
${tenGodBlock}
- 12운성
${twelveBlock}
- 지지 관계(합·충·형·파·해 등)
${relationsBlock}

[출생 맥락·점성 보조 데이터 — 본문에는 점성 용어 없이 일상어로만]
${astrologyText?.trim() || "(별도 데이터 없음 — 설문·사주만으로 통합해줘)"}

위 전체를 바탕으로 하나의 통합 보고서를 작성해줘. 별자리명·태양/달/라이징 같은 점성학 용어는 쓰지 말고 체험·행동으로 풀어줘.
`.trim();
}

export default function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [report, setReport] = useState<any>(null);
  const [interpretations, setInterpretations] = useState<
    Record<string, string>
  >({});
  const [relationship, setRelationship] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [freeSummary, setFreeSummary] = useState<string | null>(null);
  const [paidSummary, setPaidSummary] = useState<string | null>(null);
  const [unifiedReport, setUnifiedReport] = useState<string | null>(null);
  const [reportStreaming, setReportStreaming] = useState(false);
  const [sajuStatus, setSajuStatus] = useState<{
    attempted: boolean;
    ok: boolean;
  }>({ attempted: false, ok: false });

  /** 심화: 페이지 안 단계(모달 없음) — intro → form(출생) → 결제 */
  const [deepFlow, setDeepFlow] = useState<null | "intro" | "form">(null);
  const viewParam = searchParams.get("view");
  const [resultViewTab, setResultViewTab] = useState<"basic" | "premium">(
    viewParam === "premium" ? "premium" : "basic",
  );
  const [sheetYear, setSheetYear] = useState("");
  const [sheetMonth, setSheetMonth] = useState("");
  const [sheetDay, setSheetDay] = useState("");
  const [sheetTime, setSheetTime] = useState("");
  const [sheetPlace, setSheetPlace] = useState("");
  const [sheetGender, setSheetGender] = useState("");
  const [sheetBusy, setSheetBusy] = useState(false);
  const [inviteUsed, setInviteUsed] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const afterPaymentHandled = useRef(false);
  const inviteUsedRef = useRef(false);
  inviteUsedRef.current = inviteUsed;

  const pathname = usePathname();
  const reportId = searchParams.get("id") || "";
  const afterPaymentFlag = searchParams.get("afterPayment") === "1";

  useEffect(() => {
    if (viewParam === "premium") setResultViewTab("premium");
    else if (viewParam === "basic") setResultViewTab("basic");
  }, [viewParam]);
  const displayName = report?.name?.trim() || "당신";

  const freeParagraphs = useMemo(() => {
    if (!freeSummary) return [];
    const blocks = freeSummary
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (blocks.length >= 2) return blocks;
    const lines = freeSummary
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return lines.length ? lines : [freeSummary.trim()];
  }, [freeSummary]);

  const freeAccordionBodies = useMemo((): [
    string,
    string,
    string,
    string,
  ] => {
    const p = freeParagraphs.map((x) => x.trim()).filter(Boolean);
    const out = [...p];
    while (out.length < 4) out.push("");
    return out.slice(0, 4) as [string, string, string, string];
  }, [freeParagraphs]);

  const isDbPaid = report?.payment_status === "paid";
  const showPaidUnified = useMemo(() => {
    if (!isDbPaid || !sajuStatus.ok) return false;
    return (
      reportStreaming ||
      (unifiedReport !== null && unifiedReport.length > 0)
    );
  }, [isDbPaid, sajuStatus.ok, reportStreaming, unifiedReport]);

  const birthInfoComplete = useMemo(
    () => hasCompleteBirthInfo(report),
    [report],
  );

  const sheetDate = useMemo(
    () => buildISODateFromParts(sheetYear, sheetMonth, sheetDay),
    [sheetYear, sheetMonth, sheetDay],
  );

  useEffect(() => {
    afterPaymentHandled.current = false;
  }, [reportId]);

  useEffect(() => {
    if (!report) return;
    const p = parseBirthDateParts(report.birth_date);
    setSheetYear(p.y);
    setSheetMonth(p.mo);
    setSheetDay(p.d);
    setSheetTime(formatTimeInput(report.birth_time));
    setSheetPlace(report.birth_place ?? "");
  }, [report]);

  /** 결제 완료 후: 출생 정보 입력 단계(페이지 안) */
  useEffect(() => {
    if (loading || afterPaymentHandled.current) return;
    if (!afterPaymentFlag || !reportId) return;
    if (!report || report.payment_status !== "paid") return;
    afterPaymentHandled.current = true;
    if (hasCompleteBirthInfo(report)) {
      router.replace(`/result?id=${encodeURIComponent(reportId)}`, {
        scroll: false,
      });
      return;
    }
    setDeepFlow("form");
    router.replace(`/result?id=${encodeURIComponent(reportId)}`, {
      scroll: false,
    });
  }, [loading, afterPaymentFlag, reportId, report, router]);

  /** 초대 링크 사용 여부 — 마운트·탭 포커스 시에만 조회(콜백 의존성 루프 방지) */
  useEffect(() => {
    if (!reportId) return;
    let cancelled = false;
    let lastFetch = 0;

    async function fetchInviteUsedOnce() {
      if (inviteUsedRef.current) return;
      try {
        const res = await fetch(
          `/api/invite/status?reportId=${encodeURIComponent(reportId)}`,
        );
        const data = await res.json();
        if (cancelled) return;
        if (data?.used === true) setInviteUsed(true);
      } catch {
        /* ignore */
      }
    }

    void fetchInviteUsedOnce();

    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      if (inviteUsedRef.current) return;
      const now = Date.now();
      if (now - lastFetch < 45_000) return;
      lastFetch = now;
      void fetchInviteUsedOnce();
    };
    const onFocus = () => {
      if (inviteUsedRef.current) return;
      const now = Date.now();
      if (now - lastFetch < 45_000) return;
      lastFetch = now;
      void fetchInviteUsedOnce();
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
    };
  }, [reportId]);

  /** 생년월일·장소 저장 후 유료(결제) 페이지로 이동 — 결제 완료 뒤 통합 리포트 생성 */
  const saveBirthAndGoPayment = useCallback(async () => {
    if (!reportId) return;
    setSheetBusy(true);
    try {
      const { error } = await supabase
        .from("reports")
        .update({
          birth_date: sheetDate || null,
          birth_time: sheetTime || null,
          birth_place: sheetPlace.trim() ? sheetPlace.trim() : null,
        })
        .eq("id", reportId);
      if (error) {
        console.error(error);
        alert("좌표 저장에 실패했어요.");
        return;
      }
      if (sheetGender.trim()) {
        localStorage.setItem(`gender_${reportId}`, sheetGender.trim());
      }
      setDeepFlow(null);
      router.push(`/payment?reportId=${encodeURIComponent(reportId)}`);
    } finally {
      setSheetBusy(false);
    }
  }, [reportId, sheetDate, sheetTime, sheetPlace, sheetGender, router]);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${displayName}님의 작은 우주`,
          text: "나의 소우주 결과를 살펴봐요.",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert("링크를 복사했어요.");
      }
    } catch {
      /* 사용자 취소 등 */
    }
  }

  async function handleInviteFriend() {
    if (!reportId || inviteUsed || inviteBusy) return;
    setInviteBusy(true);
    try {
      const res = await fetch("/api/invite/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? "초대 링크를 만들지 못했어요.");
        return;
      }
      const token = data?.invite?.invite_token as string | undefined;
      if (!token) {
        alert("초대 정보를 확인할 수 없어요.");
        return;
      }
      const url = `${window.location.origin}/invite?token=${encodeURIComponent(token)}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: "친구 초대", text: "함께 관계 분석을 받아보자.", url });
        } else {
          await navigator.clipboard.writeText(url);
          alert("초대 링크를 복사했어요. 친구에게 보내 주세요.");
        }
      } catch {
        await navigator.clipboard.writeText(url);
        alert("초대 링크를 복사했어요.");
      }
      setInviteUsed(true);
    } finally {
      setInviteBusy(false);
    }
  }

  function normalizeYN(value: any): string {
    const v = String(value ?? "")
      .trim()
      .toUpperCase();
    if (v === "Y" || v === "YES") return "Y";
    if (v === "N" || v === "NO") return "N";
    return "";
  }

  function getPattern(a: any, b: any, c: any): string {
    return normalizeYN(a) + normalizeYN(b) + normalizeYN(c);
  }

  useEffect(() => {
    async function fetchData() {
      if (!reportId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setUnifiedReport(null);
      setReportStreaming(false);

      const { data: reportData } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .maybeSingle();

      setReport(reportData);

      if (typeof window !== "undefined" && reportId) {
        localStorage.setItem("reportId", reportId);
      }

      const paid = reportData?.payment_status === "paid";

      const { data: responseData } = await supabase
        .from("survey_responses")
        .select("answers")
        .eq("report_id", reportId)
        .maybeSingle();

      let localInterpretations: Record<string, string> = {};
      let localPatterns: any = null; 

      if (responseData?.answers) {
        const ans = responseData.answers;

        const patterns: Record<string, string> = {
          mbti: getPattern(ans.q1, ans.q2, ans.q3),
          disc: getPattern(ans.q4, ans.q5, ans.q6),
          enneagram: getPattern(ans.q7, ans.q8, ans.q9),
          riasec: getPattern(ans.q10, ans.q11, ans.q12),
          pss: getPattern(ans.q13, ans.q14, ans.q15),
          tci: getPattern(ans.q16, ans.q17, ans.q18),
        };

        localPatterns = patterns;

        for (const key of Object.keys(patterns)) {
          const pattern = patterns[key];
      
          const { data } = await supabase
            .from("pattern_base")
            .select("interpretation")
            .eq("domain", key)
            .eq("pattern", pattern.trim())
            .maybeSingle();
      
          localInterpretations[key] = data?.interpretation ?? "해석 없음";
        }
      
        setInterpretations(localInterpretations);
      }

      // 🔥 사주 구조 데이터
      let localSajuData: any = null;
      let sajuOk = false;

      if (!paid) {
        setSajuStatus({ attempted: false, ok: false });
      } else if (!hasCompleteBirthInfo(reportData)) {
        setSajuStatus({ attempted: false, ok: false });
      } else {
        setSajuStatus({ attempted: true, ok: false });
        const sr = await fetch("/api/saju", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            birthDate: reportData.birth_date,
            birthTime: reportData.birth_time,
            birthPlace: reportData.birth_place ?? undefined,
            reportId,
          }),
        });

        if (sr.ok) {
          const j = await sr.json();
          localSajuData = j;
          sajuOk = true;
          setSajuStatus({ attempted: true, ok: true });
        } else {
          setSajuStatus({ attempted: true, ok: false });
        }
      }

      // 🔥 점성학 API 호출 (추가!)
      let localAstrologyText: string | null = null;
      if (paid && hasCompleteBirthInfo(reportData)) {
        try {
          const birthDateObj = new Date(reportData.birth_date);
          const ar = await fetch("/api/astrology", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              year: birthDateObj.getFullYear(),
              month: birthDateObj.getMonth() + 1,
              day: birthDateObj.getDate(),
              hour: reportData.birth_time
                ? parseInt(reportData.birth_time.split(":")[0])
                : 12,
              minute: reportData.birth_time
                ? parseInt(reportData.birth_time.split(":")[1])
                : 0,
              latitude: 37.5665, // TODO: 실제 위도로 대체
              longitude: 126.978, // TODO: 실제 경도로 대체
              timezone: 9,
            }),
          });
          if (ar.ok) {
            const astroData = await ar.json();
            const interp =
              typeof astroData.interpretation === "string"
                ? astroData.interpretation.trim()
                : "";
            if (interp) {
              localAstrologyText = interp;
            } else {
              const raw = astroData.raw as
                | { sun?: string; moon?: string; rising?: string }
                | undefined;
              const sun = raw?.sun ?? astroData.sun;
              const moon = raw?.moon ?? astroData.moon;
              const rising = raw?.rising ?? astroData.rising;
              if (sun && moon && rising) {
                localAstrologyText = buildAstrologyContextForLlm({
                  sun,
                  moon,
                  rising,
                });
              }
            }
          }
        } catch (e) {
          console.error("점성학 API 실패:", e);
        }
      }

      // 🔥 관계/보조 텍스트
      let localRelationship: string | null = null;
      if (paid) {
        const res = await fetch("/api/relationship/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId }),
        });
        if (res.ok) {
          const data = await res.json();
          localRelationship = data.relationship ?? data.astrology ?? null;
          setRelationship(localRelationship);
        }
      }

      // 🔥 LLM 호출
      try {
        if (!paid) {
          const promptData = buildSurveyOnlyPrompt(localInterpretations);
          const res = await fetch("/api/llm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "free",
              userInput: promptData,
            }),
          });
          const data = await res.json();
          setFreeSummary(data.free ?? null);
          setPaidSummary(data.paid ?? null);
          setUnifiedReport(null);
        } else {
          try {
            const freePromptData = buildSurveyOnlyPrompt(localInterpretations);
            const freeRes = await fetch("/api/llm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mode: "free",
                userInput: freePromptData,
              }),
            });
            const freeData = await freeRes.json();
            setFreeSummary(freeData.free ?? null);
          } catch {
            setFreeSummary(null);
          }

          const detailedRes = await fetch("/api/llm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "detailed_survey",
              patterns: localPatterns,
            }),
          });
          const detailedData = await detailedRes.json();

          const combinedAstrology = [localAstrologyText, localRelationship]
            .filter(Boolean)
            .join("\n\n");

          if (hasCompleteBirthInfo(reportData) && sajuOk) {
            setLoading(false);
            setReportStreaming(true);
            setUnifiedReport("");
            try {
              const integratedRes = await fetch("/api/llm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  mode: "integrated",
                  detailedSurvey: detailedData.report,
                  sajuData: localSajuData ?? null,
                  astrologyText: combinedAstrology || null,
                  stream: true,
                }),
              });

              if (!integratedRes.ok) {
                const errJson = await integratedRes.json().catch(() => ({}));
                setUnifiedReport(
                  `통합 리포트를 만들지 못했어요. ${String((errJson as { error?: string }).error ?? "잠시 후 다시 열어보세요.")}`,
                );
              } else {
                const ct = integratedRes.headers.get("content-type") ?? "";
                if (ct.includes("text/plain") && integratedRes.body) {
                  const reader = integratedRes.body.getReader();
                  const decoder = new TextDecoder();
                  let acc = "";
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    acc += decoder.decode(value, { stream: true });
                    setUnifiedReport(acc);
                  }
                  setUnifiedReport(acc);
                } else {
                  const integratedData = await integratedRes.json();
                  setUnifiedReport(integratedData.report ?? "");
                }
              }
            } catch (streamErr) {
              console.error(streamErr);
              setUnifiedReport(
                "통합 리포트를 불러오는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
              );
            } finally {
              setReportStreaming(false);
            }
          } else {
            setUnifiedReport(null);
          }
          setPaidSummary(null);
        }
        
      } catch (e) {
        console.error("GPT 실패", e);
      }

      setLoading(false);
    }

    fetchData();
  }, [reportId]);

  if (loading) {
    return (
      <SpaceBackground>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5">
          <SurveyAnalyzingJourney
            active
            mode={
              report?.payment_status === "paid" ? "landing" : "flight"
            }
          />
        </div>
      </SpaceBackground>
    );
  }

  if (!reportId) {
    return (
      <SpaceBackground>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5">
          <GlassCard className="w-full max-w-md space-y-5 text-center">
            <p className="space-text-muted text-sm leading-relaxed">
              리포트 id가 없어요. 홈에서 탐사를 다시 시작해 주세요.
            </p>
            <GlowButton type="button" onClick={() => router.push("/")}>
              처음으로
            </GlowButton>
          </GlassCard>
        </div>
      </SpaceBackground>
    );
  }

  return (
    <SpaceBackground>
      <div className="relative z-10 min-h-screen px-4 py-10 pb-28 sm:px-6">
        <div className="mx-auto max-w-md space-y-8 sm:max-w-2xl">
          <header className="space-y-3 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--space-sub)]">
              Exploration log
            </p>
            <h1 className="text-2xl font-semibold leading-tight text-[var(--space-text)] sm:text-3xl">
              {displayName}님의 관측기록
            </h1>
            <p className="text-sm text-[var(--space-text-muted)]">
              {isDbPaid && sajuStatus.ok
                ? "심층 통합 리포트가 준비되었습니다."
                : "분석 일부가 도출되었습니다."}
            </p>
          </header>

          {(freeSummary ||
            paidSummary ||
            showPaidUnified ||
            inviteUsed ||
            (isDbPaid && !(birthInfoComplete && sajuStatus.ok)) ||
            deepFlow) && (
            <GlassCard className="space-y-6">
              {deepFlow === "intro" ? (
                <DeepReportIntroPanel
                  onContinue={() => {
                    markDeepReportIntroSeen(reportId);
                    setDeepFlow("form");
                  }}
                  onBackToResult={() => setDeepFlow(null)}
                />
              ) : deepFlow === "form" ? (
                <div className="space-y-4">
                  <ReportBirthCaptureForm
                    title="심화 분석을 위한 정보"
                    description="입력을 마치면 결제 페이지로 이동해요."
                    sheetYear={sheetYear}
                    setSheetYear={setSheetYear}
                    sheetMonth={sheetMonth}
                    setSheetMonth={setSheetMonth}
                    sheetDay={sheetDay}
                    setSheetDay={setSheetDay}
                    sheetTime={sheetTime}
                    setSheetTime={setSheetTime}
                    sheetPlace={sheetPlace}
                    setSheetPlace={setSheetPlace}
                    sheetGender={sheetGender}
                    setSheetGender={setSheetGender}
                    sheetBusy={sheetBusy}
                    onSubmit={() => void saveBirthAndGoPayment()}
                  />
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      disabled={sheetBusy}
                      onClick={() => {
                        if (sheetBusy) return;
                        if (readDeepReportIntroSeen(reportId)) {
                          setDeepFlow(null);
                        } else {
                          setDeepFlow("intro");
                        }
                      }}
                      className="w-full rounded-2xl border border-white/14 bg-[#121a2c] py-3.5 text-sm text-[rgba(255,255,255,0.82)] transition hover:bg-[#161f34] sm:w-auto sm:min-w-[7.5rem]"
                    >
                      이전
                    </button>
                    <button
                      type="button"
                      disabled={sheetBusy}
                      onClick={() => setDeepFlow(null)}
                      className="w-full rounded-2xl border border-white/14 bg-[#121a2c] py-3.5 text-sm text-[rgba(255,255,255,0.82)] transition hover:bg-[#161f34] sm:w-auto sm:min-w-[7.5rem]"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {isDbPaid && showPaidUnified && (
                    <div
                      className="mx-auto inline-flex w-full max-w-md rounded-full border border-white/15 bg-[#0d121f] p-0.5"
                      role="tablist"
                      aria-label="분석 보기"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={resultViewTab === "basic"}
                        onClick={() => {
                          setResultViewTab("basic");
                          void router.replace(
                            `/result?id=${encodeURIComponent(reportId)}&view=basic`,
                            { scroll: false },
                          );
                        }}
                        className={[
                          "min-h-[40px] flex-1 rounded-full px-4 py-2 text-xs font-semibold transition",
                          resultViewTab === "basic"
                            ? "bg-gradient-to-r from-[#6bb5ff] to-[#4a90e2] text-[#0a0f1a] shadow-md"
                            : "text-[var(--space-text-muted)] hover:text-[var(--space-text)]",
                        ].join(" ")}
                      >
                        기본 분석
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={resultViewTab === "premium"}
                        onClick={() => {
                          setResultViewTab("premium");
                          void router.replace(
                            `/result?id=${encodeURIComponent(reportId)}&view=premium`,
                            { scroll: false },
                          );
                        }}
                        className={[
                          "min-h-[40px] flex-1 rounded-full px-4 py-2 text-xs font-semibold transition",
                          resultViewTab === "premium"
                            ? "bg-gradient-to-r from-[#ffd6a5] to-[#e8a85c] text-[#1a1208] shadow-md"
                            : "text-[var(--space-text-muted)] hover:text-[var(--space-text)]",
                        ].join(" ")}
                      >
                        심화 분석
                      </button>
                    </div>
                  )}

                  {isDbPaid &&
                    !(birthInfoComplete && sajuStatus.ok) &&
                    resultViewTab === "basic" && (
                      <div className="space-y-2 rounded-xl border border-[var(--space-border)] bg-[var(--space-card)]/40 p-4">
                        <p className="text-center text-sm font-medium text-[#FFD6A5]">
                          기질·행동 패턴 분석
                        </p>
                        {!birthInfoComplete && (
                          <p className="text-center text-sm leading-relaxed text-[var(--space-text-muted)]">
                            생년월일, 시간, 장소를 입력하면 심화 리포트를 만들 수
                            있어요. 아래 &apos;심화 분석하기&apos;에서 입력할 수
                            있어요.
                          </p>
                        )}
                        {birthInfoComplete &&
                          sajuStatus.attempted &&
                          !sajuStatus.ok && (
                            <p className="text-center text-sm leading-relaxed text-[var(--space-text-muted)]">
                              데이터를 불러오지 못했어요. 잠시 후 다시
                              열어보세요.
                            </p>
                          )}
                      </div>
                    )}

                  {freeSummary &&
                    (!isDbPaid ||
                      resultViewTab === "basic" ||
                      !showPaidUnified) && (
                      <>
                        <FreeResultAccordions
                          bodies={freeAccordionBodies}
                          displayName={displayName}
                        />

                        {resultViewTab === "basic" && (
                          <div className="flex flex-col gap-3 pt-2 sm:gap-3.5">
                            <GlowButton
                              type="button"
                              className="w-full !min-h-[48px] text-[0.9375rem] font-medium"
                              onClick={() => {
                                if (showPaidUnified) {
                                  setResultViewTab("premium");
                                  void router.replace(
                                    `/result?id=${encodeURIComponent(reportId)}&view=premium`,
                                    { scroll: false },
                                  );
                                  return;
                                }
                                if (readDeepReportIntroSeen(reportId)) {
                                  setDeepFlow("form");
                                } else {
                                  setDeepFlow("intro");
                                }
                              }}
                            >
                              {showPaidUnified
                                ? "🔍 심화 리포트 보기"
                                : "🔍 심화 분석하기"}
                            </GlowButton>
                            <GlowButton
                              type="button"
                              className="w-full !min-h-[48px] text-[0.9375rem] font-medium"
                              onClick={() => {
                                if (
                                  typeof window !== "undefined" &&
                                  reportId
                                ) {
                                  localStorage.setItem("reportId", reportId);
                                }
                                router.push("/survey?redo=1");
                              }}
                            >
                              🔄 다시 하기
                            </GlowButton>
                            <GlowButton
                              type="button"
                              className="w-full !min-h-[48px] text-[0.9375rem] font-medium"
                              onClick={() => router.push("/")}
                            >
                              🏠 홈으로 가기
                            </GlowButton>
                            <p className="text-center text-xs leading-relaxed text-[var(--space-text-muted)]">
                              <button
                                type="button"
                                className="underline decoration-white/30 underline-offset-2 hover:text-[var(--space-text)]"
                                onClick={() =>
                                  router.push(
                                    `/relationships?myReportId=${encodeURIComponent(reportId)}`,
                                  )
                                }
                              >
                                관계 탐사실
                              </button>
                              {" · "}
                              <button
                                type="button"
                                className="underline decoration-white/30 underline-offset-2 hover:text-[var(--space-text)]"
                                onClick={() => void handleShare()}
                              >
                                공유하기
                              </button>
                            </p>
                          </div>
                        )}
                      </>
                    )}

                  {isDbPaid &&
                    showPaidUnified &&
                    resultViewTab === "premium" && (
                      <>
                        <div className="space-y-5">
                          <div className="text-center">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#8eb8ff]/90">
                              Premium
                            </p>
                            <p className="mt-2 text-lg font-semibold text-[#FFD6A5] sm:text-xl">
                              통합 분석 리포트
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-[var(--space-text-muted)]">
                              설문·사주·출생 맥락을 한 흐름으로 엮었습니다.
                            </p>
                          </div>

                          <div
                            className={[
                              "rounded-2xl border border-[var(--space-border)]/80 bg-gradient-to-b from-[var(--space-card)]/55 to-[#0a0f1a]/35 p-4 shadow-[0_0_60px_rgba(103,183,255,0.06)] sm:p-6 md:p-8",
                              reportStreaming ? "ring-1 ring-[#67B7FF]/25" : "",
                            ].join(" ")}
                          >
                            {reportStreaming && (
                              <p className="mb-4 flex items-center gap-2 text-xs text-[#8eb8ff]/90">
                                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-[#67B7FF]" />
                                리포트를 이어서 작성하는 중이에요…
                              </p>
                            )}
                            {unifiedReport !== null &&
                            unifiedReport.length > 0 ? (
                              <UnifiedReportMarkdown content={unifiedReport} />
                            ) : reportStreaming ? (
                              <p className="text-sm text-[var(--space-text-muted)]">
                                곧 본문이 나타납니다.
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="space-y-3 border-t border-[var(--space-border)] pt-6">
                          <GlowButton
                            type="button"
                            className="w-full !min-h-[48px] py-3 text-sm"
                            onClick={() => void handleShare()}
                          >
                            리포트 공유
                          </GlowButton>
                          <GlowButton
                            type="button"
                            className="w-full !min-h-[48px] py-3 text-sm"
                            onClick={() =>
                              router.push(
                                `/relationships?myReportId=${encodeURIComponent(reportId)}`,
                              )
                            }
                          >
                            관계 탐사실
                          </GlowButton>
                          <GlowButton
                            type="button"
                            className="w-full !min-h-[48px] py-3 text-sm"
                            disabled={inviteUsed || inviteBusy}
                            onClick={() => void handleInviteFriend()}
                          >
                            {inviteUsed
                              ? "초대 링크 (사용됨)"
                              : inviteBusy
                                ? "준비 중…"
                                : "친구 초대 링크"}
                          </GlowButton>
                          <button
                            type="button"
                            onClick={() => router.push("/")}
                            className="w-full rounded-xl border border-[var(--space-border)] bg-white/[0.04] py-2.5 text-sm text-[var(--space-text-muted)] transition hover:bg-white/[0.07]"
                          >
                            나가기
                          </button>
                        </div>
                      </>
                    )}
                </>
              )}
            </GlassCard>
          )}

          {!freeSummary &&
            !paidSummary &&
            !showPaidUnified &&
            !deepFlow &&
            !(isDbPaid && !(birthInfoComplete && sajuStatus.ok)) && (
              <GlassCard>
                <p className="text-center text-sm text-[var(--space-text-muted)]">
                  아직 보여줄 관측 데이터가 준비되지 않았어요. 잠시 후 다시
                  열어보세요.
                </p>
              </GlassCard>
            )}

          {pathname !== "/result" ? (
            <div className="mx-auto w-full max-w-md sm:max-w-lg">
              <GlowButton
                type="button"
                className="w-full !min-h-[48px] text-[0.9375rem] font-medium"
                onClick={() => router.push("/")}
              >
                🏠 홈으로 가기
              </GlowButton>
            </div>
          ) : null}
        </div>
      </div>
    </SpaceBackground>
  );
}
