"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";
import GlowButton from "@/components/space/GlowButton";
import FreeAnalysisCardDeck from "@/components/report/FreeAnalysisCardDeck";
import UnifiedReportMarkdown from "@/components/report/UnifiedReportMarkdown";

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
  partner_name: string;
  status: "completed" | "pending";
  relationship_report_id: string | null;
};

function AccordionSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/12 bg-[rgba(10,14,24,0.45)] shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5 text-left transition hover:bg-white/[0.04]"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-[var(--space-text)]">
          {title}
        </span>
        <span
          className="shrink-0 text-xs text-[var(--space-text-muted)] tabular-nums"
          aria-hidden
        >
          {open ? "▼" : "▶"}
        </span>
      </button>
      {open ? (
        <div className="border-t border-white/[0.06] px-3 py-4 sm:px-4">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export default function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportIdFromUrl = searchParams.get("reportId")?.trim() ?? "";

  const [reportId, setReportId] = useState(reportIdFromUrl);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [my, setMy] = useState<MyReportJson | null>(null);
  const [rels, setRels] = useState<RelSimple[]>([]);
  const [tab, setTab] = useState<"basic" | "premium">("basic");
  const [confirmNew, setConfirmNew] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [openMyRecords, setOpenMyRecords] = useState(true);
  const [openRelationships, setOpenRelationships] = useState(true);

  useEffect(() => {
    if (reportIdFromUrl) {
      setReportId(reportIdFromUrl);
      if (typeof window !== "undefined") {
        localStorage.setItem("reportId", reportIdFromUrl);
      }
      return;
    }
    const ls =
      typeof window !== "undefined"
        ? localStorage.getItem("reportId")?.trim() ?? ""
        : "";
    if (ls) setReportId(ls);
  }, [reportIdFromUrl]);

  const load = useCallback(async () => {
    if (!reportId) {
      setErr("reportId가 없어요. URL에 ?reportId= 또는 홈에서 탐사를 시작해 주세요.");
      setLoading(false);
      setMy(null);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/my/report?reportId=${encodeURIComponent(reportId)}`),
        fetch(
          `/api/relationship/list?reportId=${encodeURIComponent(reportId)}&limit=3&format=simple&scope=completed`,
        ),
      ]);

      const j1 = await r1.json();
      if (!r1.ok) {
        setErr(j1?.error ?? "내 리포트를 불러오지 못했어요.");
        setMy(null);
        return;
      }
      setMy(j1 as MyReportJson);

      const j2 = await r2.json();
      if (r2.ok) {
        setRels((j2.relationships ?? []) as RelSimple[]);
      } else {
        setRels([]);
      }
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    void load();
  }, [load]);

  const freeParagraphs = useMemo(() => {
    const t = (my?.basic_result ?? "").trim();
    if (!t) return [];
    const blocks = t.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    if (blocks.length >= 4) return blocks.slice(0, 4);
    const lines = t.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length >= 4) return lines.slice(0, 4);
    return [t];
  }, [my?.basic_result]);

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
      setConfirmNew(false);
      router.push("/survey");
    } finally {
      setResetting(false);
    }
  }

  if (!reportId && !loading) {
    return (
      <SpaceBackground>
        <div className="relative z-10 mx-auto max-w-lg px-4 py-16">
          <GlassCard className="text-center">
            <p className="text-sm text-[var(--space-text-muted)]">{err}</p>
            <GlowButton
              type="button"
              className="mt-6 w-full"
              onClick={() => router.push("/")}
            >
              홈으로
            </GlowButton>
          </GlassCard>
        </div>
      </SpaceBackground>
    );
  }

  return (
    <SpaceBackground>
      <div className="relative z-10 min-h-screen px-4 pb-32 pt-6 sm:px-6">
        <h1 className="mx-auto mb-8 max-w-lg text-center text-lg font-semibold text-[var(--space-text)] sm:max-w-xl sm:text-xl">
          🚀 나의 탐사실
        </h1>

        <div className="mx-auto max-w-lg space-y-4 sm:max-w-xl">
          {loading ? (
            <p className="text-center text-sm text-[var(--space-text-muted)]">
              불러오는 중…
            </p>
          ) : err ? (
            <GlassCard>
              <p className="text-center text-sm text-[var(--space-text-muted)]">
                {err}
              </p>
            </GlassCard>
          ) : null}

          {!loading && my && (
            <>
              <AccordionSection
                title="📊 내 탐사 기록"
                open={openMyRecords}
                onToggle={() => setOpenMyRecords((v) => !v)}
              >
                <div className="space-y-4">
                  <p className="text-center text-xs text-[var(--space-text-muted)]">
                    {my.name}님
                  </p>
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
                          ? "bg-gradient-to-r from-[#6bb5ff] to-[#4a90e2] text-[#0a0f1a] shadow-md"
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
                          ? "bg-gradient-to-r from-[#ffd6a5] to-[#e8a85c] text-[#1a1208] shadow-md"
                          : "text-[var(--space-text-muted)] hover:text-[var(--space-text)]",
                      ].join(" ")}
                    >
                      심화
                    </button>
                  </div>

                  <div className="min-h-[180px] rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
                    {tab === "basic" ? (
                      !my.has_survey ? (
                        <p className="text-center text-sm text-[var(--space-text-muted)]">
                          설문을 마치면 기본 결과가 열려요.
                        </p>
                      ) : freeParagraphs.length > 0 ? (
                        <FreeAnalysisCardDeck paragraphs={freeParagraphs} />
                      ) : (
                        <div className="space-y-3 text-center">
                          <p className="text-sm text-[var(--space-text-muted)]">
                            여기서 불러오지 못했어요.
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                my.result_paths?.basic ??
                                  `/result?id=${encodeURIComponent(reportId)}`,
                              )
                            }
                            className="text-sm text-[#8eb8ff] underline hover:text-[#b8d4ff]"
                          >
                            기본 결과 페이지 열기
                          </button>
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
                                  `/report?id=${encodeURIComponent(reportId)}`,
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
                title="👥 관계 탐사실"
                open={openRelationships}
                onToggle={() => setOpenRelationships((v) => !v)}
              >
                <ul className="space-y-2">
                  {rels.length === 0 ? (
                    <li className="text-center text-sm text-[var(--space-text-muted)]">
                      완료된 관계가 없어요.
                    </li>
                  ) : (
                    rels.map((r) => (
                      <li
                        key={r.relationship_report_id ?? r.partner_name}
                        className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5"
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

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
                <GlowButton
                  type="button"
                  className="w-full !min-h-[48px] text-sm sm:max-w-xs sm:flex-1"
                  onClick={() => setConfirmNew(true)}
                >
                  새로운 탐사하기
                </GlowButton>
                <GlowButton
                  type="button"
                  className="w-full !min-h-[48px] text-sm sm:max-w-xs sm:flex-1"
                  onClick={() =>
                    router.push(
                      `/relationships?myReportId=${encodeURIComponent(reportId)}`,
                    )
                  }
                >
                  + 새로운 관계 탐사 시작
                </GlowButton>
              </div>
            </>
          )}
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
              <button
                type="button"
                disabled={resetting}
                onClick={() => setConfirmNew(false)}
                className="flex-1 rounded-xl border border-white/18 py-2.5 text-sm text-[var(--space-text-muted)] hover:bg-white/[0.05]"
              >
                취소
              </button>
            </div>
          </GlassCard>
        </div>
      ) : null}
    </SpaceBackground>
  );
}
