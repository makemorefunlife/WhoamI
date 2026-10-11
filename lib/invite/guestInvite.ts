import { createHmac } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";
import { hashSessionToken, newSessionToken, newVerificationCode } from "@/lib/payment/guestAccess";
import { normalizeGuestEmail } from "@/lib/payment/guestCheckout";
import { ensureRelationshipReport } from "@/lib/relationship/createRelationshipReport";
import { initialMembershipsForInviteAccept } from "@/lib/relationship/map/directionalMembership";
import { invalidateRelationshipMapCache } from "@/lib/relationship/map/computeRelationshipMap";
import { mergeBirthCoordinateFields, insertReportPatchSafely } from "@/lib/report/applyBirthCoordinatePatch";
import { getUnknownBirthFallback } from "@/lib/v2/onboarding/birthFallbackPolicy";
import { scoreSurveyAnswers } from "@/lib/v2/survey/scorer";
import type { SurveyAnswersInput } from "@/lib/v2/survey/types";
import { isPsychSurveyRequired } from "@/lib/i18n/localePolicy";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Non-member invite participation (SERVER ONLY) -- 20261011130000.
 *
 * Proof of participation is an httpOnly session cookie, created when the
 * guest joins or recovered on another browser with a code sent to an email
 * address the guest verified. The invite token only lets someone CLAIM an
 * open invite once; it never proves who they are, and it never links an
 * account by itself (linking needs a signed-in account + this session).
 */
export const GUEST_INVITE_COOKIE = "aha_gisess";
export const GUEST_INVITE_TTL_DAYS = 30;
const CODE_TTL_S = 10 * 60;
const CODE_MAX_ATTEMPTS = 5;

export function guestInviteCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

function codeSecret(): string | null {
  const s = process.env.GUEST_CLAIM_TOKEN_SECRET?.trim() ?? "";
  return s.length >= 32 ? s : null;
}

export function hashInviteCode(email: string, purpose: string, code: string): string | null {
  const key = codeSecret();
  return key ? createHmac("sha256", key).update(`invite:${purpose}:${email}:${code.trim()}`).digest("hex") : null;
}

export type GuestJoinInput = {
  inviteToken: string;
  locale: Locale;
  displayName: string;
  birthDate: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  birthPlace: string | null;
  birthPlaceUnknown: boolean;
  surveyAnswers: Record<string, string> | null;
  consent: { age: boolean; privacy: boolean };
};

export type GuestJoinResult =
  | { ok: true; sessionToken: string; expiresAt: Date; participantId: string }
  | { ok: false; code: "invalid" | "consent_required" | "survey_required" | "unavailable" | "self_invite" | "error" };

const BIRTH_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

