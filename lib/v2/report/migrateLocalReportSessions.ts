import {
  readBirthV2Session,
  writeBirthV2Session,
} from "@/lib/v2/onboarding/birthSession";
import {
  readSurveyV2Session,
  writeSurveyV2Session,
} from "@/lib/v2/survey/session";

/** canonical reportId가 바뀔 때 이전 localStorage 세션을 새 ID로 옮김 */
export function migrateLocalReportSessions(fromId: string, toId: string) {
  const from = fromId.trim();
  const to = toId.trim();
  if (!from || !to || from === to) return;

  if (!readSurveyV2Session(to)) {
    const survey = readSurveyV2Session(from);
    if (survey) {
      writeSurveyV2Session(to, {
        answers: survey.answers,
        profile: survey.profile,
      });
    }
  }

  if (!readBirthV2Session(to)) {
    const birth = readBirthV2Session(from);
    if (birth) {
      writeBirthV2Session(to, {
        birthDate: birth.birthDate,
        birthTime: birth.birthTime,
        birthTimeUnknown: birth.birthTimeUnknown,
        birthPlace: birth.birthPlace,
      });
    }
  }
}
