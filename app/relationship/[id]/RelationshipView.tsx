"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";
import GlowButton from "@/components/space/GlowButton";
import RelationshipBasicCards from "@/components/relationship/RelationshipBasicCards";
import RelationshipPremiumCards from "@/components/relationship/RelationshipPremiumCards";
import type { RelationshipPerspective } from "@/components/relationship/RelationshipBasicCards";
import { useCanonicalReportId } from "@/lib/home/useCanonicalReportId";

export default function RelationshipView({
  relationshipReportId,
}: {
  relationshipReportId: string;
}) {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const urlViewerHint = searchParams.get("viewer")?.trim() ?? "";
  const { canonicalReportId: viewerReportId, resolving: canonicalResolving } =
    useCanonicalReportId({
      urlHint: urlViewerHint,
      queryParam: "viewer",
      logContext: "relationship-detail",
    });

  const routeId =
    typeof routeParams?.id === "string"
      ? routeParams.id
      : Array.isArray(routeParams?.id)
        ? routeParams.id[0]
        : "";
  const resolvedRelationshipId =
    relationshipReportId?.trim() || routeId?.trim() || "";

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [detailOk, setDetailOk] = useState(false);
  const [partnerName, setPartnerName] = useState("상대");
  const [viewerName, setViewerName] = useState("");
  const [analysisType, setAnalysisType] = useState<string>("basic");
  const [basic, setBasic] = useState<RelationshipPerspective | null>(null);
  const [premium, setPremium] = useState<RelationshipPerspective | null>(null);

  const load = useCallback(async () => {
    if (canonicalResolving) return;
    if (!viewerReportId) {
      setErr("viewer 쿼리(내 리포트 id)가 필요합니다.");
      setDetailOk(false);
      setLoading(false);
      return;
    }
    if (!resolvedRelationshipId) {
      setErr("관계 분석 주소가 올바르지 않아요.");
      setDetailOk(false);
      setLoading(false);
      return;
    }

    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/relationship/detail?relationshipReportId=${encodeURIComponent(resolvedRelationshipId)}&viewerReportId=${encodeURIComponent(viewerReportId)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setDetailOk(false);
        setErr(data?.error ?? "불러오지 못했어요.");
        return;
      }
      setDetailOk(true);
      setPartnerName(data.partner_name ?? "상대");
      setViewerName(data.viewer_name ?? "");
      setAnalysisType(data.analysis_type ?? "basic");
      setBasic((data.perspective_basic ?? null) as RelationshipPerspective);
      setPremium((data.perspective_premium ?? null) as RelationshipPerspective);
    } finally {
      setLoading(false);
    }
  }, [resolvedRelationshipId, viewerReportId, canonicalResolving]);

  useEffect(() => {
    void load();
  }, [load]);

  const basicAttempted = useRef(false);

  useEffect(() => {
    basicAttempted.current = false;
  }, [resolvedRelationshipId]);

  const ensureBasic = useCallback(async () => {
    if (!viewerReportId || !resolvedRelationshipId) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/relationship/analyze/basic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationship_report_id: resolvedRelationshipId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error ?? "기본 분석 실패");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }, [viewerReportId, resolvedRelationshipId, load]);

  useEffect(() => {
    if (loading || !detailOk || !viewerReportId || !resolvedRelationshipId)
      return;
    if (basic && Object.keys(basic).length > 0) return;
    if (basicAttempted.current) return;
    basicAttempted.current = true;
    void ensureBasic();
  }, [
    loading,
    basic,
    detailOk,
    viewerReportId,
    resolvedRelationshipId,
    ensureBasic,
  ]);

  function retryAnalysis() {
    basicAttempted.current = false;
    setErr(null);
    void ensureBasic();
  }

  const runPremium = async () => {
    if (!resolvedRelationshipId) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/relationship/analyze/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationship_report_id: resolvedRelationshipId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error ?? "심화 분석 실패");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!viewerReportId) {
    return (
      <SpaceBackground>
        <div className="relative z-10 mx-auto max-w-lg px-4 py-16">
          <GlassCard>
            <p className="text-center text-sm text-[var(--space-text-muted)]">
              주소에 내 리포트 id가 필요해요. 예:{" "}
              <code className="text-[var(--space-text)]">?viewer=리포트UUID</code>
            </p>
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

  if (!resolvedRelationshipId) {
    return (
      <SpaceBackground>
        <div className="relative z-10 mx-auto max-w-lg px-4 py-16">
          <GlassCard>
            <p className="text-center text-sm text-[var(--space-text-muted)]">
              관계 분석 id를 찾을 수 없어요.
            </p>
            <GlowButton
              type="button"
              className="mt-6 w-full"
              onClick={() => router.back()}
            >
              돌아가기
            </GlowButton>
          </GlassCard>
        </div>
      </SpaceBackground>
    );
  }

  return (
    <SpaceBackground>
      <div className="relative z-10 mx-auto max-w-lg px-4 py-10 pb-24 sm:max-w-xl">
        <header className="mb-8 space-y-2 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--space-text-muted)]">
            Relationship
          </p>
          <h1 className="text-2xl font-semibold text-[var(--space-text)]">
            관계 기본 분석
          </h1>
          <p className="text-sm text-[var(--space-text-muted)]">
            {viewerName ? (
              <>
                <span className="text-[var(--space-text)]">{viewerName}</span>
                님이 보는 ·{" "}
                <span className="text-[var(--space-text)]">{partnerName}</span>
                님과의 관계를 네 축으로 정리했어요.
              </>
            ) : (
              <>{partnerName}님과의 관계를 네 축으로 정리했어요.</>
            )}
          </p>
        </header>

        {err && (
          <div className="mb-4 space-y-3">
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-200">
              {err}
            </p>
            <GlowButton
              type="button"
              className="w-full border border-[var(--space-border)] bg-white/[0.04] !shadow-none"
              disabled={busy}
              onClick={() => retryAnalysis()}
            >
              {busy ? "처리 중…" : "다시 시도"}
            </GlowButton>
          </div>
        )}

        {loading ? (
          <p className="text-center text-sm text-[var(--space-text-muted)]">
            불러오는 중…
          </p>
        ) : (
          <>
            <RelationshipBasicCards
              perspective={basic}
              partnerName={partnerName}
              viewerName={viewerName}
            />

            {(!basic || Object.keys(basic).length === 0) && !err ? (
              <div className="mt-4">
                <GlowButton
                  type="button"
                  className="w-full"
                  disabled={busy}
                  onClick={() => retryAnalysis()}
                >
                  {busy ? "만드는 중…" : "기본 분석 만들기"}
                </GlowButton>
              </div>
            ) : null}

            {analysisType === "premium" && (
              <div className="mt-10">
                <RelationshipPremiumCards
                  perspective={premium}
                  partnerName={partnerName}
                  viewerName={viewerName}
                />
                {!premium || Object.keys(premium).length === 0 ? (
                  <div className="mt-4 text-center">
                    <GlowButton
                      type="button"
                      className="w-full"
                      disabled={busy}
                      onClick={() => void runPremium()}
                    >
                      {busy
                        ? "심화 분석 생성 중…"
                        : "관계 심화 분석 생성하기"}
                    </GlowButton>
                  </div>
                ) : null}
              </div>
            )}

            {analysisType === "basic" && (
              <p className="mt-8 text-center text-xs text-[var(--space-text-muted)]">
                심화 관계 분석은 업그레이드 후에 열려요.
              </p>
            )}

            <GlowButton
              type="button"
              className="mt-8 w-full border border-[var(--space-border)] bg-white/[0.04] !shadow-none"
              onClick={() => router.back()}
            >
              돌아가기
            </GlowButton>
          </>
        )}
      </div>
    </SpaceBackground>
  );
}