/** Joins an open invite as a guest. Atomic claim first; everything is undone if a later step fails. */
export async function joinInviteAsGuest(
  supabase: SupabaseClient,
  input: GuestJoinInput,
): Promise<GuestJoinResult> {
  const name = input.displayName.trim().slice(0, 40);
  if (!name || !BIRTH_RE.test(input.birthDate) || (input.birthTime && !TIME_RE.test(input.birthTime))) {
    return { ok: false, code: "invalid" };
  }
  if (!input.consent.privacy || (input.locale === "ko-KR" && !input.consent.age)) {
    return { ok: false, code: "consent_required" };
  }
  if (isPsychSurveyRequired(input.locale) && !input.surveyAnswers) {
    return { ok: false, code: "survey_required" };
  }

  const { data: claimed, error: claimErr } = await supabase.rpc("claim_invite_for_guest", {
    p_invite_token: input.inviteToken,
  });
  if (claimErr) {
    logServerError("guestInvite.claim", claimErr, "claim_failed");
    return { ok: false, code: "error" };
  }
  const claim = (Array.isArray(claimed) ? claimed[0] : claimed) as { invite_id?: string; from_report_id?: string } | null;
  if (!claim?.invite_id || !claim.from_report_id) return { ok: false, code: "unavailable" };
  const inviteId = claim.invite_id;
  const inviterReportId = claim.from_report_id;

  const participantId = crypto.randomUUID();
  let guestReportId: string | null = null;
  try {
    const fallback = getUnknownBirthFallback(input.locale);
    const birthPlace = input.birthPlaceUnknown ? fallback.place : input.birthPlace?.trim() || fallback.place;
    const patch = mergeBirthCoordinateFields(
      {
        name,
        birth_date: input.birthDate,
        birth_time: input.birthTimeUnknown ? null : input.birthTime,
        birth_place: birthPlace,
        report_type: "guest_invitee",
        entitlement: "free",
        // Never a Clerk id: no member route ever treats this row as owned.
        clerk_user_id: `guest_invite:${participantId}`,
      },
      birthPlace,
      input.locale,
    );
    const { data: rep, error: repErr } = await insertReportPatchSafely(supabase, patch);
    if (repErr || !rep?.id) throw repErr ?? new Error("guest report not created");
    guestReportId = rep.id as string;

    if (input.surveyAnswers) {
      const profile = scoreSurveyAnswers(input.surveyAnswers as SurveyAnswersInput);
      const { error: sErr } = await supabase.from("survey_responses").insert({
        report_id: guestReportId,
        answers: { ...input.surveyAnswers, v2_profile: profile, survey_source: "v2_10q" },
      });
      if (sErr) throw sErr;
    }

    const { relationshipReportId } = await ensureRelationshipReport(supabase, inviterReportId, guestReportId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + GUEST_INVITE_TTL_DAYS * 86_400_000);
    const { error: pErr } = await supabase.from("guest_invite_participants").insert({
      id: participantId,
      invite_id: inviteId,
      report_id: guestReportId,
      relationship_report_id: relationshipReportId,
      inviter_report_id: inviterReportId,
      locale: input.locale,
      consent: { age: input.consent.age, privacy: true, at: now.toISOString(), locale: input.locale, version: "2026-10-11" },
      expires_at: expiresAt.toISOString(),
    });
    if (pErr) throw pErr;

    await supabase.from("invites").update({ relationship_report_id: relationshipReportId }).eq("id", inviteId);

    // The relationship appears on the inviter's Relation Map.
    const { inviterSeesInvitee } = initialMembershipsForInviteAccept();
    await supabase.from("relationship_map_memberships").upsert(
      {
        relationship_report_id: relationshipReportId,
        viewer_report_id: inviterReportId,
        other_report_id: guestReportId,
        status: inviterSeesInvitee,
        responded_at: now.toISOString(),
      },
      { onConflict: "relationship_report_id,viewer_report_id" },
    );
    invalidateRelationshipMapCache(inviterReportId);

    const sessionToken = newSessionToken();
    const { error: sessErr } = await supabase.from("guest_invite_sessions").insert({
      session_hash: hashSessionToken(sessionToken),
      participant_id: participantId,
      via: "join",
      expires_at: expiresAt.toISOString(),
    });
    if (sessErr) throw sessErr;
    return { ok: true, sessionToken, expiresAt, participantId };
  } catch (e) {
    logServerError("guestInvite.join", e, "join_failed");
    // Undo: no half-made participation.
    await supabase.from("guest_invite_participants").delete().eq("id", participantId);
    if (guestReportId) await supabase.from("reports").delete().eq("id", guestReportId).eq("report_type", "guest_invitee");
    await supabase.rpc("release_guest_invite_claim", { p_invite_id: inviteId });
    return { ok: false, code: "error" };
  }
}

export type GuestParticipant = {
  id: string;
  invite_id: string;
  report_id: string | null;
  relationship_report_id: string | null;
  inviter_report_id: string | null;
  locale: string;
  email: string | null;
  email_verified_at: string | null;
  status: string;
  expires_at: string;
};

