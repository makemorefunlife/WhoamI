"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";
import GlowButton from "@/components/space/GlowButton";
import SpaceLoading from "@/components/space/SpaceLoading";

function formatTimeInput(t?: string | null) {
  if (!t) return "";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

function parseBirthDateParts(
  iso: string | null | undefined,
): { y: string; mo: string; d: string } {
  const s = String(iso ?? "").trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return { y: "", mo: "", d: "" };
  return { y: m[1], mo: m[2], d: m[3] };
}

/** 연·월·일 문자열로 YYYY-MM-DD (유효할 때만) */
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

/** 생년월일·출생 시각·출생 장소가 모두 있을 때만 사주 API 호출 */
function hasCompleteBirthInfo(row: {
  birth_date?: string | null;
  birth_time?: string | null;
  birth_place?: string | null;
} | null): boolean {
  if (!row) return false;
  const d = String(row.birth_date ?? "").trim();
  const t = String(row.birth_time ?? "").trim();
  const p = String(row.birth_place ?? "").trim();
  return Boolean(d && t && p);
}

/** 무료 구간: 설문 해석만으로 /api/llm (mode: free) */
function buildSurveyOnlyPrompt(interpretations: Record<string, string>) {
  const personality = Object.values(interpretations).filter(Boolean).join(", ");
  return `
[설문 기반 성향 — 실제 행동·패턴 해석]
${personality || "(설문 해석 없음)"}

위 설문 해석만을 근거로 분석해줘.
`.trim();
}

/** 유료 통합: 설문 + 사주 구조 데이터 + 점성/맥락 텍스트 → /api/llm (mode: integrated) */
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
          .map(
            (h: any) =>
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

[점성학·출생 맥락 / 보조 데이터]
${astrologyText?.trim() || "(별도 데이터 없음 — 설문·사주만으로 통합해줘)"}

위 전체를 바탕으로 하나의 통합 보고서를 작성해줘.
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
  /** 무료 LLM 응답에서 split된 뒷부분(업그레이드 훅 문구) */
  const [paidSummary, setPaidSummary] = useState<string | null>(null);
  /** 유료 통합 보고서(/api/llm mode: integrated) */
  const [unifiedReport, setUnifiedReport] = useState<string | null>(null);
  /** 유료 + 생년월일시장소 충족 시 /api/saju 호출 여부 및 성공 여부 */
  const [sajuStatus, setSajuStatus] = useState<{
    attempted: boolean;
    ok: boolean;
  }>({ attempted: false, ok: false });

  /** 결제 완료 후 심화 결과 패널 공개 여부(인트로 애니메이션 이후) */
  const [paidPanelOpen, setPaidPanelOpen] = useState(false);
  const [shareUrlForQr, setShareUrlForQr] = useState("");
  const [showCoordSheet, setShowCoordSheet] = useState(false);
  const [sheetYear, setSheetYear] = useState("");
  const [sheetMonth, setSheetMonth] = useState("");
  const [sheetDay, setSheetDay] = useState("");
  const [sheetTime, setSheetTime] = useState("");
  const [sheetPlace, setSheetPlace] = useState("");
  const [sheetGender, setSheetGender] = useState("");
  const [sheetBusy, setSheetBusy] = useState(false);
  const [deepPhase, setDeepPhase] = useState<"idle" | "running" | "confirm">(
    "idle",
  );

  const reportId = searchParams.get("id") || "";
  const displayName = report?.name?.trim() || "당신";
  const isDbPaid = report?.payment_status === "paid";
  const showPaidUnified =
    Boolean(unifiedReport) &&
    (!isDbPaid || (isDbPaid && sajuStatus.ok));
  const showPaidSection = Boolean(
    isDbPaid && paidPanelOpen && showPaidUnified && unifiedReport,
  );
  const showDeepAnalysisCta = Boolean(
    isDbPaid && showPaidUnified && unifiedReport && !paidPanelOpen,
  );
  const showUpgradePath = Boolean(!isDbPaid && paidSummary);

  const birthInfoComplete = useMemo(
    () => hasCompleteBirthInfo(report),
    [report],
  );

  const sheetDate = useMemo(
    () => buildISODateFromParts(sheetYear, sheetMonth, sheetDay),
    [sheetYear, sheetMonth, sheetDay],
  );

  useEffect(() => {
    if (!isDbPaid) setPaidPanelOpen(false);
  }, [isDbPaid]);

  useEffect(() => {
    if (!reportId || typeof window === "undefined") return;
    setShareUrlForQr(
      `${window.location.origin}/result?id=${encodeURIComponent(reportId)}`,
    );
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

  useEffect(() => {
    if (deepPhase !== "running") return;
    const done = window.setTimeout(() => {
      setDeepPhase("confirm");
    }, 2800);
    return () => window.clearTimeout(done);
  }, [deepPhase]);

  const saveSheetAndGoPay = useCallback(async () => {
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
      router.push(`/payment?reportId=${encodeURIComponent(reportId)}`);
    } finally {
      setSheetBusy(false);
    }
  }, [reportId, sheetDate, sheetTime, sheetPlace, sheetGender, router]);

  // [추가] 공유 (기존 fetch/저장 로직 없음)
  async function handleShare() {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : shareUrlForQr || "";
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

      const { data: reportData } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .maybeSingle();

      setReport(reportData);

      const paid = reportData?.payment_status === "paid";

      const { data: responseData } = await supabase
        .from("survey_responses")
        .select("answers")
        .eq("report_id", reportId)
        .maybeSingle();

      let localInterpretations: Record<string, string> = {};

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

      // 🔥 사주 구조 데이터: 생년월일·시간·장소가 모두 있을 때만 /api/saju 호출
      let localSajuData: any = null;

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
          setSajuStatus({ attempted: true, ok: true });
        } else {
          setSajuStatus({ attempted: true, ok: false });
        }
      }

      // 🔥 점성/관계 등 보조 텍스트 (있으면 통합 프롬프트에 포함)
      let localAstrology: string | null = null;

      if (paid) {
        const res = await fetch("/api/relationship/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId }),
        });

        if (res.ok) {
          const data = await res.json();
          localAstrology = data.relationship ?? data.astrology ?? null;
          setRelationship(localAstrology);
        }
      }

      // 🔥 LLM: 무료(설문만) vs 유료(설문+사주+점성 통합) — 각각 1회
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
          const promptData = buildIntegratedPrompt({
            interpretations: localInterpretations,
            sajuData: localSajuData ?? null,
            astrologyText: localAstrology,
          });
          const res = await fetch("/api/llm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "integrated",
              userInput: promptData,
            }),
          });
          const data = await res.json();
          const unified =
            (typeof data.report === "string" && data.report) ||
            (typeof data.full === "string" && data.full) ||
            null;
          // 사주 API 성공 시에만 통합 보고서(사주 포함)를 유지
          setUnifiedReport(localSajuData ? unified : null);
          setFreeSummary(null);
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
          <SpaceLoading
            rotateMainOnly
            rotatingStatuses={["탐사하는 중", "특징 분석 중", "패턴 분석 중"]}
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
      <div className="relative z-10 min-h-screen px-5 py-10 pb-24">
        <div className="mx-auto max-w-md space-y-8">
          <header className="space-y-2 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--space-sub)]">
              Exploration log
            </p>
            <h1 className="text-2xl font-semibold leading-tight text-[var(--space-text)] sm:text-3xl">
              {displayName}님의 관측 기록
            </h1>
            <p className="text-sm text-[var(--space-text-muted)]">
              분석 일부가 도출되었습니다.
            </p>
          </header>

          {(freeSummary ||
            paidSummary ||
            (unifiedReport && showPaidUnified) ||
            (isDbPaid && !(birthInfoComplete && sajuStatus.ok))) && (
            <GlassCard className="space-y-6">
              {isDbPaid && !(birthInfoComplete && sajuStatus.ok) && (
                  <div className="space-y-2 rounded-xl border border-[var(--space-border)] bg-[var(--space-card)]/40 p-4">
                    <p className="text-center text-sm font-medium text-[#FFD6A5]">
                      사주 기질 분석
                    </p>
                    {!birthInfoComplete && (
                      <p className="text-center text-sm leading-relaxed text-[var(--space-text-muted)]">
                        생년월일, 시간, 장소를 입력하면 사주 기질 분석을 볼 수
                        있습니다.
                      </p>
                    )}
                    {birthInfoComplete &&
                      sajuStatus.attempted &&
                      !sajuStatus.ok && (
                        <p className="text-center text-sm leading-relaxed text-[var(--space-text-muted)]">
                          사주 데이터를 불러오지 못했어요. 잠시 후 다시
                          열어보세요.
                        </p>
                      )}
                  </div>
                )}

              {!isDbPaid && freeSummary && (
                <>
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-[var(--space-border)] bg-[var(--space-card)] shadow-[0_0_40px_rgba(103,183,255,0.12)]">
                    <span className="text-4xl" aria-hidden>
                      ◐
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-center text-base leading-relaxed text-[var(--space-text)]">
                    {freeSummary}
                  </p>

                  <div className="space-y-3 border-t border-[var(--space-border)] pt-5 text-center">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--space-text-muted)]">
                      {`이건 지금 보이는 흐름 정도야

비슷한 상황 몇 개만 떠올려보면
같은 패턴이 반복되는 경우가 많아

그 부분까지 보면 더 또렷하게 이해될 거야`}
                    </p>
                    <p className="text-xs text-[var(--space-text-muted)]">
                      좌표를 더 입력할수록 정밀도가 높아집니다.
                    </p>
                  </div>

                  {showUpgradePath && (
                    <div className="space-y-4 border-t border-[var(--space-border)] pt-5">
                      <p className="text-center text-sm leading-relaxed text-[var(--space-text-muted)]">
                        패턴을 더 정밀하게 보려면 추가 좌표가 필요해요.
                      </p>
                      <GlowButton
                        type="button"
                        className="w-full"
                        onClick={() => setShowCoordSheet(true)}
                      >
                        추가 분석 진행하기
                      </GlowButton>
                    </div>
                  )}
                </>
              )}

              {isDbPaid &&
                unifiedReport &&
                showPaidUnified &&
                !paidPanelOpen && (
                <>
                  <div className="space-y-4">
                    <p className="text-center text-sm font-medium text-[#FFD6A5]">
                      🌟 통합 분석 리포트
                    </p>
                    <p className="whitespace-pre-wrap text-left text-[15px] leading-relaxed text-[var(--space-text)]">
                      {unifiedReport}
                    </p>
                  </div>

                  {showDeepAnalysisCta && (
                    <div className="space-y-4 border-t border-[var(--space-border)] pt-5">
                      <p className="text-center text-sm text-[var(--space-text-muted)]">
                        심화 분석을 시작할 준비가 되었습니다.
                      </p>
                      <GlowButton
                        type="button"
                        className="w-full"
                        onClick={() => {
                          setDeepPhase("running");
                        }}
                      >
                        심화 분석 시작하기
                      </GlowButton>
                    </div>
                  )}
                </>
              )}

              {showPaidSection && (
                <div className="space-y-4 border-t border-[var(--space-border)] pt-6">
                  <p className="text-center text-sm font-medium text-[#FFD6A5]">
                    아.. 이게 당신이군요
                  </p>
                  <p className="whitespace-pre-line text-[15px] leading-relaxed text-[var(--space-text)]">
                    {unifiedReport}
                  </p>
                </div>
              )}
            </GlassCard>
          )}

          {!freeSummary &&
            !paidSummary &&
            !(unifiedReport && showPaidUnified) &&
            !(isDbPaid && !(birthInfoComplete && sajuStatus.ok)) && (
            <GlassCard>
              <p className="text-center text-sm text-[var(--space-text-muted)]">
                아직 보여줄 관측 데이터가 준비되지 않았어요. 잠시 후 다시
                열어보세요.
              </p>
            </GlassCard>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleShare}
              className="w-full rounded-2xl border border-[var(--space-border)] py-3.5 text-sm font-medium text-[var(--space-text)] transition hover:bg-white/[0.04]"
            >
              링크 공유하기
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full py-2 text-sm text-[var(--space-text-muted)] transition hover:text-[var(--space-text)]"
            >
              다른 행성을 발견하러 가기
            </button>
          </div>

          <GlassCard className="flex flex-col items-center gap-4">
            <h2 className="text-sm font-medium text-[var(--space-text-muted)]">
              공유 QR
            </h2>
            <div className="flex min-h-[184px] min-w-[184px] items-center justify-center rounded-2xl bg-white p-3">
              {shareUrlForQr ? (
                <QRCodeSVG value={shareUrlForQr} size={160} />
              ) : (
                <span className="px-2 text-center text-xs text-slate-500">
                  QR 준비 중…
                </span>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      <AnimatePresence>
        {showCoordSheet && (
          <motion.div
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/65 p-4 backdrop-blur-[2px] sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !sheetBusy && setShowCoordSheet(false)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard className="max-h-[85vh] overflow-y-auto space-y-5 !bg-[rgba(16,22,38,0.97)] !shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-[var(--space-text)]">
                    추가 데이터
                  </h2>
                  <p className="text-sm leading-relaxed text-[var(--space-text-muted)]">
                    패턴 분석을 위한 추가 데이터가 필요합니다.
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
                          setSheetYear(
                            e.target.value.replace(/\D/g, "").slice(0, 4),
                          )
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
                          setSheetMonth(
                            e.target.value.replace(/\D/g, "").slice(0, 2),
                          )
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
                          setSheetDay(
                            e.target.value.replace(/\D/g, "").slice(0, 2),
                          )
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
                        {
                          v: "other",
                          label: "기타 · 밝히지 않음",
                        },
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

                <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
                  <GlowButton
                    type="button"
                    className="w-full flex-1"
                    disabled={sheetBusy}
                    onClick={() => void saveSheetAndGoPay()}
                  >
                    {sheetBusy
                      ? "저장 중…"
                      : "데이터 입력하고 심화분석시작하기"}
                  </GlowButton>
                  <button
                    type="button"
                    disabled={sheetBusy}
                    onClick={() => setShowCoordSheet(false)}
                    className="w-full flex-1 rounded-2xl border border-white/14 bg-[#121a2c] py-3.5 text-sm text-[rgba(255,255,255,0.82)] transition hover:bg-[#161f34]"
                  >
                    닫기
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deepPhase !== "idle" && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard className="w-full max-w-sm space-y-6 text-center">
              {deepPhase === "running" && (
                <SpaceLoading
                  rotateMainOnly
                  rotatingStatuses={[
                    "탐사하는 중",
                    "특징 분석 중",
                    "패턴 분석 중",
                  ]}
                />
              )}
              {deepPhase === "confirm" && (
                <>
                  <p className="text-lg font-semibold text-[var(--space-text)]">
                    탐사가 완료되었습니다.
                  </p>
                  <GlowButton
                    type="button"
                    className="w-full"
                    onClick={() => {
                      setPaidPanelOpen(true);
                      setDeepPhase("idle");
                    }}
                  >
                    결과 확인하기
                  </GlowButton>
                </>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </SpaceBackground>
  );
}
