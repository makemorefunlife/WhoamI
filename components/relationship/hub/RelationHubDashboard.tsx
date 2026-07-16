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
import FadeInContent from "@/components/ui/stitch/FadeInContent";
import {
  FriendStoryRowSkeleton,
  HubAnalysisListSkeleton,
  RelationHubActionSkeleton,
} from "@/components/ui/stitch/StitchSkeleton";
import { useClientReportId } from "@/lib/hooks/useClientReportId";
import { relationshipHubRoute } from "@/constants/routes";
import { clearLegacyHubDisplayNames } from "@/lib/relationship/hubDisplayName";
import {
  fetchHubAnalysisFeed,
  type HubAnalysisFeedItem,
} from "@/lib/relationship/hubAnalysisFeed";
import { filterHubFriendList } from "@/lib/relationship/hubFriendList";
import { hubItemKey } from "@/lib/relationship/hubItemKey";
import { buildRelationshipAnalyzeUrl } from "@/lib/relationship/hubNavigation";
import type { RelationshipKind } from "@/lib/relationship/relationshipKind";
import type { FamilyPerspective } from "@/lib/relationship/hubNavigation";
import type { FamilyParentRole } from "@/lib/relationship/familyParent/types";
import { buildInviteUrl, copyInviteLink } from "@/lib/relationship/inviteShare";
import { useClerkReady } from "@/lib/clerk/useClerkReady";
import { setRelationHubDockLocked } from "@/lib/stitch/relationHubDockLock";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const ANALYSIS_PREVIEW_LIMIT = 5;
const ANALYSIS_PAGE_STEP = 10;
const ANALYSIS_MAX_TARGETS = 20;

