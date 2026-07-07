import type { BirthV2Session } from "@/lib/v2/onboarding/birthSession";

export type ReportBirthRow = {
  birth_date?: string | null;
  birth_time?: string | null;
  birth_place?: string | null;
};

export type ResolvedReportBirth = BirthV2Session & {
  source: "db" | "session" | "merged";
};

/** DB reports 행 → Blueprint·만세력 공통 출생 입력 */
export function birthFromDbRow(
  row: ReportBirthRow | null | undefined,
): BirthV2Session | null {
  const birthDate = row?.birth_date?.trim();
  if (!birthDate) return null;
  const birthTimeRaw = row?.birth_time?.trim() || null;
  const birthTimeUnknown = !birthTimeRaw;
  return {
    birthDate,
    birthTime: birthTimeUnknown ? null : birthTimeRaw,
    birthTimeUnknown,
    birthPlace: row?.birth_place?.trim() || null,
    savedAt: new Date().toISOString(),
  };
}

function mergeBirthFields(
  db: BirthV2Session,
  session: BirthV2Session,
): BirthV2Session {
  let birthTimeUnknown = db.birthTimeUnknown;
  let birthTime = db.birthTime;
  if (db.birthTimeUnknown && !session.birthTimeUnknown && session.birthTime) {
    birthTimeUnknown = false;
    birthTime = session.birthTime;
  }

  return {
    birthDate: db.birthDate,
    birthTime,
    birthTimeUnknown,
    birthPlace: db.birthPlace?.trim() || session.birthPlace?.trim() || null,
    savedAt: new Date().toISOString(),
  };
}

function needsSessionFill(db: BirthV2Session, session: BirthV2Session): boolean {
  if (!db.birthPlace?.trim() && session.birthPlace?.trim()) return true;
  if (db.birthTimeUnknown && !session.birthTimeUnknown && session.birthTime) {
    return true;
  }
  return false;
}

/**
 * 출생 SSOT: DB 우선 + session으로 빈 칸 보완.
 * (DB에 날짜만 있고 출생지가 비어 있으면 session 출생지를 씀 — 심화 리포트 루프 방지)
 */
export function resolveReportBirth(params: {
  db: ReportBirthRow | null | undefined;
  session: BirthV2Session | null | undefined;
}): ResolvedReportBirth | null {
  const fromDb = birthFromDbRow(params.db);
  const session = params.session?.birthDate?.trim()
    ? params.session
    : null;

  if (!fromDb && !session) return null;
  if (!fromDb && session) {
    return { ...session, source: "session" };
  }
  if (fromDb && !session) {
    return { ...fromDb, source: "db" };
  }

  const merged = mergeBirthFields(fromDb!, session!);
  const source = needsSessionFill(fromDb!, session!) ? "merged" : "db";
  return { ...merged, source };
}

export function birthConflicts(
  db: ReportBirthRow | null | undefined,
  session: BirthV2Session | null | undefined,
): boolean {
  const fromDb = birthFromDbRow(db);
  if (!fromDb || !session?.birthDate) return false;
  if (fromDb.birthDate !== session.birthDate.trim()) return true;
  const dbTime = fromDb.birthTimeUnknown ? null : fromDb.birthTime;
  const sesTime = session.birthTimeUnknown
    ? null
    : session.birthTime?.trim() || null;
  if (dbTime !== sesTime) return true;
  const dbPlace = fromDb.birthPlace?.trim() || "";
  const sesPlace = session.birthPlace?.trim() || "";
  return dbPlace !== sesPlace && dbPlace !== "" && sesPlace !== "";
}
