"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useClerk } from "@clerk/nextjs";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import type { RelationshipListItem } from "@/components/relationship/RelationshipCard";
import RelationHubBanner, {
  dismissBanner,
  readBannerDismissed,
} from "@/components/relationship/hub/RelationHubBanner";
import FriendStoryRow from "@/components/relationship/hub/FriendStoryRow";
import RelationHubActionButtons from "@/components/relationship/hub/RelationHubActionButtons";
import HubAnalysisSection from "@/components/relationship/hub/HubAnalysisSection";
import RenameFriendDialog from "@/components/relationship/hub/RenameFriendDialog";
import StitchKindPickerSheet from "@/components/relationship/hub/StitchKindPickerSheet";
import AddFriendSheet from "@/components/relationship/hub/AddFriendSheet";
import SentRequestsSheet from "@/components/relationship/hub/SentRequestsSheet";
import FriendsListSheet from "@/components/relationship/hub/FriendsListSheet";
import AllAnalysisSheet from "@/components/relationship/hub/AllAnalysisSheet";
import RelationAnalyzeNavOverlay from "@/components/relationship/hub/RelationAnalyzeNavOverlay";
import { useCanonicalReportId } from "@/lib/home/useCanonicalReportId";
import { blueprintPath } from "@/lib/stitch/hubPaths";
import {
  fetchHubAnalysisFeed,
  type HubAnalysisFeedItem,
} from "@/lib/relationship/hubAnalysisFeed";
import {
  readHubDisplayName,
  writeHubDisplayName,
} from "@/lib/relationship/hubDisplayName";
import { hubDisplayNameFor, hubItemKey } from "@/lib/relationship/hubItemKey";
import { buildRelationshipAnalyzeUrl } from "@/lib/relationship/hubNavigation";
import type { RelationshipKind } from "@/lib/relationship/relationshipKind";
import type { FamilyPerspective } from "@/lib/relationship/hubNavigation";
import type { FamilyParentRole } from "@/lib/relationship/familyParent/types";
import { buildInviteUrl, copyInviteLink } from "@/lib/relationship/inviteShare";
import { useClerkReady } from "@/lib/clerk/useClerkReady";

