import {
  applyResumeReportIdToStorage,
  fetchHomeResumeClient,
} from "@/lib/home/fetchHomeResumeClient";
import { logCanonicalReportIdMismatch } from "@/lib/home/canonicalReportIdLog";
import { syncBirthFromResumeFields } from "@/lib/v2/onboarding/syncBirthFromResume";
import { hydrateReportSessions } from "@/lib/v2/report/hydrateReportSessions";
import { migrateLocalReportSessions } from "@/lib/v2/report/migrateLocalReportSessions";

export type CanonicalReportIdSource = "resume" | "hint-fallback" | "none";

export type ResolveCanonicalReportIdResult = {
  canonicalReportId: string;
  urlHint: string;
  source: CanonicalReportIdSource;
  invalidHint: boolean;
  surveyCompleted: boolean;
};

/**
 * /api/home/resume 로 canonical reportId 확정.
 * URL/localStorage 값은 힌트만. 실패(비로그인 등) 시 힌트 폴백.
 */
export async function resolveCanonicalReportIdClient(
  urlHint?: string,
  context = "resolve",
  options?: { skipSessionHydrate?: boolean },
): Promise<ResolveCanonicalReportIdResult> {
  const hint = urlHint?.trim() ?? "";
  const stored =
    typeof window !== "undefined"
      ? localStorage.getItem("reportId")?.trim() ?? ""
      : "";
  const resumeHint = hint || stored;

  const resume = await fetchHomeResumeClient(resumeHint || undefined);

  if (resume.ok) {
    const canonical = applyResumeReportIdToStorage(resume.data)?.trim() ?? "";
    if (canonical) {
      for (const oldId of [hint, stored].filter((id) => id && id !== canonical)) {
        migrateLocalReportSessions(oldId, canonical);
      }
      if (!options?.skipSessionHydrate) {
        syncBirthFromResumeFields(canonical, {
          birthDate: resume.data.birthDate,
          birthTime: resume.data.birthTime,
          birthPlace: resume.data.birthPlace,
        });
        await hydrateReportSessions(canonical, {
          surveyCompleted: resume.data.surveyCompleted === true,
        });
      }
    }
    if (hint && canonical) {
      logCanonicalReportIdMismatch(hint, canonical, context);
    }
    return {
      canonicalReportId: canonical,
      urlHint: hint,
      source: canonical ? "resume" : "none",
      invalidHint: resume.data.invalidHint,
      surveyCompleted: resume.data.surveyCompleted === true,
    };
  }

  if (resumeHint) {
    if (resume.status === 401) {
      console.info(
        `[canonical-report] urlHint=${hint || stored} canonical=${resumeHint} context=${context}-guest-fallback`,
      );
    } else {
      console.warn(
        `[canonical-report] resume failed status=${resume.status} fallback hint=${resumeHint} context=${context}`,
      );
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("reportId", resumeHint);
    }
    if (!options?.skipSessionHydrate) {
      await hydrateReportSessions(resumeHint);
    }
    return {
      canonicalReportId: resumeHint,
      urlHint: hint,
      source: "hint-fallback",
      invalidHint: false,
      surveyCompleted: false,
    };
  }

  return {
    canonicalReportId: "",
    urlHint: hint,
    source: "none",
    invalidHint: false,
    surveyCompleted: false,
  };
}
