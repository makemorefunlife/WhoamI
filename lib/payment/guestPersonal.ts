import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isPsychSurveyRequired } from "@/lib/i18n/localePolicy";
import type { Locale } from "@/lib/i18n/locale";
import { getUnknownBirthFallback } from "@/lib/v2/onboarding/birthFallbackPolicy";
import { runPersonalDeepEssenceGeneration } from "@/lib/report/personalDeepEssenceGeneration";
import type { SlimV1ReportResult } from "@/lib/v1/slim/types";
import type { SurveyAnswersInput } from "@/lib/v2/survey/types";
import { isSurveyV2AnswersComplete } from "@/lib/v2/survey/completion";
import { isGuestUsePlan } from "@/lib/payment/tossCatalog";
import { maskEmail } from "@/lib/payment/guestCheckout";
import { logServerError } from "@/lib/security/safeLog";
import { rpcText } from "@/lib/payment/guestAccess";

/**
 * Guest (no-account) use of a single Personal purchase. Every function takes
 * the order id resolved from a valid guest access session -- never from the
 * request -- so the caller must have proven ownership first.
 *
 * Inputs live server-side (guest_personal_profiles, service-role only);
 * generation reads ONLY the stored input. The order's single use is reserved
 * / completed / released in SQL, so concurrent or repeated requests cannot
 * use it twice, and a used order is never also granted as an account credit.
 */

export type GuestOrderRow = {
  order_id: string;
  plan_id: string;
  amount: number | string;
  currency: string;
  status: string;
  guest_email: string | null;
  clerk_user_id: string | null;
  approved_at: string | null;
  locale: string | null;
  guest_use_status: string | null;
};

export type GuestProfileRow = {
  locale: string;
  birth_date: string | null;
  birth_time: string | null;
  birth_time_unknown: boolean;
  birth_place: string | null;
  birth_place_unknown: boolean;
  survey_answers: SurveyAnswersInput | null;
  report: SlimV1ReportResult | null;
  report_locale: string | null;
  generated_at: string | null;
  input_expires_at: string | null;
  retention_expires_at: string | null;
  migrated_report_id: string | null;
};

export type GuestPersonalState = {
  status: "needs_input" | "ready" | "generating" | "generated" | "saved" | "expired" | "linked" | "not_available";
  planId: string;
  locale: Locale;
  surveyRequired: boolean;
  passExpiresAt: string | null;
  input: {
    birthDate: string | null;
    birthTime: string | null;
    birthTimeUnknown: boolean;
    birthPlace: string | null;
    birthPlaceUnknown: boolean;
    hasSurvey: boolean;
  } | null;
  report: SlimV1ReportResult | null;
  generatedAt: string | null;
  retentionExpiresAt: string | null;
  inputExpiresAt: string | null;
  savedReportId: string | null;
  maskedEmail: string | null;
  /** Full purchase email -- only for the verified session holder, to prefill Clerk. */
  email: string | null;
};

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString();
}

export async function loadGuestPersonalState(
  supabase: SupabaseClient,
  orderId: string,
): Promise<GuestPersonalState | null> {
  const { data: o, error } = await supabase
    .from("toss_payment_orders")
    .select("order_id, plan_id, amount, currency, status, guest_email, clerk_user_id, approved_at, locale, guest_use_status")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error || !o) {
    if (error) logServerError("guestPersonal", error, "order_read_failed");
    return null;
  }
  const order = o as GuestOrderRow;
  const { data: p } = await supabase.from("guest_personal_profiles").select("*").eq("order_id", orderId).maybeSingle();
  const profile = (p as GuestProfileRow | null) ?? null;
  const locale: Locale = order.locale === "en-US" ? "en-US" : "ko-KR";
  const passExpiresAt = order.approved_at ? addMonths(order.approved_at, 12) : null;

  let status: GuestPersonalState["status"];
  if (!isGuestUsePlan(order.plan_id) || !order.guest_email) status = "not_available";
  else if (profile?.migrated_report_id) status = "saved";
  else if (order.clerk_user_id) status = "linked";
  else if (order.status !== "paid") status = "not_available";
  else if (order.guest_use_status === "used" && profile?.report) status = "generated";
  else if (order.guest_use_status === "reserved") status = "generating";
  else if (passExpiresAt && new Date(passExpiresAt).getTime() <= Date.now()) status = "expired";
  else if (profile?.birth_date) status = "ready";
  else status = "needs_input";

  return {
    status,
    planId: order.plan_id,
    locale,
    surveyRequired: isPsychSurveyRequired(locale),
    passExpiresAt,
    input: profile && profile.birth_date
      ? {
          birthDate: profile.birth_date,
          birthTime: profile.birth_time,
          birthTimeUnknown: profile.birth_time_unknown,
          birthPlace: profile.birth_place,
          birthPlaceUnknown: profile.birth_place_unknown,
          hasSurvey: Boolean(profile.survey_answers),
        }
      : null,
    report: status === "generated" ? profile?.report ?? null : null,
    generatedAt: profile?.generated_at ?? null,
    retentionExpiresAt: profile?.retention_expires_at ?? null,
    inputExpiresAt: profile?.input_expires_at ?? null,
    savedReportId: profile?.migrated_report_id ?? null,
    maskedEmail: order.guest_email ? maskEmail(order.guest_email) : null,
    email: status === "saved" ? null : order.guest_email,
  };
}