export default function RelationHubDashboard() {
  const router = useRouter();
  const { messages, href: localize } = useLocale();
  const { openSignIn } = useClerk();
  const { isSignedIn } = useClerkReady();
  const searchParams = useSearchParams();
  const urlMyReportHint =
    searchParams.get("myReportId")?.trim() ||
    searchParams.get("reportId")?.trim() ||
    "";
  const hubSection = searchParams.get("section")?.trim() ?? "";
  const {
    reportId: hubReportId,
    ready: reportIdReady,
    recovering,
  } = useClientReportId({
    urlHint: urlMyReportHint,
    logContext: "relationships-hub",
    recoverFromServer: true,
  });

  const [loading, setLoading] = useState(false);
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
  const [analysisAllLimit, setAnalysisAllLimit] = useState(ANALYSIS_PREVIEW_LIMIT);
  const [analysisHasMore, setAnalysisHasMore] = useState(false);
  const [analysisLoadingMore, setAnalysisLoadingMore] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [waitingItems, setWaitingItems] = useState<RelationshipListItem[]>([]);
  const [navOverlayPartner, setNavOverlayPartner] = useState<string | null>(
    null,
  );

  const loadWaiting = useCallback(async (reportIdOverride?: string) => {
    const rid = (reportIdOverride ?? hubReportId).trim();
    if (!rid) {
      setWaitingItems([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/relationship/list?reportId=${encodeURIComponent(rid)}&includeWaiting=true`,
      );
      const data = await res.json();
      if (!res.ok) {
        setWaitingItems([]);
        return;
      }
      const incoming = (data.relationships ?? []) as RelationshipListItem[];
      setWaitingItems(
        incoming.filter((i) => i.row_kind === "outbound_waiting"),
      );
    } catch {
      setWaitingItems([]);
    }
  }, [hubReportId]);

  useEffect(() => {
    clearLegacyHubDisplayNames();
    setBannerVisible(!readBannerDismissed());
  }, []);

  const load = useCallback(
    async (mode: "full" | "silent" = "full", reportIdOverride?: string) => {
      const rid = (reportIdOverride ?? hubReportId).trim();
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
            setErr(data?.error ?? messages.hub.loadFailed);
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
    [hubReportId, favoritesOnly],
  );

  useEffect(() => {
    if (!reportIdReady) return;
    void load("full");
  }, [load, reportIdReady, hubReportId]);

  // canonical reportId가 URL myReportId와 다르면 주소를 맞춰 진입 경로 분기를 없앤다.
  useEffect(() => {
    if (!reportIdReady || recovering || !hubReportId) return;
    const urlId = urlMyReportHint.trim();
    if (urlId === hubReportId) return;
    router.replace(relationshipHubRoute(hubReportId), { scroll: false });
  }, [reportIdReady, recovering, hubReportId, urlMyReportHint, router]);

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

  const relationshipItems = useMemo(
    () => filterHubFriendList(items),
    [items],
  );

  const hubIsEmpty = Boolean(
    reportIdReady &&
      !recovering &&
      !loading &&
      hubReportId &&
      !favoritesOnly &&
      relationshipItems.length === 0,
  );

  useEffect(() => {
    setRelationHubDockLocked(hubIsEmpty);
    return () => setRelationHubDockLocked(false);
  }, [hubIsEmpty]);

  useEffect(() => {
    if (!sentRequestsOpen || !hubReportId) return;
    void loadWaiting();
    const id = window.setInterval(() => void loadWaiting(), 22000);
    const onVis = () => {
      if (document.visibilityState === "visible") void loadWaiting();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [hubReportId, loadWaiting, sentRequestsOpen]);

  useEffect(() => {
    if (!navOverlayPartner) return;
    // 라우팅 실패/중단 시 오버레이가 고정되지 않도록 안전 타임아웃을 둔다.
    const t = window.setTimeout(() => {
      setNavOverlayPartner(null);
    }, 5000);
    return () => window.clearTimeout(t);
  }, [navOverlayPartner]);

  const selectedFriend = useMemo(() => {
    return relationshipItems.find((i) => hubItemKey(i) === selectedKey) ?? null;
  }, [relationshipItems, selectedKey]);

  const canAnalyze = Boolean(
    hubReportId &&
      selectedFriend?.relationship_report_id &&
      selectedFriend.row_kind !== "outbound_waiting",
  );

  const refreshAnalysisPreview = useCallback(async () => {
    if (!hubReportId) return;
    setAnalysisLoading(true);
    try {
      const preview = await fetchHubAnalysisFeed(
        hubReportId,
        relationshipItems,
        ANALYSIS_PREVIEW_LIMIT,
        ANALYSIS_MAX_TARGETS,
      );
      setAnalysisPreview(preview.items);
      setAnalysisHasMore(preview.hasMore);
    } finally {
      setAnalysisLoading(false);
    }
  }, [hubReportId, relationshipItems]);

  useEffect(() => {
    if (!hubReportId || relationshipItems.length === 0) {
      setAnalysisPreview([]);
      setAnalysisAll([]);
      setAnalysisAllLimit(ANALYSIS_PREVIEW_LIMIT);
      setAnalysisHasMore(false);
      return;
    }
    void refreshAnalysisPreview();
  }, [hubReportId, relationshipItems, refreshAnalysisPreview]);

  useEffect(() => {
    if (!allAnalysisOpen || !hubReportId || relationshipItems.length === 0) return;
    let cancelled = false;
    setAnalysisLoading(true);
    void (async () => {
      try {
        const all = await fetchHubAnalysisFeed(
          hubReportId,
          relationshipItems,
          analysisAllLimit,
          ANALYSIS_MAX_TARGETS,
        );
        if (!cancelled) {
          setAnalysisAll(all.items);
          setAnalysisHasMore(all.hasMore);
        }
      } finally {
        if (!cancelled) {
          setAnalysisLoading(false);
          setAnalysisLoadingMore(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [analysisAllLimit, allAnalysisOpen, hubReportId, relationshipItems]);

  const loadMoreAnalysis = useCallback(() => {
    if (analysisLoadingMore || analysisLoading || !analysisHasMore) return;
    setAnalysisLoadingMore(true);
    setAnalysisAllLimit((prev) => prev + ANALYSIS_PAGE_STEP);
  }, [
    analysisHasMore,
    analysisLoading,
    analysisLoadingMore,
  ]);

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
        alert(data?.error ?? messages.hub.favoriteSaveFailed);
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
          alert(messages.hub.signInRequiredForFriend);
          openSignIn?.({
            forceRedirectUrl: localize(
              `/relationships?myReportId=${encodeURIComponent(hubReportId)}`,
            ),
          });
          return;
        }
        alert(data?.error ?? messages.hub.inviteCreateFailed);
        return;
      }
      const token = data?.invite?.invite_token as string | undefined;
      if (!token) {
        alert(messages.hub.inviteInfoUnavailable);
        return;
      }
      setFreshInviteToken(token);
      await load();
      void loadWaiting();
    } finally {
      setInviteBusy(false);
    }
  }

  async function deleteRequest(item: RelationshipListItem) {
    if (!hubReportId || !item.outbound_invite_id) return;
    if (!window.confirm(messages.hub.inviteCancelConfirm)) return;
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
        alert(data?.error ?? messages.hub.inviteCancelFailed);
        return;
      }
      await load();
      void loadWaiting();
    } finally {
      setDeleteBusyId(null);
    }
  }

  async function resendRequest(item: RelationshipListItem) {
    const token = item.invite_token;
    if (token) {
      const ok = await copyInviteLink(buildInviteUrl(token));
      alert(ok ? messages.hub.inviteLinkCopied : messages.hub.inviteLinkCopyFailed);
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
          alert(messages.hub.signInRequiredForFriend);
          openSignIn?.({
            forceRedirectUrl: localize(
              `/relationships?myReportId=${encodeURIComponent(reportIdForCreate)}`,
            ),
          });
          return;
        }
        alert(data?.error ?? messages.hub.relationshipCreateFailed);
        return;
      }
      setAddFriendOpen(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("reportId", reportIdForCreate);
      }
      await load("full", reportIdForCreate);
    } catch {
      alert(messages.hub.relationshipCreateNetworkError);
    } finally {
      setManualBusy(false);
    }
  }

  function openKindPicker(item: RelationshipListItem) {
    if (!item.relationship_report_id) {
      alert(messages.hub.pendingFriendCannotAnalyze);
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
      alert(messages.hub.pendingFriendCannotAnalyze);
      return;
    }
    const viewerId = hubReportId.trim();
    if (!viewerId) {
      alert(messages.hub.viewerReportMissing);
      return;
    }
    const partnerLabel = item.partner_name;
    setKindPickerTarget(null);
    setNavOverlayPartner(partnerLabel);
    router.push(
      localize(
        buildRelationshipAnalyzeUrl(
          item.relationship_report_id,
          viewerId,
          kind,
          family,
        ),
      ),
    );
  }

  function openAnalysisLog(log: HubAnalysisFeedItem) {
    if (!hubReportId) return;
    router.push(
      localize(
        `/relationship/${log.relationship_report_id}?viewer=${encodeURIComponent(hubReportId)}&kind=${encodeURIComponent(log.relationship_kind === "unspecified" ? "friendship" : log.relationship_kind)}`,
      ),
    );
  }

  function handleRenameSave(name: string) {
    const item = renameTarget;
    if (!item?.relationship_report_id || !item.partner_report_id) return;
    if (item.row_kind !== "relationship_manual") return;
    void (async () => {
      const res = await fetch("/api/relationship/partner-name", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerReportId: item.partner_report_id,
          viewerReportId: hubReportId,
          name,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error ?? messages.hub.renameSaveFailed);
        return;
      }
      await load("silent");
    })();
  }

  function handleSelectFriend(item: RelationshipListItem) {
    const key = hubItemKey(item);
    setSelectedKey((prev) => (prev === key ? null : key));
  }

  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <div className="mx-auto w-full max-w-lg px-5 py-6 sm:px-6 sm:py-8">
        <header className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
            RELATION HUB
          </p>
          <h1 className="stitch-headline mt-2 text-3xl text-primary">
            {messages.hub.title}
          </h1>
        </header>

        <RelationHubBanner
          visible={bannerVisible && reportIdReady && !hubIsEmpty}
          onDismiss={() => {
            dismissBanner();
            setBannerVisible(false);
          }}
        />

        {!reportIdReady || recovering ? (
          <div className="space-y-8">
            {recovering ? (
              <p className="text-center text-xs text-on-surface-variant">
                {messages.hub.loadingRecords}
              </p>
            ) : null}
            <FriendStoryRowSkeleton />
            <RelationHubActionSkeleton />
            <HubAnalysisListSkeleton />
          </div>
        ) : err ? (
          <p className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 py-8 text-center text-sm text-on-surface-variant">
            {err}
          </p>
        ) : (
          <FadeInContent>
            <div className="space-y-8">
              {!hubReportId ? (
                <p className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 px-4 py-3 text-center text-sm text-on-surface-variant">
                  {messages.hub.emptyBlueprintRequired}
                  {isSignedIn
                    ? messages.hub.emptyBlueprintRequiredSignedInHint
                    : ""}
                </p>
              ) : null}

              {loading && items.length === 0 ? (
                <>
                  <FriendStoryRowSkeleton />
                  <RelationHubActionSkeleton />
                  <HubAnalysisListSkeleton />
                </>
              ) : hubIsEmpty ? (
                <RelationHubActionButtons
                  emptyHub
                  canAnalyze={false}
                  onAnalyze={() => {}}
                  onAddFriend={() => {
                    setAddFriendOpen(true);
                    setAddFriendTab("invite");
                  }}
                />
              ) : (
                <>
                  <FriendStoryRow
                    friends={relationshipItems}
                    loading={false}
                    isSignedIn={isSignedIn ?? false}
                    selectedId={selectedKey}
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
                        ? messages.hub.analyzeWithName(selectedFriend.partner_name)
                        : messages.hub.analyzeCta
                    }
                    onAnalyze={() => {
                      if (selectedFriend) openKindPicker(selectedFriend);
                      else alert(messages.hub.selectFriendFirst);
                    }}
                    onAddFriend={() => {
                      setAddFriendOpen(true);
                      setAddFriendTab("invite");
                    }}
                  />

                  <HubAnalysisSection
                    items={analysisPreview}
                    loading={analysisLoading}
                    totalCount={analysisPreview.length}
                    onOpenLog={openAnalysisLog}
                    onShowMore={() => setAllAnalysisOpen(true)}
                  />
                </>
              )}
            </div>
          </FadeInContent>
        )}
      </div>

      <RenameFriendDialog
        open={renameTarget != null}
        initialName={renameTarget?.partner_name ?? ""}
        onClose={() => setRenameTarget(null)}
        onSave={handleRenameSave}
      />

      <StitchKindPickerSheet
        open={kindPickerTarget != null}
        partnerName={
          kindPickerTarget
            ? kindPickerTarget.partner_name
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
              void loadWaiting();
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
        selectedId={selectedKey}
        onClose={() => setFriendsListOpen(false)}
        onSelect={handleSelectFriend}
      />

      <AllAnalysisSheet
        open={allAnalysisOpen}
        items={analysisAll}
        loading={analysisLoading}
        hasMore={analysisHasMore}
        loadingMore={analysisLoadingMore}
        onLoadMore={() => void loadMoreAnalysis()}
        onClose={() => setAllAnalysisOpen(false)}
        onOpenLog={openAnalysisLog}
      />
    </StitchSurveyShell>
  );
}