export default function RelationHubDashboard() {
  const router = useRouter();
  const { openSignIn } = useClerk();
  const { isSignedIn } = useClerkReady();
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
      skipSessionHydrate: true,
    });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<RelationshipListItem[]>([]);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [manualBusy, setManualBusy] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [freshInviteToken, setFreshInviteToken] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteBusyId, setFavoriteBusyId] = useState<string | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [renameTarget, setRenameTarget] = useState<RelationshipListItem | null>(
    null,
  );
  const [kindPickerTarget, setKindPickerTarget] =
    useState<RelationshipListItem | null>(null);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [addFriendTab, setAddFriendTab] = useState<"invite" | "manual">(
    "invite",
  );
  const [sentRequestsOpen, setSentRequestsOpen] = useState(false);
  const [friendsListOpen, setFriendsListOpen] = useState(false);
  const [allAnalysisOpen, setAllAnalysisOpen] = useState(false);
  const [analysisPreview, setAnalysisPreview] = useState<HubAnalysisFeedItem[]>(
    [],
  );
  const [analysisAll, setAnalysisAll] = useState<HubAnalysisFeedItem[]>([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [navOverlayPartner, setNavOverlayPartner] = useState<string | null>(
    null,
  );

  const hubReportId = useMemo(() => {
    const hint = urlMyReportHint.trim();
    const canonical = myReportId.trim();
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("reportId")?.trim() ?? ""
        : "";
    return hint || canonical || stored;
  }, [urlMyReportHint, myReportId]);

  useEffect(() => {
    setBannerVisible(!readBannerDismissed());
  }, []);

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
        const incoming = (data.relationships ?? []) as RelationshipListItem[];
        setItems(incoming);
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
    if (!hubSection || loading) return;
    const t = window.setTimeout(() => {
      if (hubSection === "add") {
        setAddFriendOpen(true);
        setAddFriendTab("invite");
      }
    }, 280);
    return () => window.clearTimeout(t);
  }, [hubSection, loading]);

  const { waitingItems, relationshipItems } = useMemo(() => {
    const waiting = items.filter((i) => i.row_kind === "outbound_waiting");
    const rest = items.filter((i) => i.row_kind !== "outbound_waiting");
    return { waitingItems: waiting, relationshipItems: rest };
  }, [items]);

  useEffect(() => {
    if (!hubReportId || waitingItems.length === 0) return;
    const id = window.setInterval(() => void load("silent"), 22000);
    const onVis = () => {
      if (document.visibilityState === "visible") void load("silent");
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [hubReportId, load, waitingItems.length]);

  useEffect(() => {
    if (!navOverlayPartner) return;
    // 라우팅 실패/중단 시 오버레이가 고정되지 않도록 안전 타임아웃을 둔다.
    const t = window.setTimeout(() => {
      setNavOverlayPartner(null);
    }, 5000);
    return () => window.clearTimeout(t);
  }, [navOverlayPartner]);

  const selectedFriend = useMemo(() => {
    const all = [...waitingItems, ...relationshipItems];
    return all.find((i) => hubItemKey(i) === selectedKey) ?? null;
  }, [relationshipItems, selectedKey, waitingItems]);

  const canAnalyze = Boolean(
    hubReportId &&
      selectedFriend?.relationship_report_id &&
      selectedFriend.row_kind !== "outbound_waiting",
  );

  useEffect(() => {
    const names: Record<string, string> = {};
    for (const item of relationshipItems) {
      const id = item.relationship_report_id;
      if (!id) continue;
      const saved = readHubDisplayName(id, item.partner_name);
      if (saved !== item.partner_name) names[id] = saved;
    }
    setDisplayNames(names);
  }, [relationshipItems]);

  const refreshAnalysis = useCallback(async () => {
    if (!hubReportId) return;
    setAnalysisLoading(true);
    try {
      const preview = await fetchHubAnalysisFeed(
        hubReportId,
        relationshipItems,
        3,
      );
      setAnalysisPreview(preview);
      const all = await fetchHubAnalysisFeed(
        hubReportId,
        relationshipItems,
        50,
      );
      setAnalysisAll(all);
    } finally {
      setAnalysisLoading(false);
    }
  }, [hubReportId, relationshipItems]);

  useEffect(() => {
    if (!hubReportId || relationshipItems.length === 0) {
      setAnalysisPreview([]);
      setAnalysisAll([]);
      return;
    }
    void refreshAnalysis();
  }, [hubReportId, relationshipItems, refreshAnalysis]);

  async function toggleFavorite(item: RelationshipListItem, favorited: boolean) {
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setItems((prev) =>
          prev.map((r) =>
            r.relationship_report_id === rrId
              ? { ...r, is_favorite: !favorited }
              : r,
          ),
        );
        alert(data?.error ?? "즐겨찾기 저장에 실패했어요.");
      }
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
        if (res.status === 401) {
          alert("친구 추가는 로그인(회원가입) 후 이용할 수 있어요.");
          openSignIn?.({
            forceRedirectUrl: `/relationships?myReportId=${encodeURIComponent(hubReportId)}`,
          });
          return;
        }
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

  async function deleteRequest(item: RelationshipListItem) {
    if (!hubReportId || !item.outbound_invite_id) return;
    if (!window.confirm("초대를 취소할까요? (분석권이 회수될 수 있어요)")) return;
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
        alert(data?.error ?? "취소하지 못했어요.");
        return;
      }
      await load();
    } finally {
      setDeleteBusyId(null);
    }
  }

  async function resendRequest(item: RelationshipListItem) {
    const token = item.invite_token;
    if (token) {
      const ok = await copyInviteLink(buildInviteUrl(token));
      alert(ok ? "초대 링크를 복사했어요." : "복사에 실패했어요.");
      return;
    }
    await startNewInvite();
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
    if (!reportIdForCreate || manualBusy) return;
    setManualBusy(true);
    try {
      const res = await fetch("/api/relationship/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportIdA: reportIdForCreate, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          alert("친구 추가는 로그인(회원가입) 후 이용할 수 있어요.");
          openSignIn?.({
            forceRedirectUrl: `/relationships?myReportId=${encodeURIComponent(reportIdForCreate)}`,
          });
          return;
        }
        alert(data?.error ?? "관계를 만들지 못했어요.");
        return;
      }
      setAddFriendOpen(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("reportId", reportIdForCreate);
      }
      await load("full", reportIdForCreate);
    } catch {
      alert("네트워크 오류로 관계를 만들지 못했어요.");
    } finally {
      setManualBusy(false);
    }
  }

  function openKindPicker(item: RelationshipListItem) {
    if (!item.relationship_report_id) {
      alert("수락 대기 중인 친구는 분석을 시작할 수 없어요.");
      return;
    }
    setKindPickerTarget(item);
  }

  function navigateAnalyze(
    item: RelationshipListItem,
    kind: RelationshipKind,
    family?: { perspective: FamilyPerspective; parentType: FamilyParentRole },
  ) {
    if (!item.relationship_report_id) {
      alert("수락 대기 중인 친구는 분석을 시작할 수 없어요.");
      return;
    }
    const viewerId = hubReportId.trim();
    if (!viewerId) {
      alert(
        "내 리포트 정보를 찾을 수 없어요. 블루프린트를 먼저 완료한 뒤 다시 시도해 주세요.",
      );
      return;
    }
    const partnerLabel = hubDisplayNameFor(item, displayNames);
    setKindPickerTarget(null);
    setNavOverlayPartner(partnerLabel);
    router.push(
      buildRelationshipAnalyzeUrl(
        item.relationship_report_id,
        viewerId,
        kind,
        family,
      ),
    );
  }

  function openAnalysisLog(log: HubAnalysisFeedItem) {
    if (!hubReportId) return;
    router.push(
      `/relationship/${log.relationship_report_id}?viewer=${encodeURIComponent(hubReportId)}&kind=${encodeURIComponent(log.relationship_kind === "unspecified" ? "friendship" : log.relationship_kind)}`,
    );
  }

  function handleRenameSave(name: string) {
    const item = renameTarget;
    if (!item?.relationship_report_id) return;
    writeHubDisplayName(item.relationship_report_id, name);
    setDisplayNames((prev) => ({
      ...prev,
      [item.relationship_report_id!]: name,
    }));
  }

  function handleSelectFriend(item: RelationshipListItem) {
    const key = hubItemKey(item);
    setSelectedKey((prev) => (prev === key ? null : key));
  }

  if (!hubReportId) {
    if (canonicalResolving) {
      return (
        <StitchSurveyShell className="stitch-survey stitch-results">
          <div className="mx-auto flex min-h-[50dvh] max-w-lg items-center justify-center px-6">
            <p className="text-sm text-on-surface-variant">불러오는 중…</p>
          </div>
        </StitchSurveyShell>
      );
    }
    return (
      <StitchSurveyShell className="stitch-survey stitch-results">
        <div className="mx-auto flex min-h-[50dvh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-on-surface-variant">
            블루프린트를 먼저 완료하면 Relation Hub를 이용할 수 있어요.
          </p>
          <button
            type="button"
            className="stitch-cta-primary !min-w-0 !px-8 !py-3 !text-sm"
            onClick={() => router.push(blueprintPath())}
          >
            Blueprint로 이동
          </button>
        </div>
      </StitchSurveyShell>
    );
  }

  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <div className="mx-auto w-full max-w-lg px-5 py-6 sm:px-6 sm:py-8">
        <header className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
            Relation Hub
          </p>
          <h1 className="stitch-headline mt-2 text-3xl text-primary">
            관계 허브
          </h1>
        </header>

        <RelationHubBanner
          visible={bannerVisible}
          onDismiss={() => {
            dismissBanner();
            setBannerVisible(false);
          }}
        />

        {loading && items.length === 0 ? (
          <p className="py-12 text-center text-sm text-on-surface-variant">
            불러오는 중…
          </p>
        ) : err ? (
          <p className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 py-8 text-center text-sm text-on-surface-variant">
            {err}
          </p>
        ) : (
          <div className="space-y-8">
            <FriendStoryRow
              friends={relationshipItems}
              waiting={waitingItems}
              isSignedIn={isSignedIn}
              selectedId={selectedKey}
              displayNames={displayNames}
              favoritesOnly={favoritesOnly}
              onToggleFavoritesOnly={() => setFavoritesOnly((v) => !v)}
              onSelect={handleSelectFriend}
              onAddFriend={() => {
                setAddFriendOpen(true);
                setAddFriendTab("invite");
              }}
              onShowAll={() => setFriendsListOpen(true)}
              onRename={(item) => setRenameTarget(item)}
              onToggleFavorite={(item) =>
                void toggleFavorite(item, !item.is_favorite)
              }
            />

            <RelationHubActionButtons
              canAnalyze={canAnalyze}
              analyzeLabel={
                selectedFriend
                  ? `${hubDisplayNameFor(selectedFriend, displayNames)}님과 분석하기`
                  : "관계 분석하기"
              }
              onAnalyze={() => {
                if (selectedFriend) openKindPicker(selectedFriend);
                else alert("친구를 먼저 선택해 주세요.");
              }}
              onAddFriend={() => {
                setAddFriendOpen(true);
                setAddFriendTab("invite");
              }}
            />

            <HubAnalysisSection
              items={analysisPreview}
              loading={analysisLoading}
              totalCount={analysisAll.length}
              onOpenLog={openAnalysisLog}
              onShowMore={() => setAllAnalysisOpen(true)}
            />
          </div>
        )}
      </div>

      <RenameFriendDialog
        open={renameTarget != null}
        initialName={
          renameTarget
            ? readHubDisplayName(
                renameTarget.relationship_report_id ?? "",
                renameTarget.partner_name,
              )
            : ""
        }
        onClose={() => setRenameTarget(null)}
        onSave={handleRenameSave}
      />

      <StitchKindPickerSheet
        open={kindPickerTarget != null}
        partnerName={
          kindPickerTarget
            ? hubDisplayNameFor(kindPickerTarget, displayNames)
            : ""
        }
        onClose={() => setKindPickerTarget(null)}
        onSelect={(kind, family) => {
          if (kindPickerTarget) navigateAnalyze(kindPickerTarget, kind, family);
        }}
      />

      <AnimatePresence>
        {navOverlayPartner ? (
          <RelationAnalyzeNavOverlay partnerName={navOverlayPartner} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {addFriendOpen ? (
          <AddFriendSheet
            open={addFriendOpen}
            tab={addFriendTab}
            onTabChange={setAddFriendTab}
            onClose={() => setAddFriendOpen(false)}
            inviteToken={freshInviteToken}
            inviteBusy={inviteBusy}
            onCreateInvite={() => void startNewInvite()}
            onShowSentRequests={() => {
              setSentRequestsOpen(true);
            }}
            manualBusy={manualBusy}
            myReportId={hubReportId}
            onManualSubmit={submitManual}
          />
        ) : null}
      </AnimatePresence>

      <SentRequestsSheet
        open={sentRequestsOpen}
        items={waitingItems}
        busyId={deleteBusyId}
        onClose={() => setSentRequestsOpen(false)}
        onResend={(item) => void resendRequest(item)}
        onCancel={(item) => void deleteRequest(item)}
      />

      <FriendsListSheet
        open={friendsListOpen}
        friends={relationshipItems}
        waiting={waitingItems}
        displayNames={displayNames}
        selectedId={selectedKey}
        onClose={() => setFriendsListOpen(false)}
        onSelect={handleSelectFriend}
      />

      <AllAnalysisSheet
        open={allAnalysisOpen}
        items={analysisAll}
        loading={analysisLoading}
        onClose={() => setAllAnalysisOpen(false)}
        onOpenLog={openAnalysisLog}
      />
    </StitchSurveyShell>
  );
}
