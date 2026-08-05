import type { CurrentSelfProfile } from "@/lib/v2/survey/types";

/**
 * Final survey submit — single-flight orchestration.
 *
 * Failure mode this replaces (one click → many popups → 429):
 * 1. completeAfterLogin hit 503 (create) or save failure → alert + set PENDING_COMPLETE
 * 2. setFinishing(false) re-armed the pending-complete useEffect
 * 3. Effect deps (finishing / answers / callback identity) re-fired → another create+POST
 * 4. Each failure alert()'d; shared survey_persist bucket exhausted → "rate limit exceeded"
 *
 * Guarantees: at most one create+persist sequence at a time; failures do not auto-retry.
 */

export type FinalizeSurveyResult =
  | { ok: true; reportId: string }
  | { ok: false; error: string; deduped?: boolean };

export type FinalizeSurveyDeps = {
  createOwnedReport: () => Promise<
    | { ok: true; reportId: string; source: "home_resume" | "report_create" }
    | { ok: false; error: string }
  >;
  persistSurvey: (
    reportId: string,
    answers: Record<string, string>,
    profile: CurrentSelfProfile,
    meta?: {
      reportIdSource?: string;
      submitTrigger?: string;
    },
  ) => Promise<{ ok: boolean; error?: string }>;
  scoreAnswers: (answers: Record<string, string>) => CurrentSelfProfile;
  writeLocalSession: (
    reportId: string,
    data: { answers: Record<string, string>; profile: CurrentSelfProfile },
  ) => void;
  clearPendingDraft: () => void;
};

let inflight: Promise<FinalizeSurveyResult> | null = null;

/** Test-only */
export function resetFinalizeSurveySubmitForTests(): void {
  inflight = null;
}

export function isFinalizeSurveySubmitInFlight(): boolean {
  return inflight !== null;
}

export async function finalizeSurveySubmit(
  answers: Record<string, string>,
  deps: FinalizeSurveyDeps,
): Promise<FinalizeSurveyResult> {
  if (inflight) {
    // Join the in-flight sequence — second click must not start another create/POST.
    return inflight;
  }

  const run = (async (): Promise<FinalizeSurveyResult> => {
    const created = await deps.createOwnedReport();
    if (!created.ok) {
      return { ok: false, error: created.error };
    }

    const profile = deps.scoreAnswers(answers);
    deps.writeLocalSession(created.reportId, {
      answers,
      profile,
    });

    const saved = await deps.persistSurvey(
      created.reportId,
      answers,
      profile,
      { reportIdSource: created.source },
    );
    if (!saved.ok) {
      return {
        ok: false,
        error:
          saved.error ??
          "Could not save your answers. Check your connection and try again.",
      };
    }

    deps.clearPendingDraft();
    return { ok: true, reportId: created.reportId };
  })();

  inflight = run;
  try {
    return await run;
  } finally {
    if (inflight === run) inflight = null;
  }
}
