const CREATE_LOCK_KEY = "ahaitsme_report_create_inflight";

/**
 * Resume-or-create an owned self report. Session lock is best-effort;
 * finalizeSurveySubmit provides the hard single-flight around the full submit.
 */
export async function createOwnedReportIdempotent(): Promise<
  { ok: true; reportId: string } | { ok: false; error: string }
> {
  if (typeof window !== "undefined") {
    if (sessionStorage.getItem(CREATE_LOCK_KEY) === "1") {
      return { ok: false, error: "Saving already in progress. Please wait." };
    }
    sessionStorage.setItem(CREATE_LOCK_KEY, "1");
  }

  try {
    const resumeRes = await fetch("/api/home/resume", { method: "GET" });
    if (resumeRes.ok) {
      const resume = (await resumeRes.json()) as {
        reportId?: string | null;
        surveyCompleted?: boolean;
      };
      const rid = resume.reportId?.trim();
      if (rid) {
        localStorage.setItem("reportId", rid);
        return { ok: true, reportId: rid };
      }
    }

    const res = await fetch("/api/report/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_type: "self" }),
    });
    const data = (await res.json()) as { id?: string; error?: string; code?: string };
    if (!res.ok || !data.id) {
      const code = data.code?.trim();
      return {
        ok: false,
        error: code
          ? `${data.error ?? "Could not create your report. Please try again."} [${code}]`
          : (data.error ?? "Could not create your report. Please try again."),
      };
    }
    localStorage.setItem("reportId", data.id);
    return { ok: true, reportId: data.id };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  } finally {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(CREATE_LOCK_KEY);
    }
  }
}
