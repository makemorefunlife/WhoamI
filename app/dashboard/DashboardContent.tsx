"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import FirstEntryDiagnostics from "@/components/debug/FirstEntryDiagnostics";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";
import GlowButton from "@/components/space/GlowButton";
import FreeAnalysisCardDeck from "@/components/report/FreeAnalysisCardDeck";
import ReportSectionLoading from "@/components/report/ReportSectionLoading";
import type { HomeResumePayload } from "@/lib/home/homeResume";
import {
  applyResumeReportIdToStorage,
  fetchHomeResumeClient,
} from "@/lib/home/fetchHomeResumeClient";
import { clearBasicResultCache } from "@/lib/report/basicResultCache";
import { fetchBasicAnalysisClient } from "@/lib/report/fetchBasicAnalysisClient";

const UnifiedReportMarkdown = dynamic(
  () => import("@/components/report/UnifiedReportMarkdown"),
  {
    ssr: false,
    loading: () => <ReportSectionLoading label="심화 리포트를 불러오는 중…" />,
  },
);

type MyReportJson = {
  report_id: string;
  name: string;
  has_premium: boolean;
  has_survey: boolean;
  basic_result: string | null;
  premium_result: string | null;
  result_paths?: {
    basic: string;
    full: string;
    payment: string;
  };
};

type RelSimple = {
  list_key: string;
  partner_name: string;
  status: "completed" | "pending";
  relationship_report_id: string | null;
};

type LoadPhase = "resolving" | "loading-report" | "idle";

function AccordionSection({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[rgba(10,14,24,0.38)] shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-4 text-left transition hover:bg-white/[0.035] sm:px-6 sm:py-[1.125rem]"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <span className="block text-[0.9375rem] font-semibold leading-snug tracking-[-0.01em] text-[var(--space-text)] sm:text-base">
            {title}
          </span>
          {subtitle ? (
            <span className="block text-[0.8125rem] font-normal leading-snug text-[var(--space-text-muted)] tabular-nums sm:text-sm">
              {subtitle}
            </span>
          ) : null}
        </div>
        <span
          className="mt-0.5 shrink-0 text-[0.6875rem] text-[var(--space-text-muted)] tabular-nums opacity-80"
          aria-hidden
        >
          {open ? "▼" : "▶"}
        </span>
      </button>
      {open ? (
        <div className="border-t border-white/[0.06] px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </div>
      ) : null}
    </section>
  );
}

function loadPhaseMessage(phase: LoadPhase): string {
  if (phase === "resolving") return "탐사 기록을 확인하는 중…";
  if (phase === "loading-report") return "탐사실을 불러오는 중…";
  return "";
}

function resumeGuidanceMessage(resume: HomeResumePayload | null): string | null {
  if (!resume) return null;
  if (!resume.hasReport || !resume.reportId) {
    return "아직 탐사 기록이 없어요. 홈에서 시작하기를 눌러 주세요.";
  }
  if (!resume.surveyCompleted) {
    return "설문을 아직 마치지 않았어요. 이어서 진행해 주세요.";
  }
  return null;
}

