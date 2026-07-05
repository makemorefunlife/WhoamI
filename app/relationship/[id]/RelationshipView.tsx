"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";
import GlowButton from "@/components/space/GlowButton";
import RelationshipBasicCards from "@/components/relationship/RelationshipBasicCards";
import RelationshipPremiumCards from "@/components/relationship/RelationshipPremiumCards";
import RelationshipAnalysisHistory, {
  FavoriteHeartButton,
  type AnalysisLogListItem,
} from "@/components/relationship/RelationshipAnalysisHistory";
import RelationshipKindTabs from "@/components/relationship/RelationshipKindTabs";
import RomanticSajuDeepReportView from "@/components/relationship/RomanticSajuDeepReportView";
import WorkColleagueReportView from "@/components/relationship/WorkColleagueReportView";
import MarriageReportView from "@/components/relationship/MarriageReportView";
import FamilyParentReportView from "@/components/relationship/FamilyParentReportView";
import type { RelationshipPerspective } from "@/components/relationship/RelationshipBasicCards";
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { ROMANTIC_SAJU_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import { WORK_COLLEAGUE_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/workColleague";
import type { MarriageReportBody } from "@/lib/relationship/marriage/buildMarriageReport";
import { COHABITATION_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/cohabitation";
import type { FamilyParentReportBody } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import { FAMILY_PARENT_CHILD_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/familyParentChild";
import type { FamilyParentRole } from "@/lib/relationship/familyParent/types";
import { relationshipPremiumPreviewEnabled } from "@/lib/relationship/premiumPreview";
import {
  parseRelationshipKind,
  RELATIONSHIP_KIND_LABELS,
  type RelationshipKind,
} from "@/lib/relationship/relationshipKind";
import { useCanonicalReportId } from "@/lib/home/useCanonicalReportId";

const premiumPreview = relationshipPremiumPreviewEnabled();

export default function RelationshipView({
  relationshipReportId,
}: {
  relationshipReportId: string;
}) {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const urlViewerHint = searchParams.get("viewer")?.trim() ?? "";
  const urlKindHint = searchParams.get("kind")?.trim() ?? "";
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
  const [romanticDeep, setRomanticDeep] = useState<
    RomanticSajuDeepReport["report"] | null
  >(null);
  const [workDeep, setWorkDeep] = useState<WorkColleagueReportBody | null>(
    null,
  );
  const [cohabitationDeep, setCohabitationDeep] =
    useState<MarriageReportBody | null>(null);
  const [familyDeep, setFamilyDeep] = useState<FamilyParentReportBody | null>(
    null,
  );
  const [familyParentType, setFamilyParentType] =
    useState<FamilyParentRole>("mother");
  const [familyChildIsViewer, setFamilyChildIsViewer] = useState(false);
  const [reportIdA, setReportIdA] = useState("");
  const [reportIdB, setReportIdB] = useState("");
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [premiumKind, setPremiumKind] = useState<RelationshipKind>(() =>
    parseRelationshipKind(urlKindHint || undefined),
  );
  const premiumKindRef = useRef<RelationshipKind>(
    parseRelationshipKind(urlKindHint || undefined),
  );
  premiumKindRef.current = premiumKind;
  const [favorited, setFavorited] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [logs, setLogs] = useState<AnalysisLogListItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [snapshotView, setSnapshotView] = useState<{
    logId: string;
    kind?: RelationshipKind;
    basic?: RelationshipPerspective | null;
    premium?: RelationshipPerspective | null;
    romanticDeep?: RomanticSajuDeepReport["report"] | null;
    workDeep?: WorkColleagueReportBody | null;
    cohabitationDeep?: MarriageReportBody | null;
    familyDeep?: FamilyParentReportBody | null;
  } | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!viewerReportId || !resolvedRelationshipId) return;
    setLogsLoading(true);
    try {
      const res = await fetch(
        `/api/relationship/logs?relationshipReportId=${encodeURIComponent(resolvedRelationshipId)}&viewerReportId=${encodeURIComponent(viewerReportId)}`,
      );
      const data = await res.json();
      if (res.ok) setLogs((data.logs ?? []) as AnalysisLogListItem[]);
    } finally {
      setLogsLoading(false);
    }
  }, [resolvedRelationshipId, viewerReportId]);

  const load = useCallback(async (kindOverride?: RelationshipKind) => {
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
      const kind = kindOverride ?? premiumKindRef.current;
      const res = await fetch(
        `/api/relationship/detail?relationshipReportId=${encodeURIComponent(resolvedRelationshipId)}&viewerReportId=${encodeURIComponent(viewerReportId)}&relationshipKind=${encodeURIComponent(kind)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setDetailOk(false);
        setErr(data?.error ?? "불러오지 못했어요.");
        return;
      }
      setSnapshotView(null);
      setDetailOk(true);
      setPartnerName(data.partner_name ?? "상대");
      setViewerName(data.viewer_name ?? "");
      setAnalysisType(data.analysis_type ?? "basic");
      setPremiumKind(parseRelationshipKind(data.relationship_kind));
      setBasic((data.perspective_basic ?? null) as RelationshipPerspective);
      setPremium((data.perspective_premium ?? null) as RelationshipPerspective);
      setRomanticDeep(
        (data.romantic_deep_report ?? null) as RomanticSajuDeepReport["report"] | null,
      );
      setWorkDeep(
        (data.work_colleague_deep_report ?? null) as WorkColleagueReportBody | null,
      );
      setCohabitationDeep(
        (data.cohabitation_deep_report ?? null) as MarriageReportBody | null,
      );
      setFamilyDeep(
        (data.family_deep_report ?? null) as FamilyParentReportBody | null,
      );
      setReportIdA(data.report_id_a ?? "");
      setReportIdB(data.report_id_b ?? "");
      setNameA(data.person_a_name ?? data.viewer_name ?? "A");
      setNameB(data.person_b_name ?? data.partner_name ?? "B");
      setFavorited(Boolean(data.is_favorite));
      void fetchLogs();
    } finally {
      setLoading(false);
    }
  }, [resolvedRelationshipId, viewerReportId, canonicalResolving, fetchLogs]);

  useEffect(() => {
    void load();
  }, [load]);

  const basicAttempted = useRef(false);
  const premiumPreviewAutoDone = useRef(false);

  useEffect(() => {
    basicAttempted.current = false;
    premiumPreviewAutoDone.current = false;
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
          viewer_report_id: viewerReportId,
          relationship_kind: premiumKindRef.current,
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
  }, [viewerReportId, resolvedRelationshipId, load, premiumKind]);

  const toggleFavorite = useCallback(async () => {
    if (!viewerReportId || !resolvedRelationshipId) return;
    const next = !favorited;
    setFavorited(next);
    setFavoriteBusy(true);
    try {
      const res = await fetch("/api/relationship/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationship_report_id: resolvedRelationshipId,
          viewer_report_id: viewerReportId,
          favorited: next,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        favorited?: boolean;
      };
      if (!res.ok) {
        setFavorited(!next);
        setErr(data?.error ?? "즐겨찾기 저장에 실패했어요.");
        return;
      }
      setFavorited(Boolean(data.favorited));
    } finally {
      setFavoriteBusy(false);
    }
  }, [viewerReportId, resolvedRelationshipId, favorited]);

  const viewAnalysisLog = useCallback((log: AnalysisLogListItem) => {
    const snap = log.result_snapshot ?? {};
    if (log.result_format === ROMANTIC_SAJU_DEEP_FORMAT) {
      const report = snap.report as RomanticSajuDeepReport["report"] | undefined;
      setSnapshotView({
        logId: log.id,
        kind: "romantic",
        romanticDeep: report ?? null,
        workDeep: null,
        cohabitationDeep: null,
        premium: null,
      });
      setPremiumKind("romantic");
      return;
    }
    if (log.result_format === WORK_COLLEAGUE_DEEP_FORMAT) {
      const report = snap.report as WorkColleagueReportBody | undefined;
      setSnapshotView({
        logId: log.id,
        kind: "work",
        workDeep: report ?? null,
        romanticDeep: null,
        cohabitationDeep: null,
        premium: null,
      });
      setPremiumKind("work");
      return;
    }
    if (log.result_format === COHABITATION_DEEP_FORMAT) {
      const report = snap.report as MarriageReportBody | undefined;
      setSnapshotView({
        logId: log.id,
        kind: "cohabitation",
        cohabitationDeep: report ?? null,
        romanticDeep: null,
        workDeep: null,
        premium: null,
      });
      setPremiumKind("cohabitation");
      return;
    }
    if (log.analysis_level === "premium") {
      const kind =
        log.relationship_kind !== "unspecified"
          ? parseRelationshipKind(log.relationship_kind)
          : premiumKindRef.current;
      setSnapshotView({
        logId: log.id,
        kind,
        premium: (snap.perspective ?? null) as RelationshipPerspective | null,
        romanticDeep: null,
      });
      setPremiumKind(kind);
      return;
    }
    setSnapshotView({
      logId: log.id,
      basic: (snap.perspective ?? null) as RelationshipPerspective | null,
    });
  }, []);

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

  const runPremium = useCallback(
    async (
      kind: RelationshipKind = premiumKind,
      options?: { forceRegenerate?: boolean },
    ) => {
      if (!resolvedRelationshipId) return false;
      const forceRegenerate = options?.forceRegenerate === true;
      if (forceRegenerate) {
        setSnapshotView(null);
        if (kind === "romantic") {
          setRomanticDeep(null);
        } else if (kind === "work") {
          setWorkDeep(null);
        } else if (kind === "cohabitation") {
          setCohabitationDeep(null);
        } else if (kind === "family") {
          setFamilyDeep(null);
        } else {
          setPremium(null);
        }
      }
      setBusy(true);
      setErr(null);
      try {
        const res = await fetch("/api/relationship/analyze/premium", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            relationship_report_id: resolvedRelationshipId,
            relationship_kind: kind,
            viewer_report_id: viewerReportId,
            force_regenerate: forceRegenerate,
            ...(kind === "family"
              ? {
                  parent_type: familyParentType,
                  child_is_viewer: familyChildIsViewer,
                }
              : {}),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErr(data?.error ?? "심화 분석 실패");
          return false;
        }
        if (kind === "romantic" && data.result_premium?.report) {
          setRomanticDeep(
            data.result_premium.report as RomanticSajuDeepReport["report"],
          );
        } else if (kind === "work") {
          const prem = data.result_premium;
          if (
            prem?.format === WORK_COLLEAGUE_DEEP_FORMAT &&
            prem?.report?.snapshot_panel
          ) {
            setWorkDeep(prem.report as WorkColleagueReportBody);
          } else if (!forceRegenerate && prem?.perspectives) {
            return runPremium(kind, { forceRegenerate: true });
          }
        } else if (kind === "cohabitation") {
          const prem = data.result_premium;
          if (
            prem?.format === COHABITATION_DEEP_FORMAT &&
            prem?.report?.snapshot_panel
          ) {
            setCohabitationDeep(prem.report as MarriageReportBody);
          } else if (!forceRegenerate && prem?.perspectives) {
            return runPremium(kind, { forceRegenerate: true });
          }
        } else if (kind === "family") {
          const prem = data.result_premium;
          if (
            prem?.format === FAMILY_PARENT_CHILD_DEEP_FORMAT &&
            prem?.report?.family?.section_child_dna
          ) {
            setFamilyDeep(prem.report as FamilyParentReportBody);
          } else if (!forceRegenerate && prem?.perspectives) {
            return runPremium(kind, { forceRegenerate: true });
          }
        } else if (data.result_premium?.perspectives && viewerReportId) {
          const slice =
            data.result_premium.perspectives[viewerReportId] ?? null;
          if (slice && typeof slice === "object") {
            setPremium(slice as RelationshipPerspective);
          }
        }
        await load(kind);
        return true;
      } finally {
        setBusy(false);
      }
    },
    [resolvedRelationshipId, load, premiumKind, viewerReportId, familyParentType, familyChildIsViewer],
  );

  function regeneratePremium() {
    const label = RELATIONSHIP_KIND_LABELS[premiumKind];
    if (
      !window.confirm(
        `기존 ${label} 심화 분석을 새 프롬프트로 다시 만들까요?\n(1~2분 걸릴 수 있어요. 이전 결과는 분석 기록에 남아 있어요.)`,
      )
    ) {
      return;
    }
    void runPremium(premiumKind, { forceRegenerate: true });
  }

  const ensurePremiumPreview = useCallback(async () => {
    if (!resolvedRelationshipId || !premiumPreview) return;
    setBusy(true);
    setErr(null);
    try {
      const up = await fetch("/api/relationship/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationship_report_id: resolvedRelationshipId,
          preview: true,
        }),
      });
      const upData = await up.json();
      if (!up.ok) {
        setErr(upData?.error ?? "업그레이드 실패");
        return;
      }
      setAnalysisType("premium");
      await runPremium(premiumKind);
    } finally {
      setBusy(false);
    }
  }, [resolvedRelationshipId, runPremium, premiumKind]);

  const onPremiumKindChange = useCallback(
    (kind: RelationshipKind) => {
      setSnapshotView(null);
      setPremiumKind(kind);
      setPremium(null);
      setRomanticDeep(null);
      setWorkDeep(null);
      setCohabitationDeep(null);
      setFamilyDeep(null);
      if (viewerReportId && resolvedRelationshipId) {
        const q = new URLSearchParams({
          viewer: viewerReportId,
          kind,
        });
        router.replace(
          `/relationship/${resolvedRelationshipId}?${q.toString()}`,
          { scroll: false },
        );
      }
      void load(kind);
    },
    [load, router, viewerReportId, resolvedRelationshipId],
  );

  const displayBasic =
    snapshotView?.basic !== undefined ? snapshotView.basic : basic;
  const displayPremium =
    snapshotView?.premium !== undefined ? snapshotView.premium : premium;
  const displayRomanticDeep =
    snapshotView?.romanticDeep !== undefined
      ? snapshotView.romanticDeep
      : romanticDeep;
  const displayWorkDeep =
    snapshotView?.workDeep !== undefined ? snapshotView.workDeep : workDeep;
  const displayCohabitationDeep =
    snapshotView?.cohabitationDeep !== undefined
      ? snapshotView.cohabitationDeep
      : cohabitationDeep;
  const displayFamilyDeep =
    snapshotView?.familyDeep !== undefined
      ? snapshotView.familyDeep
      : familyDeep;

  const premiumReady =
    premiumKind === "romantic"
      ? Boolean(displayRomanticDeep?.section_1_summary)
      : premiumKind === "work"
        ? Boolean(displayWorkDeep?.snapshot_panel)
        : premiumKind === "cohabitation"
          ? Boolean(displayCohabitationDeep?.snapshot_panel)
          : premiumKind === "family"
            ? Boolean(displayFamilyDeep?.family?.section_child_dna)
            : Boolean(displayPremium && Object.keys(displayPremium).length > 0);

  useEffect(() => {
    if (!premiumPreview || loading || !detailOk || !resolvedRelationshipId) return;
    if (!basic || Object.keys(basic).length === 0) return;
    if (premium && Object.keys(premium).length > 0) return;
    if (romanticDeep?.section_1_summary) return;
    if (workDeep?.snapshot_panel) return;
    if (cohabitationDeep?.snapshot_panel) return;
    if (premiumPreviewAutoDone.current) return;
    if (premiumKind !== "friendship") return;
    premiumPreviewAutoDone.current = true;
    void ensurePremiumPreview();
  }, [
    premiumPreview,
    loading,
    detailOk,
    resolvedRelationshipId,
    basic,
    premium,
    premiumKind,
    ensurePremiumPreview,
  ]);

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
            {RELATIONSHIP_KIND_LABELS[premiumKind]} 관계 분석
          </h1>
          <p className="text-sm text-[var(--space-text-muted)]">
            {viewerName ? (
              <>
                <span className="text-[var(--space-text)]">{viewerName}</span>
                님이 보는 ·{" "}
                <span className="text-[var(--space-text)]">{partnerName}</span>
                님
              </>
            ) : (
              <>{partnerName}님</>
            )}
          </p>
          <div className="flex justify-center pt-1">
            <FavoriteHeartButton
              favorited={favorited}
              busy={favoriteBusy}
              onToggle={() => void toggleFavorite()}
            />
          </div>
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
            {snapshotView ? (
              <div className="mb-4 flex flex-col gap-2 rounded-xl border border-[#67B7FF]/35 bg-[#67B7FF]/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-center text-xs text-[#9ec8ff] sm:text-left">
                  저장된 분석 기록을 보고 있어요
                </p>
                <button
                  type="button"
                  className="text-xs font-medium text-[#67B7FF] underline-offset-2 hover:underline"
                  onClick={() => {
                    setSnapshotView(null);
                    void load();
                  }}
                >
                  최신 결과로
                </button>
              </div>
            ) : null}

            <RelationshipKindTabs
              value={premiumKind}
              onChange={onPremiumKindChange}
              disabled={busy}
            />

            {premiumKind === "family" ? (
              <div className="mt-3 rounded-xl border border-[#9ed4b8]/25 bg-[#9ed4b8]/5 p-3">
                <p className="mb-2 text-[11px] font-semibold text-[#9ed4b8]">
                  👪 Child DNA Playbook · 역할 선택
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      familyParentType === "mother"
                        ? "bg-[#9ed4b8]/25 text-white"
                        : "bg-white/5 text-[var(--space-text-muted)] hover:bg-white/10"
                    }`}
                    onClick={() => setFamilyParentType("mother")}
                  >
                    🌸 엄마 렌즈
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      familyParentType === "father"
                        ? "bg-[#9ed4b8]/25 text-white"
                        : "bg-white/5 text-[var(--space-text-muted)] hover:bg-white/10"
                    }`}
                    onClick={() => setFamilyParentType("father")}
                  >
                    🛡️ 아빠 렌즈
                  </button>
                </div>
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-[11px] text-[var(--space-text-muted)]">
                  <input
                    type="checkbox"
                    checked={familyChildIsViewer}
                    onChange={(e) => setFamilyChildIsViewer(e.target.checked)}
                    disabled={busy}
                    className="rounded border-white/20"
                  />
                  분석 대상 자녀가 &apos;나&apos;({viewerName || "시청자"})예요
                </label>
                {reportIdA && reportIdB ? (
                  <p className="mt-1 text-[10px] text-white/40">
                    parentType: {familyParentType} · 자녀=
                    {familyChildIsViewer ? viewerName || "나" : partnerName}
                  </p>
                ) : null}
              </div>
            ) : null}

            <RelationshipBasicCards
              perspective={displayBasic}
              partnerName={partnerName}
              viewerName={viewerName}
            />

            {(!displayBasic || Object.keys(displayBasic).length === 0) &&
            !err &&
            !snapshotView ? (
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

            {(analysisType === "premium" || premiumPreview) && (
              <div className="mt-10">
                {busy ? (
                  <p className="mb-4 text-center text-xs text-[#ffd6a5]/80">
                    심화 관계 분석을 생성하고 있어요… (1~2분 걸릴 수 있어요)
                  </p>
                ) : null}
                {premiumKind === "romantic" && displayRomanticDeep ? (
                  <div className="space-y-3 rounded-2xl border border-[#ffd6a5]/25 bg-gradient-to-b from-[var(--space-card)]/90 to-[#0a0f1a]/40 p-3 sm:p-4">
                    <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ffd6a5]/90">
                      Premium · 연인 사주 심화
                    </p>
                    <RomanticSajuDeepReportView
                      report={displayRomanticDeep}
                      nameA={nameA}
                      nameB={nameB}
                    />
                  </div>
                ) : premiumKind === "romantic" ? (
                  <div className="space-y-3 rounded-2xl border border-[#ffd6a5]/25 bg-gradient-to-b from-[var(--space-card)]/90 to-[#0a0f1a]/40 p-3 sm:p-4">
                    <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ffd6a5]/90">
                      Premium · 연인 사주 심화
                    </p>
                    <p className="py-6 text-center text-sm text-[var(--space-text-muted)]">
                      아직 연인 사주 심화 분석이 없어요.
                      <br />
                      <span className="text-xs">아래 버튼으로 생성할 수 있어요.</span>
                    </p>
                  </div>
                ) : premiumKind === "work" && displayWorkDeep ? (
                  <div className="space-y-3 rounded-2xl border border-[#67b7ff]/25 bg-gradient-to-b from-[var(--space-card)]/90 to-[#0a0f1a]/40 p-3 sm:p-4">
                    <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#67b7ff]/90">
                      Premium · 동료·비즈니스 파트너
                    </p>
                    <WorkColleagueReportView report={displayWorkDeep} />
                  </div>
                ) : premiumKind === "work" ? (
                  <div className="space-y-3 rounded-2xl border border-[#67b7ff]/25 bg-gradient-to-b from-[var(--space-card)]/90 to-[#0a0f1a]/40 p-3 sm:p-4">
                    <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#67b7ff]/90">
                      Premium · 동료·비즈니스 파트너
                    </p>
                    <p className="py-6 text-center text-sm text-[var(--space-text-muted)]">
                      아직 동료 심화 분석이 없어요.
                      <br />
                      <span className="text-xs">아래 버튼으로 생성할 수 있어요.</span>
                    </p>
                  </div>
                ) : premiumKind === "cohabitation" && displayCohabitationDeep ? (
                  <div className="space-y-3 rounded-2xl border border-[#d4a5e8]/25 bg-gradient-to-b from-[var(--space-card)]/90 to-[#0a0f1a]/40 p-3 sm:p-4">
                    <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d4a5e8]/90">
                      Premium · 동거·결혼 하우스홀드
                    </p>
                    <MarriageReportView report={displayCohabitationDeep} />
                  </div>
                ) : premiumKind === "cohabitation" ? (
                  <div className="space-y-3 rounded-2xl border border-[#d4a5e8]/25 bg-gradient-to-b from-[var(--space-card)]/90 to-[#0a0f1a]/40 p-3 sm:p-4">
                    <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d4a5e8]/90">
                      Premium · 동거·결혼 하우스홀드
                    </p>
                    <p className="py-6 text-center text-sm text-[var(--space-text-muted)]">
                      아직 동거·결혼 심화 분석이 없어요.
                      <br />
                      <span className="text-xs">아래 버튼으로 생성할 수 있어요.</span>
                    </p>
                  </div>
                ) : premiumKind === "family" && displayFamilyDeep ? (
                  <div className="space-y-3 rounded-2xl border border-[#9ed4b8]/25 bg-gradient-to-b from-[var(--space-card)]/90 to-[#0a0f1a]/40 p-3 sm:p-4">
                    <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9ed4b8]/90">
                      Premium · Child DNA Playbook
                    </p>
                    <FamilyParentReportView report={displayFamilyDeep} />
                  </div>
                ) : premiumKind === "family" ? (
                  <div className="space-y-3 rounded-2xl border border-[#9ed4b8]/25 bg-gradient-to-b from-[var(--space-card)]/90 to-[#0a0f1a]/40 p-3 sm:p-4">
                    <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9ed4b8]/90">
                      Premium · Child DNA Playbook
                    </p>
                    <p className="py-6 text-center text-sm text-[var(--space-text-muted)]">
                      아직 가족 Child DNA 분석이 없어요.
                      <br />
                      <span className="text-xs">
                        위에서 엄마/아빠 렌즈를 고른 뒤 생성하세요.
                      </span>
                    </p>
                  </div>
                ) : (
                  <RelationshipPremiumCards
                    perspective={displayPremium}
                    partnerName={partnerName}
                    viewerName={viewerName}
                  />
                )}
                {!premiumReady && !snapshotView ? (
                  <div className="mt-4 space-y-2 text-center">
                    {premiumPreview ? (
                      <p className="text-[11px] text-[var(--space-text-muted)]">
                        출생 정보가 부족하면 심화 분석이 제한될 수 있어요.
                      </p>
                    ) : null}
                    <GlowButton
                      type="button"
                      className="w-full"
                      disabled={busy}
                      onClick={() =>
                        void (premiumPreview
                          ? ensurePremiumPreview()
                          : runPremium(premiumKind))
                      }
                    >
                      {busy
                        ? "심화 분석 생성 중…"
                        : `${RELATIONSHIP_KIND_LABELS[premiumKind]} 관계 심화 분석 생성하기`}
                    </GlowButton>
                  </div>
                ) : premiumReady && !snapshotView ? (
                  <div className="mt-4 space-y-2 text-center">
                    <button
                      type="button"
                      disabled={busy}
                      className="w-full rounded-xl border border-[#ffd6a5]/35 bg-[#ffd6a5]/8 py-2.5 text-sm font-medium text-[#ffd6a5] transition hover:bg-[#ffd6a5]/12 disabled:opacity-50"
                      onClick={regeneratePremium}
                    >
                      {busy
                        ? "심화 분석 다시 생성 중…"
                        : `${RELATIONSHIP_KIND_LABELS[premiumKind]} 심화 분석 다시 만들기`}
                    </button>
                    <p className="text-[10px] text-[var(--space-text-muted)]">
                      새 프롬프트로 다시 생성해요. 이전 결과는 아래 분석 기록에서 볼 수 있어요.
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {analysisType === "basic" && !premiumPreview && (
              <p className="mt-8 text-center text-xs text-[var(--space-text-muted)]">
                심화 관계 분석은 업그레이드 후에 열려요.
              </p>
            )}

            <GlassCard className="mt-10 space-y-3">
              <h2 className="text-sm font-semibold text-[#67B7FF]">
                분석 기록
              </h2>
              <RelationshipAnalysisHistory
                logs={logs}
                loading={logsLoading}
                selectedLogId={snapshotView?.logId ?? null}
                onSelectLog={viewAnalysisLog}
              />
            </GlassCard>

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
