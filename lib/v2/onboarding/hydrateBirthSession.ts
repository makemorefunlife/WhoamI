import {
  readBirthV2Session,
  writeBirthV2Session,
  type BirthV2Session,
} from "@/lib/v2/onboarding/birthSession";
import { fetchReportBirthFromApi } from "@/lib/v2/onboarding/fetchReportBirthClient";
import {
  birthConflicts,
  resolveReportBirth,
  type ResolvedReportBirth,
} from "@/lib/v2/onboarding/resolveReportBirth";

/** 생년월일만 있어도 Blueprint·기본 분석 가능 */
export function hasMinimalBirth(
  birth: BirthV2Session | null | undefined,
): boolean {
  return Boolean(birth?.birthDate?.trim());
}

type SyncBirthResult = {
  birth: BirthV2Session | null;
  source: ResolvedReportBirth["source"] | null;
  sessionCorrected: boolean;
};

/**
 * 출생 SSOT: reports DB → localStorage 동기화.
 * localStorage만 있고 DB와 다르면 DB 기준으로 session을 덮어씀.
 */
export async function syncBirthSessionFromDb(
  reportId: string,
): Promise<SyncBirthResult> {
  if (!reportId.trim()) {
    return { birth: null, source: null, sessionCorrected: false };
  }

  const dbRow = await fetchReportBirthFromApi(reportId);
  const sessionBefore = readBirthV2Session(reportId);
  const hadConflict = birthConflicts(dbRow, sessionBefore);
  const resolved = resolveReportBirth({ db: dbRow, session: sessionBefore });

  if (!resolved) {
    return {
      birth:
        sessionBefore && hasMinimalBirth(sessionBefore) ? sessionBefore : null,
      source: null,
      sessionCorrected: false,
    };
  }

  const { source, ...birth } = resolved;
  writeBirthV2Session(reportId, birth);

  if (hadConflict) {
    console.warn(
      `[birth-ssot] localStorage 출생 정보를 DB 기준으로 맞췄어요 reportId=${reportId}`,
    );
  }

  return { birth, source, sessionCorrected: hadConflict };
}

/** DB에서 출생 session 복구 (항상 DB 우선) */
export async function hydrateBirthSession(reportId: string): Promise<boolean> {
  const { birth } = await syncBirthSessionFromDb(reportId);
  return hasMinimalBirth(birth);
}

/** Blueprint·계정 등 — DB SSOT로 session 갱신 후 반환 */
export async function ensureBirthSession(
  reportId: string,
): Promise<BirthV2Session | null> {
  const { birth } = await syncBirthSessionFromDb(reportId);
  return birth;
}
