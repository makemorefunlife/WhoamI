"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import type { RelationshipPerspective } from "@/components/relationship/RelationshipBasicCards";
import type { AnalysisLogListItem } from "@/components/relationship/RelationshipAnalysisHistory";
import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import { WORK_COLLEAGUE_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/workColleague";
import type { MarriageReportBody } from "@/lib/relationship/marriage/buildMarriageReport";
import { COHABITATION_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/cohabitation";
import type { FamilyParentReportBody } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import { FAMILY_PARENT_CHILD_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/familyParentChild";
import type { FriendReportBody } from "@/lib/relationship/friend/buildFriendReport";
import { FRIEND_SOCIAL_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/friendSocial";
import { ROMANTIC_SAJU_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import type { FamilyParentRole } from "@/lib/relationship/familyParent/types";
import {
  parseRelationshipKind,
  RELATIONSHIP_KIND_LABELS,
  type RelationshipKind,
} from "@/lib/relationship/relationshipKind";
import {
  parseAnalysisLogSnapshot,
  type AnalysisLogSnapshot,
} from "@/lib/relationship/detail/parseAnalysisLogSnapshot";
import { useCanonicalReportId } from "@/lib/home/useCanonicalReportId";
import { resolvePartnerDisplayName } from "@/lib/relationship/resolvePartnerDisplayName";
import { resolveViewerDisplayName } from "@/lib/relationship/viewerFirstDisplay";
import {
  parseRomanticDeepViewModel,
  type RomanticDeepMetaViewModel,
  type RomanticDeepViewModel,
} from "@/lib/relationship/detail/parseRomanticDeepViewModel";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export type UseRelationshipDetailReturn = {
  router: ReturnType<typeof useRouter>;
  viewerReportId: string;
  canonicalResolving: boolean;
  autostartActive: boolean;
  resolvedRelationshipId: string;
  loading: boolean;
  busy: boolean;
  err: string | null;
  partnerName: string;
  viewerName: string;
  viewerBirthTimeUnknown: boolean;
  partnerBirthTimeUnknown: boolean;
  viewerBirthPlaceUnknown: boolean;
  partnerBirthPlaceUnknown: boolean;
  analysisType: string;
  premiumKind: RelationshipKind;
  favorited: boolean;
  favoriteBusy: boolean;
  snapshotView: AnalysisLogSnapshot | null;
  logs: AnalysisLogListItem[];
  logsLoading: boolean;
  familyParentType: FamilyParentRole;
  familyChildIsViewer: boolean;
  reportIdA: string;
  reportIdB: string;
  nameA: string;
  nameB: string;
  viewerIsReportA: boolean;
  displayBasic: RelationshipPerspective | null;
  displayPremium: RelationshipPerspective | null;
  displayRomanticDeep: RomanticDeepViewModel | null;
  displayRomanticMeta: RomanticDeepMetaViewModel | null;
  displayWorkDeep: WorkColleagueReportBody | null;
  displayCohabitationDeep: MarriageReportBody | null;
  displayFamilyDeep: FamilyParentReportBody | null;
  displayFriendshipDeep: FriendReportBody | null;
  premiumReady: boolean;
  toggleFavorite: () => Promise<void>;
  retryAnalysis: () => void;
  onPremiumKindChange: (kind: RelationshipKind) => void;
  viewAnalysisLog: (log: AnalysisLogListItem) => void;
  clearSnapshotView: () => void;
  reloadDetail: () => void;
  setFamilyParentType: (role: FamilyParentRole) => void;
  setFamilyChildIsViewer: (checked: boolean) => void;
  runPremium: (
    kind?: RelationshipKind,
    options?: { forceRegenerate?: boolean },
  ) => Promise<boolean>;
  regeneratePremium: () => void;
};

export function useRelationshipDetail({
  relationshipReportId,
}: {
  relationshipReportId: string;
}): UseRelationshipDetailReturn {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const urlViewerHint = searchParams.get("viewer")?.trim() ?? "";
  const urlKindHint = searchParams.get("kind")?.trim() ?? "";
  const urlChildIsViewer = searchParams.get("childIsViewer")?.trim() ?? "";
  const urlParentType = searchParams.get("parentType")?.trim() ?? "";
  const urlAutostart = searchParams.get("autostart") === "1";
  const { user } = useUser();
  const { locale } = useLocale();
  const { canonicalReportId: viewerReportId, resolving: canonicalResolving } =
    useCanonicalReportId({
      urlHint: urlViewerHint,
      queryParam: "viewer",
      logContext: "relationship-detail",
      syncToUrl: false,
    });

  const effectiveViewerReportId = (viewerReportId || urlViewerHint).trim();

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
  const [viewerBirthTimeUnknown, setViewerBirthTimeUnknown] = useState(false);
  const [partnerBirthTimeUnknown, setPartnerBirthTimeUnknown] = useState(false);
  const [viewerBirthPlaceUnknown, setViewerBirthPlaceUnknown] = useState(false);
  const [partnerBirthPlaceUnknown, setPartnerBirthPlaceUnknown] =
    useState(false);
  const [basic, setBasic] = useState<RelationshipPerspective | null>(null);
  const [premium, setPremium] = useState<RelationshipPerspective | null>(null);
  const [romanticDeep, setRomanticDeep] = useState<RomanticDeepViewModel | null>(
    null,
  );
  const [workDeep, setWorkDeep] = useState<WorkColleagueReportBody | null>(
    null,
  );
  const [cohabitationDeep, setCohabitationDeep] =
    useState<MarriageReportBody | null>(null);
  const [familyDeep, setFamilyDeep] = useState<FamilyParentReportBody | null>(
    null,
  );
  const [friendshipDeep, setFriendshipDeep] = useState<FriendReportBody | null>(
    null,
  );
  const [familyParentType, setFamilyParentType] =
    useState<FamilyParentRole>(
      urlParentType === "father" ? "father" : "mother",
    );
  const [familyChildIsViewer, setFamilyChildIsViewer] = useState(
    urlChildIsViewer === "true",
  );
  const [reportIdA, setReportIdA] = useState("");
  const [reportIdB, setReportIdB] = useState("");
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [viewerIsReportA, setViewerIsReportA] = useState(true);
  const [premiumKind, setPremiumKind] = useState<RelationshipKind>(() =>
    parseRelationshipKind(urlKindHint || undefined),
  );
  const premiumKindRef = useRef<RelationshipKind>(
    parseRelationshipKind(urlKindHint || undefined),
  );
  premiumKindRef.current = premiumKind;
  const [favorited, setFavorited] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [snapshotView, setSnapshotView] = useState<AnalysisLogSnapshot | null>(
    null,
  );
  const [logs, setLogs] = useState<AnalysisLogListItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [autostartActive, setAutostartActive] = useState(false);
  const [serverPremiumReady, setServerPremiumReady] = useState(false);
  const autostartTriggered = useRef(false);
  const loadSeqRef = useRef(0);
  const premiumSeqRef = useRef(0);
  const detailOkRef = useRef(false);
  const viewerReportNameRef = useRef<string | null>(null);
  const clerkFirstNameRef = useRef(user?.firstName);
  const clerkFullNameRef = useRef(user?.fullName);
  clerkFirstNameRef.current = user?.firstName;
  clerkFullNameRef.current = user?.fullName;
  const REQUEST_TIMEOUT_MS = 300_000;

  async function fetchJsonWithTimeout(
    input: RequestInfo | URL,
    init?: RequestInit,
  ) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      return { res, data };
    } finally {
      window.clearTimeout(timer);
    }
  }

  const fetchLogs = useCallback(
    async (expectedLoadSeq?: number) => {
      if (!effectiveViewerReportId || !resolvedRelationshipId) return;
      const seqAtStart = expectedLoadSeq ?? loadSeqRef.current;
      setLogsLoading(true);
      try {
        const res = await fetch(
          `/api/relationship/logs?relationshipReportId=${encodeURIComponent(resolvedRelationshipId)}&viewerReportId=${encodeURIComponent(effectiveViewerReportId)}`,
        );
        const data = await res.json();
        if (seqAtStart !== loadSeqRef.current) return;
        if (res.ok) setLogs((data.logs ?? []) as AnalysisLogListItem[]);
      } finally {
        if (seqAtStart === loadSeqRef.current) setLogsLoading(false);
      }
    },
    [resolvedRelationshipId, effectiveViewerReportId],
  );

  const load = useCallback(
    async (
      kindOverride?: RelationshipKind,
      options?: { silent?: boolean },
    ) => {
      if (!effectiveViewerReportId) {
        setErr("viewer 쿼리(내 리포트 id)가 필요합니다.");
        detailOkRef.current = false;
        setDetailOk(false);
        setLoading(false);
        return;
      }
      if (!resolvedRelationshipId) {
        setErr("관계 분석 주소가 올바르지 않아요.");
        detailOkRef.current = false;
        setDetailOk(false);
        setLoading(false);
        return;
      }

      const seq = ++loadSeqRef.current;
      const silent =
        options?.silent === true || detailOkRef.current === true;
      const explicitKind =
        kindOverride ??
        (urlKindHint ? parseRelationshipKind(urlKindHint) : null);
      const kindForRequest = explicitKind ?? premiumKindRef.current;
      setErr(null);
      if (!silent) setLoading(true);
      try {
        const kindQuery =
          explicitKind != null
            ? `&relationshipKind=${encodeURIComponent(explicitKind)}`
            : "";
        const res = await fetch(
          `/api/relationship/detail?relationshipReportId=${encodeURIComponent(resolvedRelationshipId)}&viewerReportId=${encodeURIComponent(effectiveViewerReportId)}${kindQuery}&language=${encodeURIComponent(locale)}`,
          { headers: { "x-aha-locale": locale } },
        );
        const data = await res.json();
        if (seq !== loadSeqRef.current) return;
        if (!res.ok) {
          detailOkRef.current = false;
          setDetailOk(false);
          setErr(data?.error ?? "불러오지 못했어요.");
          return;
        }
        setSnapshotView(null);
        detailOkRef.current = true;
        setDetailOk(true);
        const ridA = data.report_id_a ?? "";
        const ridB = data.report_id_b ?? "";
        const isViewerA = effectiveViewerReportId === ridA;
        const reportViewerName = (data.viewer_name ?? data.my_name ?? null) as
          | string
          | null;
        viewerReportNameRef.current = reportViewerName;
        const resolvedViewer = resolveViewerDisplayName({
          reportName: reportViewerName,
          clerkFirstName: clerkFirstNameRef.current,
          clerkFullName: clerkFullNameRef.current,
        });
        const resolvedPartner = resolvePartnerDisplayName(
          data.partner_name ?? data.display_partner_name,
          undefined,
          "친구",
        );
        setPartnerName(resolvedPartner);
        setViewerName(resolvedViewer);
        setViewerBirthTimeUnknown(data.viewer_birth_time_unknown === true);
        setPartnerBirthTimeUnknown(data.partner_birth_time_unknown === true);
        setViewerBirthPlaceUnknown(data.viewer_birth_place_unknown === true);
        setPartnerBirthPlaceUnknown(data.partner_birth_place_unknown === true);
        setAnalysisType(data.analysis_type ?? "basic");
        setPremiumKind(
          parseRelationshipKind(data.relationship_kind ?? kindForRequest),
        );
        setServerPremiumReady(data.premium_ready === true);
        setBasic((data.perspective_basic ?? null) as RelationshipPerspective);
        setPremium(
          (data.perspective_premium ?? null) as RelationshipPerspective,
        );
        setRomanticDeep(parseRomanticDeepViewModel(data.romantic_deep_report));
        setWorkDeep(
          (data.work_colleague_deep_report ?? null) as WorkColleagueReportBody | null,
        );
        setCohabitationDeep(
          (data.cohabitation_deep_report ?? null) as MarriageReportBody | null,
        );
        setFamilyDeep(
          (data.family_deep_report ?? null) as FamilyParentReportBody | null,
        );
        setFriendshipDeep(
          (data.friendship_deep_report ?? null) as FriendReportBody | null,
        );
        setReportIdA(ridA);
        setReportIdB(ridB);
        setViewerIsReportA(
          data.viewer_is_report_a === true ||
            (data.viewer_is_report_a !== false && isViewerA),
        );
        setNameA(
          (data.person_a_name ?? "").trim() ||
            (isViewerA ? resolvedViewer : resolvedPartner),
        );
        setNameB(
          (data.person_b_name ?? "").trim() ||
            (isViewerA ? resolvedPartner : resolvedViewer),
        );
        setFavorited(Boolean(data.is_favorite));
        void fetchLogs(seq);
      } finally {
        if (seq === loadSeqRef.current) setLoading(false);
      }
    },
    [resolvedRelationshipId, effectiveViewerReportId, fetchLogs, urlKindHint],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Clerk hydrate → display name only (do not re-fetch detail).
  useEffect(() => {
    if (!detailOkRef.current) return;
    setViewerName(
      resolveViewerDisplayName({
        reportName: viewerReportNameRef.current,
        clerkFirstName: user?.firstName,
        clerkFullName: user?.fullName,
      }),
    );
  }, [user?.firstName, user?.fullName]);

  /** Same-route soft navigations: sync ?kind= and reload (state otherwise sticks). */
  useEffect(() => {
    if (!urlKindHint) return;
    const k = parseRelationshipKind(urlKindHint);
    if (k === premiumKindRef.current) return;
    setSnapshotView(null);
    setPremiumKind(k);
    setServerPremiumReady(false);
    setPremium(null);
    setRomanticDeep(null);
    setWorkDeep(null);
    setCohabitationDeep(null);
    setFamilyDeep(null);
    setFriendshipDeep(null);
    premiumSeqRef.current += 1;
    void load(k, { silent: true });
  }, [urlKindHint, load]);

  const basicAttempted = useRef(false);

  useEffect(() => {
    basicAttempted.current = false;
  }, [resolvedRelationshipId]);

  useEffect(() => {
    autostartTriggered.current = false;
  }, [resolvedRelationshipId, effectiveViewerReportId, urlAutostart]);

  const ensureBasic = useCallback(async () => {
    if (!effectiveViewerReportId || !resolvedRelationshipId) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/relationship/analyze/basic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationship_report_id: resolvedRelationshipId,
          viewer_report_id: effectiveViewerReportId,
          relationship_kind: premiumKindRef.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error ?? "기본 분석 실패");
        return;
      }
      await load(undefined, { silent: true });
    } finally {
      setBusy(false);
    }
  }, [effectiveViewerReportId, resolvedRelationshipId, load, premiumKind]);

  const toggleFavorite = useCallback(async () => {
    if (!effectiveViewerReportId || !resolvedRelationshipId) return;
    const next = !favorited;
    setFavorited(next);
    setFavoriteBusy(true);
    try {
      const res = await fetch("/api/relationship/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationship_report_id: resolvedRelationshipId,
          viewer_report_id: effectiveViewerReportId,
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
  }, [effectiveViewerReportId, resolvedRelationshipId, favorited]);

  const viewAnalysisLog = useCallback((log: AnalysisLogListItem) => {
    const { snapshot, kind } = parseAnalysisLogSnapshot(
      log,
      premiumKindRef.current,
    );
    setSnapshotView(snapshot);
    setPremiumKind(kind);
  }, []);

  useEffect(() => {
    if (loading || !detailOk || !effectiveViewerReportId || !resolvedRelationshipId)
      return;
    if (basic && Object.keys(basic).length > 0) return;
    if (basicAttempted.current) return;
    basicAttempted.current = true;
    void ensureBasic();
  }, [
    loading,
    basic,
    detailOk,
    effectiveViewerReportId,
    resolvedRelationshipId,
    ensureBasic,
  ]);

  const retryAnalysis = useCallback(() => {
    basicAttempted.current = false;
    setErr(null);
    void ensureBasic();
  }, [ensureBasic]);

  const runPremium = useCallback(
    async (
      kind: RelationshipKind = premiumKind,
      options?: { forceRegenerate?: boolean },
    ) => {
      if (!resolvedRelationshipId) return false;
      const forceRegenerate = options?.forceRegenerate === true;
      const premiumSeq = ++premiumSeqRef.current;
      const kindAtStart = kind;
      if (forceRegenerate) {
        setSnapshotView(null);
        setServerPremiumReady(false);
        if (kind === "romantic") {
          setRomanticDeep(null);
        } else if (kind === "work") {
          setWorkDeep(null);
        } else if (kind === "cohabitation") {
          setCohabitationDeep(null);
        } else if (kind === "family") {
          setFamilyDeep(null);
        } else if (kind === "friendship") {
          setFriendshipDeep(null);
        } else {
          setPremium(null);
        }
      }
      setBusy(true);
      setErr(null);
      try {
        const requestBody = {
          relationship_report_id: resolvedRelationshipId,
          relationship_kind: kind,
          viewer_report_id: effectiveViewerReportId,
          force_regenerate: forceRegenerate,
          language: locale,
          locale,
          ...(kind === "family"
            ? {
                parent_type: familyParentType,
                child_is_viewer: familyChildIsViewer,
              }
            : {}),
        };

        const { res, data } = await fetchJsonWithTimeout(
          "/api/relationship/analyze/premium",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-aha-locale": locale,
            },
            body: JSON.stringify(requestBody),
          },
        );
        if (
          premiumSeq !== premiumSeqRef.current ||
          kindAtStart !== premiumKindRef.current
        ) {
          return false;
        }
        if (!res.ok) {
          setErr(data?.error ?? "심화 분석 실패");
          return false;
        }
        if (kind === "romantic") {
          const prem = data.result_premium;
          if (prem?.format === ROMANTIC_SAJU_DEEP_FORMAT && prem?.report) {
            setRomanticDeep(parseRomanticDeepViewModel(prem.report));
          } else {
            // Legacy perspectives-only is not a valid deep cache — do not force-regenerate here.
            setErr("연인 심화 분석 결과를 받지 못했어요.");
            return false;
          }
        } else if (kind === "work") {
          const prem = data.result_premium;
          if (
            prem?.format === WORK_COLLEAGUE_DEEP_FORMAT &&
            prem?.report?.snapshot_panel
          ) {
            setWorkDeep(prem.report as WorkColleagueReportBody);
          } else {
            setErr("동료 심화 분석 결과를 받지 못했어요.");
            return false;
          }
        } else if (kind === "cohabitation") {
          const prem = data.result_premium;
          if (
            prem?.format === COHABITATION_DEEP_FORMAT &&
            prem?.report?.snapshot_panel
          ) {
            setCohabitationDeep(prem.report as MarriageReportBody);
          } else {
            setErr("동거·결혼 심화 분석 결과를 받지 못했어요.");
            return false;
          }
        } else if (kind === "family") {
          const prem = data.result_premium;
          if (
            prem?.format === FAMILY_PARENT_CHILD_DEEP_FORMAT &&
            prem?.report?.family?.section_child_dna
          ) {
            setFamilyDeep(prem.report as FamilyParentReportBody);
          } else {
            setErr("가족 심화 분석 결과를 받지 못했어요.");
            return false;
          }
        } else if (kind === "friendship") {
          const prem = data.result_premium;
          if (
            prem?.format === FRIEND_SOCIAL_DEEP_FORMAT &&
            prem?.report?.friend?.section_social_dna_a
          ) {
            setFriendshipDeep(prem.report as FriendReportBody);
          } else {
            setErr("친구 심화 분석 결과를 받지 못했어요.");
            return false;
          }
        } else {
          setErr("심화 분석 결과를 받지 못했어요.");
          return false;
        }
        setServerPremiumReady(true);
        await load(kind, { silent: true });
        return true;
      } catch (e) {
        if (
          premiumSeq !== premiumSeqRef.current ||
          kindAtStart !== premiumKindRef.current
        ) {
          return false;
        }
        if (e instanceof DOMException && e.name === "AbortError") {
          setErr("요청 시간이 길어져 중단됐어요. 다시 시도해 주세요.");
          return false;
        }
        setErr("네트워크 문제로 심화 분석에 실패했어요.");
        return false;
      } finally {
        if (premiumSeq === premiumSeqRef.current) {
          setBusy(false);
        }
      }
    },
    [
      resolvedRelationshipId,
      load,
      premiumKind,
      effectiveViewerReportId,
      familyParentType,
      familyChildIsViewer,
    ],
  );

  const regeneratePremium = useCallback(() => {
    const label = RELATIONSHIP_KIND_LABELS[premiumKind];
    if (
      !window.confirm(
        `기존 ${label} 심화 분석을 새 프롬프트로 다시 만들까요?\n(1~2분 걸릴 수 있어요. 이전 결과는 분석 기록에 남아 있어요.)`,
      )
    ) {
      return;
    }
    void runPremium(premiumKind, { forceRegenerate: true });
  }, [premiumKind, runPremium]);

  const onPremiumKindChange = useCallback(
    (kind: RelationshipKind) => {
      setSnapshotView(null);
      setPremiumKind(kind);
      setServerPremiumReady(false);
      setPremium(null);
      setRomanticDeep(null);
      setWorkDeep(null);
      setCohabitationDeep(null);
      setFamilyDeep(null);
      setFriendshipDeep(null);
      if (effectiveViewerReportId && resolvedRelationshipId) {
        const q = new URLSearchParams({
          viewer: effectiveViewerReportId,
          kind,
        });
        router.replace(
          `/relationship/${resolvedRelationshipId}?${q.toString()}`,
          { scroll: false },
        );
      }
      premiumSeqRef.current += 1;
      void load(kind, { silent: true });
    },
    [load, router, effectiveViewerReportId, resolvedRelationshipId],
  );

  const displayBasic =
    snapshotView?.basic !== undefined ? snapshotView.basic : basic;
  const displayPremium =
    snapshotView?.premium !== undefined ? snapshotView.premium : premium;
  const displayRomanticDeep =
    snapshotView?.romanticDeep !== undefined
      ? parseRomanticDeepViewModel(snapshotView.romanticDeep)
      : romanticDeep;
  const displayRomanticMeta = displayRomanticDeep?.meta
    ? {
        psych_match: displayRomanticDeep.meta.psych_match ?? null,
        romantic_fortune_flow: displayRomanticDeep.meta.romantic_fortune_flow ?? null,
      }
    : null;
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
  const displayFriendshipDeep =
    snapshotView?.friendshipDeep !== undefined
      ? snapshotView.friendshipDeep
      : friendshipDeep;

  const localPremiumReady =
    premiumKind === "romantic"
      ? Boolean(displayRomanticDeep?.section_1_summary)
      : premiumKind === "work"
        ? Boolean(displayWorkDeep?.snapshot_panel)
        : premiumKind === "cohabitation"
          ? Boolean(displayCohabitationDeep?.snapshot_panel)
          : premiumKind === "family"
            ? Boolean(displayFamilyDeep?.family?.section_child_dna)
            : premiumKind === "friendship"
              ? Boolean(
                  displayFriendshipDeep?.friend?.section_social_dna_a,
                )
              : Boolean(
                  displayPremium && Object.keys(displayPremium).length > 0,
                );
  // Server hasPremiumCacheForKind (deep-only) + local body checks — same rule for all kinds.
  const premiumReady = serverPremiumReady || localPremiumReady;

  const clearSnapshotView = useCallback(() => {
    setSnapshotView(null);
  }, []);

  const reloadDetail = useCallback(() => {
    void load();
  }, [load]);

  const clearAutostartParam = useCallback(() => {
    if (searchParams.get("autostart") !== "1" || !resolvedRelationshipId) return;
    const q = new URLSearchParams(searchParams.toString());
    q.delete("autostart");
    const qs = q.toString();
    router.replace(
      qs
        ? `/relationship/${resolvedRelationshipId}?${qs}`
        : `/relationship/${resolvedRelationshipId}`,
      { scroll: false },
    );
  }, [router, resolvedRelationshipId, searchParams]);

  const runAutostartPremium = useCallback(async () => {
    if (!resolvedRelationshipId || !effectiveViewerReportId) return;
    setAutostartActive(true);
    setErr(null);
    try {
      await runPremium(premiumKind);
    } finally {
      setAutostartActive(false);
      clearAutostartParam();
    }
  }, [
    resolvedRelationshipId,
    effectiveViewerReportId,
    runPremium,
    premiumKind,
    clearAutostartParam,
  ]);

  useEffect(() => {
    if (!urlAutostart || autostartTriggered.current) return;
    if (loading || !detailOk || !effectiveViewerReportId || !resolvedRelationshipId)
      return;
    if (!basic || Object.keys(basic).length === 0) return;
    if (premiumReady) {
      autostartTriggered.current = true;
      return;
    }
    if (busy || autostartActive) return;
    autostartTriggered.current = true;
    void runAutostartPremium();
  }, [
    urlAutostart,
    loading,
    detailOk,
    effectiveViewerReportId,
    resolvedRelationshipId,
    basic,
    premiumReady,
    busy,
    autostartActive,
    runAutostartPremium,
  ]);

  return {
    router,
    viewerReportId: effectiveViewerReportId,
    canonicalResolving,
    autostartActive,
    resolvedRelationshipId,
    loading,
    busy,
    err,
    partnerName,
    viewerName,
    viewerBirthTimeUnknown,
    partnerBirthTimeUnknown,
    viewerBirthPlaceUnknown,
    partnerBirthPlaceUnknown,
    analysisType,
    premiumKind,
    favorited,
    favoriteBusy,
    snapshotView,
    logs,
    logsLoading,
    familyParentType,
    familyChildIsViewer,
    reportIdA,
    reportIdB,
    nameA,
    nameB,
    viewerIsReportA,
    displayBasic,
    displayPremium,
    displayRomanticDeep,
    displayRomanticMeta,
    displayWorkDeep,
    displayCohabitationDeep,
    displayFamilyDeep,
    displayFriendshipDeep,
    premiumReady,
    toggleFavorite,
    retryAnalysis,
    onPremiumKindChange,
    viewAnalysisLog,
    clearSnapshotView,
    reloadDetail,
    setFamilyParentType,
    setFamilyChildIsViewer,
    runPremium,
    regeneratePremium,
  };
}