/** Active participant behind a session cookie, else null. */
export async function resolveGuestParticipant(
  supabase: SupabaseClient,
  token: string | null | undefined,
): Promise<GuestParticipant | null> {
  if (!token || token.length < 20 || token.length > 100) return null;
  const nowIso = new Date().toISOString();
  const { data: sess } = await supabase
    .from("guest_invite_sessions")
    .select("participant_id, expires_at, revoked_at")
    .eq("session_hash", hashSessionToken(token))
    .maybeSingle();
  if (!sess || sess.revoked_at || sess.expires_at <= nowIso) return null;
  const { data: p } = await supabase
    .from("guest_invite_participants")
    .select("id, invite_id, report_id, relationship_report_id, inviter_report_id, locale, email, email_verified_at, status, expires_at")
    .eq("id", sess.participant_id)
    .maybeSingle();
  if (!p || p.status !== "active" || p.expires_at <= nowIso) return null;
  return p as GuestParticipant;
}

/** Issues a 6-digit code; returns it for sending (only the hash is stored). */
export async function issueInviteCode(
  supabase: SupabaseClient,
  params: { participantId: string | null; purpose: "verify" | "recover"; email: string },
): Promise<string | null> {
  const email = normalizeGuestEmail(params.email);
  if (!email) return null;
  const code = newVerificationCode();
  const hash = hashInviteCode(email, params.purpose, code);
  if (!hash) return null;
  const { error } = await supabase.from("guest_invite_codes").insert({
    participant_id: params.participantId,
    purpose: params.purpose,
    email,
    code_hash: hash,
    expires_at: new Date(Date.now() + CODE_TTL_S * 1000).toISOString(),
  });
  if (error) {
    logServerError("guestInvite.code", error, "code_insert_failed");
    return null;
  }
  return code;
}

/** Checks the newest unused code for (email, purpose); single use, limited attempts. */
export async function consumeInviteCode(
  supabase: SupabaseClient,
  params: { purpose: "verify" | "recover"; email: string; code: string },
): Promise<{ participantId: string | null } | null> {
  const email = normalizeGuestEmail(params.email);
  if (!email || !/^\d{6}$/.test(params.code.trim())) return null;
  const { data: row } = await supabase
    .from("guest_invite_codes")
    .select("id, participant_id, code_hash, attempts, expires_at, used_at")
    .eq("email", email)
    .eq("purpose", params.purpose)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row || row.expires_at <= new Date().toISOString() || row.attempts >= CODE_MAX_ATTEMPTS) return null;
  const expected = hashInviteCode(email, params.purpose, params.code);
  if (!expected || expected !== row.code_hash) {
    await supabase.from("guest_invite_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
    return null;
  }
  const { data: used } = await supabase
    .from("guest_invite_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", row.id)
    .is("used_at", null)
    .select("id")
    .maybeSingle();
  return used ? { participantId: (row.participant_id as string | null) ?? null } : null;
}

export async function openParticipantSession(
  supabase: SupabaseClient,
  participant: { id: string; expires_at: string },
  via: "join" | "code",
): Promise<string | null> {
  const token = newSessionToken();
  const { error } = await supabase.from("guest_invite_sessions").insert({
    session_hash: hashSessionToken(token),
    participant_id: participant.id,
    via,
    expires_at: participant.expires_at,
  });
  if (error) {
    logServerError("guestInvite.session", error, "session_insert_failed");
    return null;
  }
  return token;
}

export type LinkResult =
  | { ok: true; reportId: string; relationshipReportId: string | null; mode: "adopted" | "merged" }
  | { ok: false; code: "error" };

/**
 * Links a guest participation to the signed-in account (caller has checked
 * the Clerk session AND the participant session -- never the token alone).
 *   - account without a profile: the guest profile becomes their profile
 *     (no re-entry); the relationship stays as it is.
 *   - account with a profile: their saved profile is kept (only empty birth
 *     data is filled from the guest entry); the relationship is made with
 *     the inviter from that profile; the temporary guest profile is removed
 *     unless the inviter already has a paid report on it (then it is kept
 *     and hidden from the inviter's map -- no paid report is ever lost).
 */
