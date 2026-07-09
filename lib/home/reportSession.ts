import type { HomeResumePayload } from "@/lib/home/homeResume";
import {
  applyResumeReportIdToStorage,
  fetchHomeResumeClient,
} from "@/lib/home/fetchHomeResumeClient";
import { logCanonicalReportIdMismatch } from "@/lib/home/canonicalReportIdLog";
import { syncBirthFromResumeFields } from "@/lib/v2/onboarding/syncBirthFromResume";
import { hydrateReportSessions } from "@/lib/v2/report/hydrateReportSessions";
import { migrateLocalReportSessions } from "@/lib/v2/report/migrateLocalReportSessions";
import type { CanonicalReportIdSource } from "@/lib/home/resolveCanonicalReportIdClientTypes";
import { invalidateHomeResumeCache } from "@/lib/home/fetchHomeResumeClient";
import { ensureGuestAccountMerged } from "@/lib/home/mergeGuestAccountClient";

export type ReportSession = {
  reportId: string;
  source: CanonicalReportIdSource;
  invalidHint: boolean;
  surveyCompleted: boolean;
  hasReport: boolean;
  birthDate: string | null;
  birthTime: string | null;
  birthPlace: string | null;
  isPremium: boolean;
  relationshipSummary: { pending: number; completed: number };
};

export type LoadReportSessionOptions = {
  /** URL 쿼리 등 reportId 힌트 */
  urlHint?: string;
  /** 로그 컨텍스트 */
  context?: string;
  /** false면 설문·출생 local 복구 생략 (관계 허브 등) */
  hydrate?: boolean;
  /** true면 캐시 무시하고 resume 재조회 */
  forceRefresh?: boolean;
  /** false면 게스트→계정 병합 생략 (기본: 수행) */
  mergeGuestAccount?: boolean;
};

const SESSION_CACHE_TTL_MS = 60_000;

let sessionCache: {
  key: string;
  at: number;
  session: ReportSession;
} | null = null;

const hydratedReportIds = new Set<string>();
const inFlight = new Map<string, Promise<ReportSession>>();

function readStoredReportId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("reportId")?.trim() ?? "";
}

function sessionCacheKey(hint: string): string {
  return hint || "__none__";
}

function payloadToSession(
  data: HomeResumePayload,
  reportId: string,
  source: CanonicalReportIdSource,
): ReportSession {
  const summary = data.relationshipSummary ?? { pending: 0, completed: 0 };
  return {
    reportId,
    source,
    invalidHint: data.invalidHint === true,
    surveyCompleted: data.surveyCompleted === true,
    hasReport: data.hasReport === true,
    birthDate: data.birthDate?.trim() || null,
    birthTime: data.birthTime?.trim() || null,
    birthPlace: data.birthPlace?.trim() || null,
    isPremium: data.isPremium === true,
    relationshipSummary: {
      pending: summary.pending ?? 0,
      completed: summary.completed ?? 0,
    },
  };
}

function emptySession(): ReportSession {
  return {
    reportId: "",
    source: "none",
    invalidHint: false,
    surveyCompleted: false,
    hasReport: false,
    birthDate: null,
    birthTime: null,
    birthPlace: null,
    isPremium: false,
    relationshipSummary: { pending: 0, completed: 0 },
  };
}

async function hydrateOnce(
  reportId: string,
  surveyCompleted: boolean,
): Promise<void> {
  if (!reportId.trim() || hydratedReportIds.has(reportId)) return;
  hydratedReportIds.add(reportId);
  await hydrateReportSessions(reportId, { surveyCompleted });
}

/**
 * SSOT: /api/home/resume → canonical reportId.
 * localStorage.reportId는 서버가 확정한 ID의 힌트/캐시만 유지.
 */
export async function loadReportSession(
  options: LoadReportSessionOptions = {},
): Promise<ReportSession> {
  const hint = options.urlHint?.trim() ?? "";
  const stored = readStoredReportId();
  const resumeHint = hint || stored;
  const hydrate = options.hydrate !== false;
  const cacheKey = sessionCacheKey(resumeHint);
  const now = Date.now();

  if (
    !options.forceRefresh &&
    sessionCache &&
    sessionCache.key === cacheKey &&
    now - sessionCache.at < SESSION_CACHE_TTL_MS
  ) {
    const cached = sessionCache.session;
    if (hydrate && cached.reportId) {
      await hydrateOnce(cached.reportId, cached.surveyCompleted);
    }
    return cached;
  }

  const existing = inFlight.get(cacheKey);
  if (existing && !options.forceRefresh) {
    return existing;
  }

  const work = (async (): Promise<ReportSession> => {
    if (options.mergeGuestAccount !== false) {
      await ensureGuestAccountMerged(hint || stored || undefined);
      sessionCache = null;
    }

    // 힌트 없어도 호출 — 로그인 사용자는 Clerk 세션으로 계정 reportId 복구 (브라우저 전환)
    const resume = await fetchHomeResumeClient(resumeHint || undefined);

    if (resume.ok) {
      const canonical = applyResumeReportIdToStorage(resume.data)?.trim() ?? "";
      if (canonical) {
        for (const oldId of [hint, stored].filter(
          (id) => id && id !== canonical,
        )) {
          migrateLocalReportSessions(oldId, canonical);
        }
        syncBirthFromResumeFields(canonical, {
          birthDate: resume.data.birthDate,
          birthTime: resume.data.birthTime,
          birthPlace: resume.data.birthPlace,
        });
        if (hydrate) {
          await hydrateOnce(canonical, resume.data.surveyCompleted === true);
        }
      }
      if (hint && canonical && options.context) {
        logCanonicalReportIdMismatch(hint, canonical, options.context);
      }
      const session = canonical
        ? payloadToSession(resume.data, canonical, "resume")
        : emptySession();
      sessionCache = { key: cacheKey, at: Date.now(), session };
      return session;
    }

    if (resumeHint) {
      if (typeof window !== "undefined") {
        localStorage.setItem("reportId", resumeHint);
      }
      if (hydrate) {
        await hydrateOnce(resumeHint, false);
      }
      const session: ReportSession = {
        reportId: resumeHint,
        source: "hint-fallback",
        invalidHint: false,
        surveyCompleted: false,
        hasReport: true,
        birthDate: null,
        birthTime: null,
        birthPlace: null,
        isPremium: false,
        relationshipSummary: { pending: 0, completed: 0 },
      };
      sessionCache = { key: cacheKey, at: Date.now(), session };
      return session;
    }

    const empty = emptySession();
    sessionCache = { key: cacheKey, at: Date.now(), session: empty };
    return empty;
  })();

  inFlight.set(cacheKey, work);
  try {
    return await work;
  } finally {
    inFlight.delete(cacheKey);
  }
}

/** 새 report 생성·reset 후 호출 */
export function invalidateReportSession(reportId?: string): void {
  sessionCache = null;
  inFlight.clear();
  invalidateHomeResumeCache();
  if (reportId) {
    hydratedReportIds.delete(reportId);
  } else {
    hydratedReportIds.clear();
  }
}

export function getCachedReportId(): string {
  return sessionCache?.session.reportId?.trim() ?? readStoredReportId();
}

export function getCachedSession(): ReportSession | null {
  return sessionCache?.session ?? null;
}
