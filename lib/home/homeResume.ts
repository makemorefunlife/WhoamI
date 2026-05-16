import type { SupabaseClient } from "@supabase/supabase-js";
import { countHubRelationshipSummary } from "@/lib/relationship/hubRelationshipSummary";
import { isSurveyCompleteForReport } from "@/lib/report/surveyCompletion";
import { resolveCanonicalReport } from "@/lib/home/resolveCanonicalReport";

export type HomeResumeSessionStatus =
  | "no_report"
  | "survey_in_progress"
  | "hub_ready";

export type HomeResumeCtaBranch =
  | "start-new"
  | "resume-survey"
  | "hub-completed";

export type HomeResumePayload = {
  reportId: string | null;
  sessionStatus: HomeResumeSessionStatus;
  hasReport: boolean;
  surveyCompleted: boolean;
  hasCompletedReport: boolean;
  canResumeSurvey: boolean;
  name: string | null;
  birthDate: string | null;
  birthTime: string | null;
  birthPlace: string | null;
  relationshipSummary: { pending: number; completed: number };
  ctaBranch: HomeResumeCtaBranch;
  invalidHint: boolean;
};

export function resolveHomeCtaBranch(resume: {
  hasReport: boolean;
  surveyCompleted: boolean;
}): HomeResumeCtaBranch {
  if (!resume.hasReport) return "start-new";
  if (resume.surveyCompleted) return "hub-completed";
  return "resume-survey";
}

export async function buildHomeResume(
  supabase: SupabaseClient,
  clerkUserId: string,
  reportIdHint?: string,
): Promise<HomeResumePayload> {
  const { report, invalidHint } = await resolveCanonicalReport(
    supabase,
    clerkUserId,
    reportIdHint,
  );

  if (!report) {
    const empty = {
      reportId: null,
      sessionStatus: "no_report" as const,
      hasReport: false,
      surveyCompleted: false,
      hasCompletedReport: false,
      canResumeSurvey: false,
      name: null,
      birthDate: null,
      birthTime: null,
      birthPlace: null,
      relationshipSummary: { pending: 0, completed: 0 },
      invalidHint,
    };
    return { ...empty, ctaBranch: resolveHomeCtaBranch(empty) };
  }

  const surveyCompleted = await isSurveyCompleteForReport(supabase, report.id);
  const name = report.name?.trim() ?? null;

  const relationshipSummary = surveyCompleted
    ? await countHubRelationshipSummary(supabase, report.id)
    : { pending: 0, completed: 0 };

  const sessionStatus: HomeResumeSessionStatus = surveyCompleted
    ? "hub_ready"
    : "survey_in_progress";

  const core = {
    reportId: report.id,
    sessionStatus,
    hasReport: true,
    surveyCompleted,
    hasCompletedReport: surveyCompleted,
    canResumeSurvey: !surveyCompleted,
    name,
    birthDate: report.birth_date?.trim() ?? null,
    birthTime: report.birth_time?.trim() ?? null,
    birthPlace: report.birth_place?.trim() ?? null,
    relationshipSummary,
    invalidHint,
  };

  return {
    ...core,
    ctaBranch: resolveHomeCtaBranch(core),
  };
}