export type GuestInput = {
  birthDate: unknown;
  birthTime?: unknown;
  birthTimeUnknown?: unknown;
  birthPlace?: unknown;
  birthPlaceUnknown?: unknown;
  surveyAnswers?: unknown;
  /** Editing birth details only: keep the survey answers already stored. */
  keepSurvey?: unknown;
};

/** Validates and stores the guest's input (existing KR/US birth + survey rules). */
export async function saveGuestPersonalInput(
  supabase: SupabaseClient,
  orderId: string,
  locale: Locale,
  input: GuestInput,
): Promise<{ ok: true } | { ok: false; code: "invalid_input" | "survey_required" | "locked" | "not_eligible" | "error" }> {
  const birthDate = typeof input.birthDate === "string" ? input.birthDate.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || Number.isNaN(Date.parse(`${birthDate}T00:00:00Z`))) {
    return { ok: false, code: "invalid_input" };
  }
  const timeUnknown = input.birthTimeUnknown === true;
  const birthTime = typeof input.birthTime === "string" ? input.birthTime.trim() : "";
  if (!timeUnknown && !/^\d{2}:\d{2}$/.test(birthTime)) return { ok: false, code: "invalid_input" };
  const placeUnknown = input.birthPlaceUnknown === true;
  const birthPlace = typeof input.birthPlace === "string" ? input.birthPlace.trim().slice(0, 200) : "";
  // Astrology needs a birth place; "unknown" uses the same locale fallback as members.
  if (!placeUnknown && !birthPlace) return { ok: false, code: "invalid_input" };

  let survey: SurveyAnswersInput | null = null;
  if (input.surveyAnswers && typeof input.surveyAnswers === "object" && !Array.isArray(input.surveyAnswers)) {
    const json = JSON.stringify(input.surveyAnswers);
    if (json.length > 20_000) return { ok: false, code: "invalid_input" };
    // Same completeness rule as the member survey (all 10 answered).
    if (!isSurveyV2AnswersComplete(input.surveyAnswers as Record<string, string>)) return { ok: false, code: "invalid_input" };
    survey = input.surveyAnswers as SurveyAnswersInput;
  } else if (input.keepSurvey === true) {
    const { data: prev } = await supabase
      .from("guest_personal_profiles")
      .select("survey_answers")
      .eq("order_id", orderId)
      .maybeSingle();
    survey = ((prev as { survey_answers: SurveyAnswersInput | null } | null)?.survey_answers) ?? null;
  }
  if (isPsychSurveyRequired(locale) && !survey) return { ok: false, code: "survey_required" };

  const { data, error } = await supabase.rpc("save_guest_personal_input", {
    p_order_id: orderId,
    p_locale: locale,
    p_birth_date: birthDate,
    p_birth_time: timeUnknown ? null : birthTime,
    p_birth_time_unknown: timeUnknown,
    p_birth_place: placeUnknown ? null : birthPlace,
    p_birth_place_unknown: placeUnknown,
    p_survey_answers: survey,
  });
  if (error) {
    logServerError("guestPersonal", error, "input_save_failed");
    return { ok: false, code: "error" };
  }
  const r = rpcText(data);
  if (r === "saved") return { ok: true };
  return { ok: false, code: r === "locked" ? "locked" : "not_eligible" };
}

export type GuestGenerateDeps = {
  generate: (input: {
    birthDate: string;
    birthTime: string | null;
    birthTimeUnknown: boolean;
    birthPlace: string | null;
    surveyAnswers: SurveyAnswersInput | null;
    locale: Locale;
  }) => Promise<SlimV1ReportResult>;
};

