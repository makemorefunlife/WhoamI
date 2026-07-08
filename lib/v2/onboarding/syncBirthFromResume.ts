import {
  readBirthV2Session,
  writeBirthV2Session,
} from "@/lib/v2/onboarding/birthSession";
import { isBirthPlaceFallback } from "@/lib/v2/onboarding/birthFallbackPolicy";

/** 홈 resume·DB 행 → localStorage 출생 session 동기화 */
export function syncBirthFromResumeFields(
  reportId: string,
  fields: {
    birthDate?: string | null;
    birthTime?: string | null;
    birthPlace?: string | null;
  },
) {
  const birthDate = fields.birthDate?.trim();
  if (!reportId || !birthDate) return;

  const birthTimeRaw = fields.birthTime?.trim() || null;
  const existing = readBirthV2Session(reportId);

  writeBirthV2Session(reportId, {
    birthDate,
    birthTime: birthTimeRaw,
    birthTimeUnknown: !birthTimeRaw,
    birthPlace: fields.birthPlace?.trim() || existing?.birthPlace?.trim() || null,
    birthPlaceUnknown: isBirthPlaceFallback(fields.birthPlace),
  });
}
