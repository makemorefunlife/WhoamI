import {
  readJsonStorage,
  removeJsonStorage,
  writeJsonStorage,
} from "@/lib/v2/storage/localPersist";

const PREFIX = "ahaitsme_v2_birth_";

export type BirthV2Session = {
  birthDate: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  birthPlace: string | null;
  birthPlaceUnknown?: boolean;
  savedAt: string;
};

function storageKey(reportId: string) {
  return `${PREFIX}${reportId}`;
}

export function writeBirthV2Session(
  reportId: string,
  data: Omit<BirthV2Session, "savedAt">,
) {
  if (!reportId) return;
  writeJsonStorage(storageKey(reportId), {
    ...data,
    savedAt: new Date().toISOString(),
  });
}

export function readBirthV2Session(reportId: string): BirthV2Session | null {
  if (!reportId) return null;
  const parsed = readJsonStorage<Partial<BirthV2Session>>(
    storageKey(reportId),
    storageKey(reportId),
  );
  if (!parsed?.birthDate) return null;
  return {
    birthDate: parsed.birthDate,
    birthTime: parsed.birthTime ?? null,
    birthTimeUnknown:
      parsed.birthTimeUnknown === true ||
      parsed.birthTime == null ||
      parsed.birthTime === "",
    birthPlace: parsed.birthPlace?.trim() || null,
    birthPlaceUnknown: parsed.birthPlaceUnknown === true,
    savedAt: parsed.savedAt ?? new Date().toISOString(),
  };
}

export function hasBirthV2Session(reportId: string): boolean {
  return readBirthV2Session(reportId) != null;
}

export function clearBirthV2Session(reportId: string) {
  if (!reportId) return;
  removeJsonStorage(storageKey(reportId), storageKey(reportId));
}