export type GuestGenerateOutcome =
  | { kind: "ok"; slim_v1: SlimV1ReportResult }
  | { kind: "already_used"; slim_v1: SlimV1ReportResult | null }
  | { kind: "in_progress" }
  | { kind: "rejected"; code: "expired" | "no_input" | "claimed" | "not_eligible" | "survey_required" }
  | { kind: "failed"; status: 500 | 502; code: string };

/**
 * Generates the guest's Personal report once. Uses ONLY the stored input.
 * The order use is reserved first and marked used only after the report is
 * saved; any failure releases it (the buyer can try again).
 */
export async function generateGuestPersonal(
  supabase: SupabaseClient,
  orderId: string,
  deps: GuestGenerateDeps,
): Promise<GuestGenerateOutcome> {
  const state = await loadGuestPersonalState(supabase, orderId);
  if (!state || state.status === "not_available") return { kind: "rejected", code: "not_eligible" };
  if (state.status === "generated") return { kind: "already_used", slim_v1: state.report };
  if (state.status === "linked" || state.status === "saved") return { kind: "rejected", code: "claimed" };

  const { data: p } = await supabase.from("guest_personal_profiles").select("*").eq("order_id", orderId).maybeSingle();
  const profile = p as GuestProfileRow | null;
  if (!profile?.birth_date) return { kind: "rejected", code: "no_input" };
  if (state.surveyRequired && !profile.survey_answers) return { kind: "rejected", code: "survey_required" };

  const requestId = randomUUID();
  let reservedResult: string | null = null;
  const outcome = await runPersonalDeepEssenceGeneration({
    reserveCredit: async () => {
      const { data, error } = await supabase.rpc("reserve_guest_personal_use", {
        p_order_id: orderId,
        p_request_id: requestId,
      });
      if (error) {
        logServerError("guestPersonal", error, "reserve_failed");
        return { ok: false as const, reason: "error" as const };
      }
      reservedResult = rpcText(data);
      return reservedResult === "reserved"
        ? { ok: true as const }
        : { ok: false as const, reason: "insufficient_balance" as const };
    },
    generate: () =>
      deps.generate({
        birthDate: profile.birth_date as string,
        birthTime: profile.birth_time_unknown ? null : profile.birth_time,
        birthTimeUnknown: profile.birth_time_unknown,
        birthPlace: profile.birth_place_unknown ? getUnknownBirthFallback(state.locale).place : profile.birth_place,
        surveyAnswers: profile.survey_answers,
        locale: state.locale,
      }),
    stillOwnsLock: async () => true,
    persist: async (slim_v1) => {
      const { data, error } = await supabase.rpc("complete_guest_personal_use", {
        p_order_id: orderId,
        p_request_id: requestId,
        p_report: slim_v1,
        p_report_locale: state.locale,
      });
      if (error) {
        logServerError("guestPersonal", error, "complete_failed");
        return false;
      }
      return rpcText(data) === "true";
    },
    consumeCredit: async () => {
      /* the order was marked used together with the saved report */
    },
    releaseCredit: async () => {
      await supabase.rpc("release_guest_personal_use", { p_order_id: orderId, p_request_id: requestId });
    },
    log: (tag, error, code) => logServerError(`guest:${tag}`, error, code),
  });

  if (outcome.kind === "ok") return { kind: "ok", slim_v1: outcome.slim_v1 };
  if (outcome.kind === "insufficient_credit") {
    const r = reservedResult as string | null;
    if (r === "in_progress") return { kind: "in_progress" };
    if (r === "already_used") {
      const again = await loadGuestPersonalState(supabase, orderId);
      return { kind: "already_used", slim_v1: again?.report ?? null };
    }
    if (r === "expired" || r === "no_input" || r === "claimed") return { kind: "rejected", code: r };
    return { kind: "rejected", code: "not_eligible" };
  }
  return { kind: "failed", status: outcome.status, code: outcome.code };
}

/** Saves a used guest Personal order into the signed-in account (verified matching email only). */
export async function saveGuestPersonalToAccount(
  supabase: SupabaseClient,
  params: { orderId: string; clerkUserId: string; verifiedEmails: string[] },
): Promise<{ result: string; reportId: string | null }> {
  const emails = [...new Set(params.verifiedEmails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  const { data, error } = await supabase.rpc("save_guest_personal_to_account", {
    p_order_id: params.orderId,
    p_clerk_user_id: params.clerkUserId,
    p_verified_emails: emails,
  });
  if (error) {
    logServerError("guestPersonal", error, "save_to_account_failed");
    return { result: "error", reportId: null };
  }
  const row = (Array.isArray(data) ? data[0] : data) as { result?: string; report_id?: string | null } | undefined;
  return { result: row?.result ?? "error", reportId: row?.report_id ?? null };
}