export async function linkGuestParticipation(
  supabase: SupabaseClient,
  p: GuestParticipant,
  userId: string,
): Promise<LinkResult> {
  try {
    if (!p.report_id || !p.inviter_report_id) return { ok: false, code: "error" };
    const { data: self } = await supabase
      .from("reports")
      .select("id, birth_date")
      .eq("clerk_user_id", userId)
      .eq("report_type", "self")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const now = new Date().toISOString();
    let reportId: string;
    let relationshipReportId: string | null = p.relationship_report_id;
    let mode: "adopted" | "merged";

    if (!self?.id) {
      const { error } = await supabase
        .from("reports")
        .update({ clerk_user_id: userId, report_type: "self" })
        .eq("id", p.report_id)
        .eq("report_type", "guest_invitee");
      if (error) throw error;
      reportId = p.report_id;
      mode = "adopted";
    } else {
      reportId = self.id as string;
      mode = "merged";
      if (!self.birth_date) {
        const { data: g } = await supabase
          .from("reports")
          .select("birth_date, birth_time, birth_place, birth_latitude, birth_longitude, birth_timezone")
          .eq("id", p.report_id)
          .maybeSingle();
        if (g?.birth_date) await supabase.from("reports").update(g).eq("id", reportId);
      }
      const ensured = await ensureRelationshipReport(supabase, p.inviter_report_id, reportId);
      relationshipReportId = ensured.relationshipReportId;
      const { inviterSeesInvitee } = initialMembershipsForInviteAccept();
      await supabase.from("relationship_map_memberships").upsert(
        {
          relationship_report_id: relationshipReportId,
          viewer_report_id: p.inviter_report_id,
          other_report_id: reportId,
          status: inviterSeesInvitee,
          responded_at: now,
        },
        { onConflict: "relationship_report_id,viewer_report_id" },
      );
      // Remove or hide the temporary guest profile.
      const oldRr = p.relationship_report_id;
      let hasPaid = false;
      if (oldRr) {
        const [{ data: legacy }, { data: owned }] = await Promise.all([
          supabase.from("relationship_reports").select("result_premium_by_kind").eq("id", oldRr).maybeSingle(),
          supabase.from("relationship_premium_reports").select("id").eq("relationship_report_id", oldRr).limit(1),
        ]);
        const lp = legacy?.result_premium_by_kind as Record<string, unknown> | null | undefined;
        hasPaid = Boolean((lp && Object.keys(lp).length > 0) || (owned && owned.length > 0));
      }
      if (hasPaid && oldRr) {
        await supabase
          .from("relationship_map_memberships")
          .upsert(
            {
              relationship_report_id: oldRr,
              viewer_report_id: p.inviter_report_id,
              other_report_id: p.report_id,
              status: "declined",
              responded_at: now,
            },
            { onConflict: "relationship_report_id,viewer_report_id" },
          );
      } else {
        await supabase.from("reports").delete().eq("id", p.report_id).eq("report_type", "guest_invitee");
      }
    }

    // The invitee sees the inviter on their own map.
    if (relationshipReportId) {
      const { inviteeSeesInviter } = initialMembershipsForInviteAccept();
      await supabase.from("relationship_map_memberships").upsert(
        {
          relationship_report_id: relationshipReportId,
          viewer_report_id: reportId,
          other_report_id: p.inviter_report_id,
          status: inviteeSeesInviter,
          responded_at: now,
          discovered_seen_at: now,
        },
        { onConflict: "relationship_report_id,viewer_report_id" },
      );
    }
    await supabase
      .from("invites")
      .update({ status: "complete", accepted_report_id: reportId, relationship_report_id: relationshipReportId })
      .eq("id", p.invite_id)
      .eq("status", "guest_joined");
    await supabase
      .from("guest_invite_participants")
      .update({ status: "linked", linked_clerk_user_id: userId, linked_report_id: reportId, linked_at: now })
      .eq("id", p.id);
    await supabase.from("guest_invite_sessions").update({ revoked_at: now }).eq("participant_id", p.id);
    invalidateRelationshipMapCache(p.inviter_report_id);
    invalidateRelationshipMapCache(reportId);
    return { ok: true, reportId, relationshipReportId, mode };
  } catch (e) {
    logServerError("guestInvite.link", e, "link_failed");
    return { ok: false, code: "error" };
  }
}
