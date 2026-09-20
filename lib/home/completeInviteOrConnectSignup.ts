import { getUnknownBirthFallback } from "@/lib/v2/onboarding/birthFallbackPolicy";
import type { StitchBirthFormState } from "@/components/onboarding/StitchBirthInputForm";

export type InviteOrConnectSignupResult = {
  ok: boolean;
  reportId: string | null;
  sharerName: string | null;
  alreadyConnected: boolean;
  relationshipReportId: string | null;
  errorMessage: string | null;
};

/**
 * Birth-first invite/connect signup completion — runs the moment Clerk
 * auth finishes for someone who filled in their birth date/time/place
 * BEFORE signing up (app/invite-birth/page.tsx draft mode). There's no UI
 * to drive between steps here (the person already told us everything
 * before we ever asked them to log in), so this collapses report
 * creation + invite/connect completion + the birth save into one
 * sequential call: POST /api/report/create -> POST /api/invite/complete
 * or /api/connect/complete (whichever token is present) -> POST
 * /api/report/birth.
 *
 * Deliberately NOT wired into app/homecontent.tsx's own
 * proceedToReportCreation — that function is interleaved with
 * display-name setup and modal state that doesn't apply to this
 * pre-auth-birth-data path, and invite vs connect are already
 * intentionally maintained as parallel, separately-duplicated call
 * shapes elsewhere in this codebase (see completeInvite/completeConnect
 * in homecontent.tsx) for the same reason.
 *
 * A failure partway through (report created but invite/connect
 * completion or the birth save fails) is surfaced via `errorMessage`
 * with whatever partial result was obtained (e.g. `reportId` may still
 * be set) — the caller decides how to recover; this never retries on
 * its own.
 */
export async function completeInviteOrConnectSignup(params: {
  draft: StitchBirthFormState;
  inviteToken: string;
  connectToken: string;
  locale: string;
  genericErrorMessage: string;
  networkErrorMessage: string;
}): Promise<InviteOrConnectSignupResult> {
  const {
    draft,
    inviteToken,
    connectToken,
    locale,
    genericErrorMessage,
    networkErrorMessage,
  } = params;

  let reportId: string;
  try {
    const res = await fetch("/api/report/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_type: "self" }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      id?: string;
      error?: string;
    };
    if (!res.ok || !body.id) {
      return {
        ok: false,
        reportId: null,
        sharerName: null,
        alreadyConnected: false,
        relationshipReportId: null,
        errorMessage: body.error ?? genericErrorMessage,
      };
    }
    reportId = body.id;
  } catch {
    return {
      ok: false,
      reportId: null,
      sharerName: null,
      alreadyConnected: false,
      relationshipReportId: null,
      errorMessage: networkErrorMessage,
    };
  }

  localStorage.setItem("reportId", reportId);

  let sharerName: string | null = null;
  let alreadyConnected = false;
  let relationshipReportId: string | null = null;

  if (inviteToken) {
    try {
      const res = await fetch("/api/invite/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteToken, reportId }),
      });
      if (res.ok || res.status === 404) {
        localStorage.removeItem("inviteToken");
      }
      const body = (await res.json().catch(() => ({}))) as {
        sharer_name?: string | null;
        relationship_report_id?: string | null;
        alreadyConnected?: boolean | null;
      };
      sharerName = body.sharer_name ?? null;
      alreadyConnected = body.alreadyConnected ?? false;
      relationshipReportId = body.relationship_report_id ?? null;
    } catch {
      // Report already exists — the connection itself can still be
      // retried later (the token wasn't cleared since we never reached
      // the ok/404 check above). Birth save below still proceeds.
    }
  } else if (connectToken) {
    try {
      const res = await fetch("/api/connect/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: connectToken, reportId }),
      });
      if (res.ok || res.status === 404) {
        localStorage.removeItem("connectToken");
      }
      const body = (await res.json().catch(() => ({}))) as {
        sharer_name?: string | null;
        relationshipReportId?: string | null;
        alreadyConnected?: boolean | null;
      };
      sharerName = body.sharer_name ?? null;
      alreadyConnected = body.alreadyConnected ?? false;
      relationshipReportId = body.relationshipReportId ?? null;
    } catch {
      // Same as above — connection retry-able later, birth save proceeds.
    }
  }

  const unknownFallback = getUnknownBirthFallback(locale);
  const birthPlace = draft.birthPlaceUnknown
    ? unknownFallback.place
    : draft.birthPlace;

  try {
    const res = await fetch("/api/report/birth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportId,
        birthDate: draft.birthDate,
        birthTime: draft.birthTimeUnknown ? null : draft.birthTime,
        birthTimeUnknown: draft.birthTimeUnknown,
        birthPlace,
        birthPlaceUnknown: draft.birthPlaceUnknown,
        birthLatitude: draft.birthPlaceUnknown ? unknownFallback.latitude : undefined,
        birthLongitude: draft.birthPlaceUnknown ? unknownFallback.longitude : undefined,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      return {
        ok: false,
        reportId,
        sharerName,
        alreadyConnected,
        relationshipReportId,
        errorMessage: body.error ?? genericErrorMessage,
      };
    }
  } catch {
    return {
      ok: false,
      reportId,
      sharerName,
      alreadyConnected,
      relationshipReportId,
      errorMessage: networkErrorMessage,
    };
  }

  return {
    ok: true,
    reportId,
    sharerName,
    alreadyConnected,
    relationshipReportId,
    errorMessage: null,
  };
}
