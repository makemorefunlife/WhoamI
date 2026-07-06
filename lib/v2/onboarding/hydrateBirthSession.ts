import {
  hasBirthV2Session,
  readBirthV2Session,
  writeBirthV2Session,
  type BirthV2Session,
} from "@/lib/v2/onboarding/birthSession";
import { fetchReportBirthFromApi } from "@/lib/v2/onboarding/fetchReportBirthClient";
import { resolveReportBirth } from "@/lib/v2/onboarding/resolveReportBirth";

/** 생년월일만 있어도 Blueprint·기본 분석 가능 */
export function hasMinimalBirth(
  birth: BirthV2Session | null | undefined,
): boolean {
  return Boolean(birth?.birthDate?.trim());
}

/** 로컬 없으면 DB에서 출생 정보를 복구해 localStorage에 기록 */
export async function hydrateBirthSession(reportId: string): Promise<boolean> {
  if (!reportId.trim()) return false;
  if (hasBirthV2Session(reportId)) return true;

  const dbRow = await fetchReportBirthFromApi(reportId);
  const sessionBirth = readBirthV2Session(reportId);
  const resolved = resolveReportBirth({ db: dbRow, session: sessionBirth });
  if (!hasMinimalBirth(resolved)) return false;

  const { source: _s, ...birth } = resolved!;
  writeBirthV2Session(reportId, birth);
  return true;
}

/** 로컬 + DB 병합 후 session 갱신 */
export async function ensureBirthSession(
  reportId: string,
): Promise<BirthV2Session | null> {
  if (!reportId.trim()) return null;

  const dbRow = await fetchReportBirthFromApi(reportId);
  const sessionBirth = readBirthV2Session(reportId);
  const resolved = resolveReportBirth({ db: dbRow, session: sessionBirth });
  if (!resolved) {
    return sessionBirth && hasMinimalBirth(sessionBirth) ? sessionBirth : null;
  }

  const { source: _s, ...birth } = resolved;
  writeBirthV2Session(reportId, birth);
  return birth;
}
