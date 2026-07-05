"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";
import GlowButton from "@/components/space/GlowButton";
import InviteShareButtons from "@/components/relationship/InviteShareButtons";
import ManualRelationshipForm from "@/components/relationship/ManualRelationshipForm";
import RelationshipCard, {
  type RelationshipListItem,
} from "@/components/relationship/RelationshipCard";
import { useCanonicalReportId } from "@/lib/home/useCanonicalReportId";

const WAITING_VISIBLE = 3;

export default function RelationshipsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlMyReportHint =
    searchParams.get("myReportId")?.trim() ||
    searchParams.get("reportId")?.trim() ||
    "";
  const hubSection = searchParams.get("section")?.trim() ?? "";
  const { canonicalReportId: myReportId, resolving: canonicalResolving } =
    useCanonicalReportId({
      urlHint: urlMyReportHint,
      queryParam: "myReportId",
      logContext: "relationships-hub",
      syncToUrl: false,
    });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<RelationshipListItem[]>([]);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualBusy, setManualBusy] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [showAllWaiting, setShowAllWaiting] = useState(false);
  const [freshInviteToken, setFreshInviteToken] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);
  const [highlightRrId, setHighlightRrId] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteBusyId, setFavoriteBusyId] = useState<string | null>(null);

  /** 리포트 화면에서 넘어온 myReportId 우선 — canonical이 다른 리포트로 바뀌어도 목록·생성 일치 */
  const hubReportId = useMemo(() => {
    const hint = urlMyReportHint.trim();
    const canonical = myReportId.trim();
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("reportId")?.trim() ?? ""
        : "";
    return hint || canonical || stored;
  }, [urlMyReportHint, myReportId]);

  const load = useCallback(
    async (mode: "full" | "silent" = "full", reportIdOverride?: string) => {
      const rid = (reportIdOverride ?? hubReportId).trim();
      if (!reportIdOverride && canonicalResolving && !hubReportId) return;
      if (!rid) {
        setErr(null);
        setItems([]);
        setLoading(false);
        return;
      }
      if (mode === "full") {
        setErr(null);
        setLoading(true);
      }
      try {
        const res = await fetch(
          `/api/relationship/list?reportId=${encodeURIComponent(rid)}${favoritesOnly ? "&favoritesOnly=true" : ""}`,
        );
        const data = await res.json();
        if (!res.ok) {
          if (mode === "full") {
            setErr(data?.error ?? "불러오지 못했어요.");
            setItems([]);
          }
          return;
        }
        setItems((prev) => {
          const incoming = (data.relationships ?? []) as RelationshipListItem[];
          const keys = new Set(
            incoming.map((r) => r.list_key ?? r.relationship_report_id),
          );
          const extra = prev.filter(
            (r) =>
              r.relationship_report_id &&
              !keys.has(r.list_key ?? r.relationship_report_id),
          );
          if (incoming.length === 0) return extra.length > 0 ? extra : prev;
          return [...incoming, ...extra];
        });
        if (mode === "silent") setErr(null);
      } finally {
        if (mode === "full") setLoading(false);
      }
    },
    [hubReportId, canonicalResolving, favoritesOnly],
  );

  useEffect(() => {
    void load("full");
  }, [load]);

  useEffect(() => {
    if (!hubSection || canonicalResolving || loading) return;
    const t = window.setTimeout(() => {
      if (hubSection === "add") {
        setManualOpen(true);
        document
          .getElementById("friend-add-section")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (hubSection === "list") {
        document
          .getElementById("relationship-list-section")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 280);
    return () => window.clearTimeout(t);
  }, [hubSection, canonicalResolving, loading]);

  useEffect(() => {
    if (!hubReportId) return;
    const id = window.setInterval(() => {
      void load("silent");
    }, 22000);
    const onVis = () => {
      if (document.visibilityState === "visible") void load("silent");
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [hubReportId, load]);

  const { waitingItems, relationshipItems } = useMemo(() => {
    const waiting = items.filter((i) => i.row_kind === "outbound_waiting");
    const rest = items.filter((i) => i.row_kind !== "outbound_waiting");
    return { waitingItems: waiting, relationshipItems: rest };
  }, [items]);

  const visibleWaiting = showAllWaiting
    ? waitingItems
    : waitingItems.slice(0, WAITING_VISIBLE);

  useEffect(() => {
    if (!highlightRrId) return;
    const el = document.getElementById(`relationship-card-${highlightRrId}`);
    if (el) {
      window.setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
    }
  }, [highlightRrId, relationshipItems.length]);

  async function toggleFavorite(
    item: RelationshipListItem,
    favorited: boolean,
  ) {
    if (!hubReportId || !item.relationship_report_id) return;
    const rrId = item.relationship_report_id;
    setFavoriteBusyId(rrId);
    setItems((prev) =>
      prev.map((r) =>
        r.relationship_report_id === rrId ? { ...r, is_favorite: favorited } : r,
      ),
    );
    try {
      const res = await fetch("/api/relationship/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationship_report_id: rrId,
          viewer_report_id: hubReportId,
          favorited,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        favorited?: boolean;
      };
      if (!res.ok) {
        setItems((prev) =>
          prev.map((r) =>
            r.relationship_report_id === rrId
              ? { ...r, is_favorite: !favorited }
              : r,
          ),
        );
        alert(data?.error ?? "즐겨찾기 저장에 실패했어요.");
        return;
      }
      const saved = Boolean(data.favorited);
      setItems((prev) =>
        prev.map((r) =>
          r.relationship_report_id === rrId ? { ...r, is_favorite: saved } : r,
        ),
      );
    } finally {
      setFavoriteBusyId(null);
    }
  }

  async function startNewInvite() {
    if (!hubReportId || inviteBusy) return;
    setInviteBusy(true);
    setFreshInviteToken(null);
    try {
      const res = await fetch("/api/invite/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: hubReportId }),
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
      setFreshInviteToken(token);
      await load();
    } finally {
      setInviteBusy(false);
    }
  }

  async function deleteManual(item: RelationshipListItem) {
    if (!hubReportId || !item.relationship_report_id) return;
    if (!window.confirm(`${item.partner_name}님을 친구 목록에서 삭제할까요?`)) return;
    setDeleteBusyId(item.relationship_report_id);
    try {
      const res = await fetch("/api/relationship/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationshipReportId: item.relationship_report_id,
          viewerReportId: hubReportId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? "삭제하지 못했어요.");
        return;
      }
      setItems((prev) =>
        prev.filter((i) => i.relationship_report_id !== item.relationship_report_id),
      );
      if (highlightRrId === item.relationship_report_id) setHighlightRrId(null);
      if (manualSuccess) setManualSuccess(null);
    } finally {
      setDeleteBusyId(null);
    }
  }

  async function deleteRequest(item: RelationshipListItem) {
    if (!hubReportId || !item.outbound_invite_id) return;
    if (!window.confirm("이 초대 요청을 삭제할까요?")) return;
    setDeleteBusyId(item.outbound_invite_id);
    try {
      const res = await fetch("/api/invite/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteId: item.outbound_invite_id,
          reportId: hubReportId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? "삭제하지 못했어요.");
        return;
      }
      await load();
    } finally {
      setDeleteBusyId(null);
    }
  }

  async function submitManual(payload: {
    partnerName: string;
    birthDate: string;
    birthTime: string | null;
    birthTimeUnknown: boolean;
    birthPlace: string | null;
    birthPlaceUnknown: boolean;
    surveySkipped: boolean;
    surveyAnswers: Record<string, string> | null;
  }) {
    const reportIdForCreate = hubReportId.trim();
    if (!reportIdForCreate) {
      alert("내 리포트를 찾지 못했어요. 리포트 화면 하단 「관계 탐사실」로 다시 들어와 주세요.");
      return;
    }
    if (canonicalResolving && !urlMyReportHint) {
      alert("리포트 정보를 확인하는 중이에요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    if (manualBusy) return;

    setManualBusy(true);
    setManualSuccess(null);
    try {
      const res = await fetch("/api/relationship/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportIdA: reportIdForCreate,
          ...payload,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        relationship_report_id?: string;
        partner_report_id?: string;
      };
      if (!res.ok) {
        alert(data?.error ?? "관계를 만들지 못했어요.");
        return;
      }

      const rrId = data.relationship_report_id?.trim();
      if (!rrId) {
        alert("관계는 만들어졌지만 목록 id를 받지 못했어요. 새로고침해 주세요.");
        await load("full", reportIdForCreate);
        return;
      }

      const optimistic: RelationshipListItem = {
        list_key: `rr-${rrId}`,
        row_kind: "relationship_manual",
        pipeline_title: `${payload.partnerName}님과의 관계 (직접 입력)`,
        relationship_report_id: rrId,
        partner_name: payload.partnerName,
        partner_report_id: data.partner_report_id ?? null,
        analysis_type: "basic",
        status: "pending",
        last_viewed: null,
        invite_token: null,
        status_hint: "기본 관계 분석을 만드는 중이에요. 잠시 후 다시 열어보세요.",
        relationship_kind: "friendship",
      };

      setItems((prev) => [
        optimistic,
        ...prev.filter((i) => i.relationship_report_id !== rrId),
      ]);
      setManualOpen(false);
      setManualSuccess(`${payload.partnerName}님과의 관계를 만들었어요.`);
      setHighlightRrId(rrId);
      if (typeof window !== "undefined") {
        localStorage.setItem("reportId", reportIdForCreate);
      }
      await load("full", reportIdForCreate);
    } catch {
      alert("네트워크 오류로 관계를 만들지 못했어요. 다시 시도해 주세요.");
    } finally {
      setManualBusy(false);
    }
  }

  if (!canonicalResolving && !hubReportId) {
    return (
      <SpaceBackground>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5">
          <GlassCard className="w-full max-w-sm space-y-4 text-center">
            <p className="text-xs text-[var(--space-text-muted)]">
              리포트에서 들어와 주세요.
            </p>
            <GlowButton
              type="button"
              className="!min-h-[44px] text-sm"
              onClick={() => router.push("/")}
            >
              홈으로
            </GlowButton>
          </GlassCard>
        </div>
      </SpaceBackground>
    );
  }

  const reportIdForUi = hubReportId;

  return (
    <SpaceBackground>
      <div className="relative z-10 min-h-screen px-4 py-10 pb-28 sm:px-6">
        <div className="mx-auto max-w-lg space-y-5">
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#FFD6A5]/85">
              Orbit
            </p>
            <h1 className="mt-1 text-lg font-semibold text-[var(--space-text)] sm:text-xl">
              관계 탐사실
            </h1>
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--space-text-muted)]">
              친구 목록에서 분석을 보고, 아래에서 새 친구를 추가해요.
            </p>
          </div>

          {canonicalResolving || loading ? (
            <p className="text-center text-xs text-[var(--space-text-muted)]">
              불러오는 중…
            </p>
          ) : err ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center">
              <p className="text-xs text-[var(--space-text-muted)]">{err}</p>
            </div>
          ) : null}

          <GlassCard className="!bg-[rgba(10,14,24,0.55)] space-y-3 !p-4">
            <div id="relationship-list-section" className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#67B7FF]">
                친구 목록
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={[
                    "rounded-full border px-2.5 py-1 text-[10px] font-medium transition",
                    favoritesOnly
                      ? "border-pink-400/40 bg-pink-500/15 text-pink-200"
                      : "border-white/15 text-white/50 hover:text-white/80",
                  ].join(" ")}
                  onClick={() => setFavoritesOnly((v) => !v)}
                >
                  ♥ 즐겨찾기
                </button>
                {relationshipItems.length > 0 ? (
                  <span className="text-[10px] text-white/40">
                    {relationshipItems.length}명
                  </span>
                ) : null}
              </div>
            </div>

            {manualSuccess ? (
              <p className="rounded-xl border border-[#7BFFB5]/30 bg-[#7BFFB5]/10 px-3 py-2 text-center text-xs text-[#9dffc8]">
                {manualSuccess} 「분석 보기」를 눌러 주세요.
              </p>
            ) : null}

            {relationshipItems.length > 0 ? (
              <ul className="space-y-3" role="list">
                {relationshipItems.map((item, idx) => (
                  <li
                    key={
                      item.list_key ??
                      `${item.relationship_report_id ?? "rr"}-${idx}`
                    }
                    id={
                      item.relationship_report_id
                        ? `relationship-card-${item.relationship_report_id}`
                        : undefined
                    }
                    className={
                      item.relationship_report_id === highlightRrId
                        ? "rounded-xl ring-2 ring-[#7BFFB5]/50 ring-offset-2 ring-offset-transparent"
                        : undefined
                    }
                  >
                    <RelationshipCard
                      item={item}
                      myReportId={reportIdForUi}
                      onDeleteManual={deleteManual}
                      onFavoriteToggle={toggleFavorite}
                      deleteBusy={deleteBusyId === item.relationship_report_id}
                      favoriteBusy={
                        favoriteBusyId === item.relationship_report_id
                      }
                    />
                  </li>
                ))}
              </ul>
            ) : !canonicalResolving && !loading && !err ? (
              <p className="py-6 text-center text-xs text-[var(--space-text-muted)]">
                {favoritesOnly
                  ? "즐겨찾기한 친구가 없어요. 분석 화면에서 하트를 눌러 보세요."
                  : "아직 친구가 없어요."}
              </p>
            ) : manualSuccess ? (
              <p className="text-center text-xs text-[#9dffc8]/80">
                목록을 불러오는 중…
              </p>
            ) : null}
            </div>
          </GlassCard>

          <div id="friend-add-section">
          <GlassCard className="!bg-[rgba(10,14,24,0.5)] space-y-4 !p-4">
            <h2 className="text-sm font-semibold text-[#FFD6A5]">
              친구 추가하기
            </h2>

            <div className="space-y-3 rounded-xl border border-[#67B7FF]/30 bg-gradient-to-br from-[#67B7FF]/10 to-transparent p-4">
              <h3 className="text-xs font-medium text-white/75">초대 링크</h3>
              <GlowButton
                type="button"
                disabled={inviteBusy}
                className="!min-h-[44px] w-full py-2.5 text-sm"
                onClick={() => void startNewInvite()}
              >
                {inviteBusy ? "잠깐만…" : "초대 링크 만들기"}
              </GlowButton>
              {freshInviteToken ? (
                <InviteShareButtons inviteToken={freshInviteToken} />
              ) : null}
            </div>

            <div className="space-y-3 rounded-xl border border-[#7BFFB5]/25 bg-gradient-to-br from-[#7BFFB5]/8 to-transparent p-4">
              <h3 className="text-xs font-medium text-white/75">직접 입력</h3>
              {!manualOpen ? (
                <button
                  type="button"
                  className="w-full rounded-xl border border-white/20 py-2.5 text-sm text-white/85 hover:bg-white/[0.05]"
                  onClick={() => setManualOpen(true)}
                >
                  친구 정보 입력하기
                </button>
              ) : (
                <ManualRelationshipForm
                  myReportId={hubReportId}
                  busy={manualBusy || (canonicalResolving && !urlMyReportHint)}
                  onCancel={() => setManualOpen(false)}
                  onSubmit={submitManual}
                />
              )}
            </div>

            {visibleWaiting.length > 0 ? (
              <div className="space-y-3 rounded-xl border border-[#FFD6A5]/25 bg-gradient-to-br from-[#FFD6A5]/8 to-transparent p-4">
                <h3 className="text-xs font-medium text-white/75">보낸 요청</h3>
                <ul className="space-y-3" role="list">
                  {visibleWaiting.map((item, idx) => (
                    <li
                      key={
                        item.list_key ??
                        `${item.invite_token ?? "inv"}-${idx}`
                      }
                    >
                      <RelationshipCard
                        item={item}
                        myReportId={reportIdForUi}
                        onDeleteRequest={deleteRequest}
                        deleteBusy={deleteBusyId === item.outbound_invite_id}
                      />
                    </li>
                  ))}
                </ul>
                {waitingItems.length > WAITING_VISIBLE ? (
                  <button
                    type="button"
                    className="w-full py-1 text-center text-xs text-[#67B7FF] underline-offset-2 hover:underline"
                    onClick={() => setShowAllWaiting((v) => !v)}
                  >
                    {showAllWaiting
                      ? "접기"
                      : `더보기 (${waitingItems.length - WAITING_VISIBLE}개)`}
                  </button>
                ) : null}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/report?id=${encodeURIComponent(reportIdForUi)}`,
                )
              }
              className="w-full rounded-xl border border-white/15 py-2.5 text-xs text-[var(--space-text-muted)] transition hover:border-white/25 hover:text-[var(--space-text)]"
            >
              ← 내 리포트
            </button>
          </GlassCard>
          </div>
        </div>
      </div>
    </SpaceBackground>
  );
}