export default function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportIdFromUrl = searchParams.get("reportId")?.trim() ?? "";

  const [reportId, setReportId] = useState("");
  const [loadPhase, setLoadPhase] = useState<LoadPhase>("resolving");
  const [resume, setResume] = useState<HomeResumePayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [my, setMy] = useState<MyReportJson | null>(null);
  const [rels, setRels] = useState<RelSimple[]>([]);
  const [tab, setTab] = useState<"basic" | "premium">("basic");
  const [confirmNew, setConfirmNew] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [openMyRecords, setOpenMyRecords] = useState(true);
  const [openRelationships, setOpenRelationships] = useState(true);
  const [basicLoading, setBasicLoading] = useState(false);
  const [basicError, setBasicError] = useState<string | null>(null);
  const basicFetchRef = useRef<string | null>(null);

  const loading = loadPhase !== "idle";

  const syncCanonicalReportId = useCallback(
    (data: HomeResumePayload) => {
      const canonical = applyResumeReportIdToStorage(data);
      setReportId(canonical ?? "");
      if (
        canonical &&
        reportIdFromUrl &&
        reportIdFromUrl !== canonical
      ) {
        router.replace(
          `/dashboard?reportId=${encodeURIComponent(canonical)}`,
          { scroll: false },
        );
      }
      return canonical;
    },
    [reportIdFromUrl, router],
  );

  const fetchRelationships = useCallback(async (canonicalId: string) => {
    const r2 = await fetch(
      `/api/relationship/list?reportId=${encodeURIComponent(canonicalId)}&format=simple&scope=all`,
    );
    const j2 = await r2.json();
    if (r2.ok) {
      setRels((j2.relationships ?? []) as RelSimple[]);
    } else {
      setRels([]);
    }
  }, []);

  const loadBasicAnalysis = useCallback(
    async (id: string, fromMeta?: string | null, force = false) => {
      const trimmedMeta = fromMeta?.trim();
      if (trimmedMeta) {
        setBasicError(null);
        setMy((prev) =>
          prev ? { ...prev, basic_result: trimmedMeta } : prev,
        );
        return;
      }

      if (!force && basicFetchRef.current === id) return;
      basicFetchRef.current = id;

      setBasicLoading(true);
      setBasicError(null);
      try {
        const result = await fetchBasicAnalysisClient(id, {
          cachedFromMeta: force ? null : fromMeta,
          regenerate: force,
        });
        if (result.ok) {
          setMy((prev) =>
            prev ? { ...prev, basic_result: result.text } : prev,
          );
          return;
        }
        if (result.reason === "no_survey") return;
        if (result.reason === "no_key") {
          setBasicError(
            "분석 서버 설정이 필요해요. 잠시 후 다시 시도해 주세요.",
          );
        } else {
          setBasicError(
            "기본 분석을 만드는 데 시간이 걸리거나 실패했어요. 다시 시도해 주세요.",
          );
        }
      } finally {
        setBasicLoading(false);
      }
    },
    [],
  );

  const loadMyReport = useCallback(
    async (canonicalId: string, allowResumeRetry: boolean): Promise<boolean> => {
      const r1 = await fetch(
        `/api/my/report?reportId=${encodeURIComponent(canonicalId)}&quick=1`,
      );
      const j1 = (await r1.json().catch(() => ({}))) as {
        error?: string;
      } & Partial<MyReportJson>;

      if (r1.ok) {
        const row = j1 as MyReportJson;
        setMy(row);
        await fetchRelationships(canonicalId);
        if (row.basic_result?.trim()) {
          setMy((prev) =>
            prev ? { ...prev, basic_result: row.basic_result!.trim() } : prev,
          );
        }
        return true;
      }

      if (r1.status === 404 && allowResumeRetry) {
        const fresh = await fetchHomeResumeClient();
        if (fresh.ok) {
          const nextId = syncCanonicalReportId(fresh.data);
          setResume(fresh.data);
          if (nextId && nextId !== canonicalId) {
            return loadMyReport(nextId, false);
          }
        }
      }

      setErr(j1.error ?? "내 리포트를 불러오지 못했어요.");
      setMy(null);
      setRels([]);
      return false;
    },
    [fetchRelationships, syncCanonicalReportId, loadBasicAnalysis],
  );

  const bootstrap = useCallback(async () => {
    setLoadPhase("resolving");
    setErr(null);
    setMy(null);
    setRels([]);

    const hint =
      reportIdFromUrl ||
      (typeof window !== "undefined"
        ? localStorage.getItem("reportId")?.trim() ?? ""
        : "");

    const resumeRes = await fetchHomeResumeClient(hint || undefined);

    if (!resumeRes.ok) {
      if (resumeRes.status === 401) {
        const guestHint =
          reportIdFromUrl ||
          (typeof window !== "undefined"
            ? localStorage.getItem("reportId")?.trim() ?? ""
            : "");
        setErr(
          guestHint
            ? "이 탐사 기록은 다른 계정에 연결되어 있어요. 로그인하거나 홈에서 새로 시작해 주세요."
            : "로그인이 필요해요. 홈에서 시작하거나 로그인해 주세요.",
        );
      } else {
        setErr(resumeRes.error);
      }
      setLoadPhase("idle");
      return;
    }

    const resumeData = resumeRes.data;
    setResume(resumeData);
    const canonical = syncCanonicalReportId(resumeData);

    const guidance = resumeGuidanceMessage(resumeData);
    if (guidance) {
      setErr(guidance);
      setLoadPhase("idle");
      return;
    }

    if (!canonical) {
      setErr("표시할 탐사 기록을 찾지 못했어요. 홈에서 다시 시작해 주세요.");
      setLoadPhase("idle");
      return;
    }

    setLoadPhase("loading-report");
    await loadMyReport(canonical, true);
    setLoadPhase("idle");
  }, [reportIdFromUrl, syncCanonicalReportId, loadMyReport]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    basicFetchRef.current = null;
    setBasicError(null);
  }, [reportId]);

  useEffect(() => {
    if (tab !== "basic" || !reportId || !my?.has_survey) return;
    if (my.basic_result?.trim()) return;
    if (basicLoading) return;
    void loadBasicAnalysis(reportId, my.basic_result ?? null);
  }, [
    tab,
    reportId,
    my?.has_survey,
    my?.basic_result,
    basicLoading,
    loadBasicAnalysis,
  ]);

  const freeParagraphs = useMemo(() => {
    const t = (my?.basic_result ?? "").trim();
    if (!t) return [];
    const blocks = t.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    if (blocks.length >= 4) return blocks.slice(0, 4);
    const lines = t.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length >= 4) return lines.slice(0, 4);
    return [t];
  }, [my?.basic_result]);

  const relPendingCount = useMemo(
    () => rels.filter((r) => r.status === "pending").length,
    [rels],
  );
  const relCompletedCount = useMemo(
    () => rels.filter((r) => r.status === "completed").length,
    [rels],
  );

  const relsSorted = useMemo(() => {
    const copy = [...rels];
    copy.sort((a, b) => {
      if (a.status !== b.status)
        return a.status === "pending" ? -1 : 1;
      return a.partner_name.localeCompare(b.partner_name, "ko");
    });
    return copy;
  }, [rels]);

  const showSurveyResumeCta =
    resume != null &&
    resume.hasReport &&
    !resume.surveyCompleted &&
    Boolean(resume.reportId);

  const showHomeCta =
    !loading &&
    (!resume?.hasReport || !resume?.reportId) &&
    resume?.ctaBranch === "start-new";

  async function confirmNewSurvey() {
    if (!reportId) return;
    setResetting(true);
    try {
      const res = await fetch("/api/survey/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert((j as { error?: string }).error ?? "초기화에 실패했어요.");
        return;
      }
      clearBasicResultCache(reportId);
      setConfirmNew(false);
      router.push("/survey");
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <FirstEntryDiagnostics scope="DashboardContent" extra={{ resume, reportId }} />
      <SpaceBackground>
        <div className="relative z-10 min-h-screen px-5 pb-36 pt-10 sm:px-8 sm:pt-14">
          <h1 className="mx-auto mb-12 max-w-md text-center text-2xl font-medium tracking-[-0.02em] text-[var(--space-text)] sm:mb-14 sm:max-w-lg sm:text-[1.65rem]">
            🚀 탐사실
          </h1>

          <div className="mx-auto max-w-md space-y-5 sm:max-w-lg sm:space-y-6">
            {loading ? (
              <p className="text-center text-sm text-[var(--space-text-muted)]">
                {loadPhaseMessage(loadPhase)}
              </p>
            ) : null}

            {!loading && err && !my ? (
              <GlassCard className="space-y-4 text-center">
                <p className="text-sm leading-relaxed text-[var(--space-text-muted)]">
                  {err}
                </p>
                {showSurveyResumeCta && resume?.reportId ? (
                  <GlowButton
                    type="button"
                    className="w-full"
                    onClick={() => {
                      const tok =
                        typeof window !== "undefined"
                          ? localStorage.getItem("inviteToken")?.trim()
                          : "";
                      router.push(
                        tok
                          ? `/survey?token=${encodeURIComponent(tok)}`
                          : "/survey",
                      );
                    }}
                  >
                    설문 이어하기
                  </GlowButton>
                ) : null}
                {showHomeCta || showSurveyResumeCta ? (
                  <GlowButton
                    type="button"
                    variant={showSurveyResumeCta ? "ghost" : "primary"}
                    className="w-full"
                    onClick={() => router.push("/")}
                  >
                    홈으로
                  </GlowButton>
                ) : (
                  <>
                    <GlowButton
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={() => void bootstrap()}
                    >
                      다시 시도
                    </GlowButton>
                    <GlowButton
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => router.push("/sign-in")}
                    >
                      로그인
                    </GlowButton>
                  </>
                )}
              </GlassCard>
            ) : null}

            {!loading && my && reportId ? (
              <>
                <AccordionSection
                  title="내 탐사"
                  open={openMyRecords}
                  onToggle={() => setOpenMyRecords((v) => !v)}
                >
                  <div className="space-y-5">
                    <div
                      className="mx-auto inline-flex w-full max-w-md rounded-full border border-white/15 bg-[#0d121f] p-0.5"
                      role="tablist"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={tab === "basic"}
                        onClick={() => setTab("basic")}
                        className={[
                          "min-h-[36px] flex-1 rounded-full px-4 py-2 text-xs font-semibold transition",
                          tab === "basic"
                            ? "bg-gradient-to-r from-[#D6B46A] to-[#C2A35A] text-[#151515] shadow-[0_8px_20px_rgba(214,180,106,0.24)]"
                            : "text-[var(--space-text-muted)] hover:text-[var(--space-text)]",
                        ].join(" ")}
                      >
                        기본
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={tab === "premium"}
                        onClick={() => setTab("premium")}
                        className={[
                          "min-h-[36px] flex-1 rounded-full px-4 py-2 text-xs font-semibold transition",
                          tab === "premium"
                            ? "bg-gradient-to-r from-[#E5C97B] to-[#D6B46A] text-[#151515] shadow-[0_8px_20px_rgba(214,180,106,0.28)]"
                            : "text-[var(--space-text-muted)] hover:text-[var(--space-text)]",
                        ].join(" ")}
                      >
                        심화
                      </button>
                    </div>

                    <div className="min-h-[180px] rounded-xl border border-white/[0.09] bg-white/[0.025] p-4 sm:p-5">
                      {tab === "basic" ? (
                        !my.has_survey ? (
                          <div className="space-y-3 text-center">
                            <p className="text-sm text-[var(--space-text-muted)]">
                              18문항 설문을 마치면 기본 분석을 볼 수 있어요.
                            </p>
                            <GlowButton
                              type="button"
                              className="w-full"
                              onClick={() => router.push("/survey")}
                            >
                              설문 이어하기
                            </GlowButton>
                          </div>
                        ) : basicLoading ? (
                          <ReportSectionLoading label="18문항 설문을 바탕으로 기본 분석을 만드는 중… (최대 1~2분)" />
                        ) : freeParagraphs.length > 0 ? (
                          <FreeAnalysisCardDeck paragraphs={freeParagraphs} />
                        ) : (
                          <div className="space-y-3 text-center">
                            <p className="text-sm text-[var(--space-text-muted)]">
                              {basicError ??
                                "기본 분석을 불러오지 못했어요."}
                            </p>
                            <GlowButton
                              type="button"
                              variant="secondary"
                              className="w-full"
                              onClick={() => {
                                basicFetchRef.current = null;
                                void loadBasicAnalysis(reportId, null, true);
                              }}
                            >
                              다시 시도
                            </GlowButton>
                          </div>
                        )
                      ) : my.has_premium ? (
                        my.premium_result ? (
                          <UnifiedReportMarkdown content={my.premium_result} />
                        ) : (
                          <div className="space-y-3 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  my.result_paths?.full ??
                                    `/result?id=${encodeURIComponent(reportId)}`,
                                )
                              }
                              className="text-sm text-[#8eb8ff] underline hover:text-[#b8d4ff]"
                            >
                              심화 리포트 전체 보기
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                my.result_paths?.payment ??
                                  `/payment?reportId=${encodeURIComponent(reportId)}`,
                              )
                            }
                            className="text-sm text-[#8eb8ff] underline hover:text-[#b8d4ff]"
                          >
                            심화 구독하기
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionSection>

                <AccordionSection
                  title="관계 탐사실"
                  subtitle={`• 대기 ${relPendingCount} · 완료 ${relCompletedCount}`}
                  open={openRelationships}
                  onToggle={() => setOpenRelationships((v) => !v)}
                >
                  <ul className="space-y-2.5">
                    {relsSorted.length === 0 ? (
                      <li className="py-2 text-center text-sm text-[var(--space-text-muted)]">
                        아직 없어요
                      </li>
                    ) : (
                      relsSorted.map((r, index) => (
                        <li
                          key={
                            r.list_key ??
                            r.relationship_report_id ??
                            `rel-${index}`
                          }
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-3"
                        >
                          <span className="text-sm text-[var(--space-text)]">
                            {r.partner_name}님과의 관계
                          </span>
                          {r.relationship_report_id ? (
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/relationship/${r.relationship_report_id}?viewer=${encodeURIComponent(reportId)}`,
                                )
                              }
                              className="shrink-0 text-xs font-medium text-[#8eb8ff] hover:underline"
                            >
                              보기
                            </button>
                          ) : null}
                        </li>
                      ))
                    )}
                  </ul>
                </AccordionSection>

                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-center sm:gap-4 sm:pt-6">
                  <GlowButton
                    type="button"
                    className="w-full !min-h-[50px] text-[0.9375rem] font-medium sm:max-w-[13.5rem] sm:flex-1"
                    onClick={() => setConfirmNew(true)}
                  >
                    + 새 탐사
                  </GlowButton>
                  <GlowButton
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      router.push(
                        `/relationships?myReportId=${encodeURIComponent(reportId)}`,
                      )
                    }
                    className="w-full !min-h-[50px] text-[0.9375rem] font-medium sm:max-w-[13.5rem] sm:flex-1"
                  >
                    관계 더보기
                  </GlowButton>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {confirmNew ? (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <GlassCard className="max-w-sm space-y-4 !p-5">
              <p className="text-center text-sm leading-relaxed text-[var(--space-text)]">
                기존 설문과 이 화면의 기본 요약이 초기화돼요. 다시 하시겠어요?
              </p>
              <div className="flex flex-col gap-2 sm:flex-row-reverse">
                <GlowButton
                  type="button"
                  disabled={resetting}
                  className="flex-1 text-sm"
                  onClick={() => void confirmNewSurvey()}
                >
                  {resetting ? "처리 중…" : "네, 설문 다시 하기"}
                </GlowButton>
                <GlowButton
                  type="button"
                  variant="ghost"
                  disabled={resetting}
                  onClick={() => setConfirmNew(false)}
                  className="flex-1 text-sm"
                >
                  취소
                </GlowButton>
              </div>
            </GlassCard>
          </div>
        ) : null}
      </SpaceBackground>
    </>
  );
}
