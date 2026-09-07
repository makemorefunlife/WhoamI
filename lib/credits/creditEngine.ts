import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/locale";
import type { RelationshipKind } from "@/lib/relationship/relationshipKind";
import { isCreditEnforcementEnabled } from "@/lib/credits/creditEnforcementPolicy";

export type CreditType = "personal" | "relationship";
export type CreditGrantSource =
  | "membership"
  | "one_time_purchase"
  | "additional_purchase"
  | "promo"
  | "admin";

export type ReserveCreditResult =
  | { ok: true; reservationId: string; balanceAfter: number; enforced: boolean }
  | { ok: false; reason: "insufficient_balance" }
  | { ok: false; reason: "error" };

/**
 * Reserve one relationship credit for a single in-flight generation attempt.
 * Always writes to credit_ledger (delta -1, reason 'reservation_hold'), but
 * only actually decrements credit_accounts.balance — and only rejects on
 * insufficient balance — when isCreditEnforcementEnabled() is true. During
 * beta (enforcement off) this always succeeds and simply records what
 * would have been charged.
 *
 * `generationRequestId` must be a fresh id minted once per HTTP request
 * attempt by the caller (not derived from the generation lock's own id —
 * see relationshipPremiumGenerationLock.ts's doc comment for why) and is
 * the sole idempotency key: calling reserve twice with the same id would
 * violate credit_reservations' unique index, which is intentional — the
 * caller should mint a new id per attempt, not retry reserve itself.
 */
export async function reserveRelationshipCredit(
  supabase: SupabaseClient,
  params: {
    clerkUserId: string;
    relationshipReportId: string;
    kind: RelationshipKind;
    locale: Locale;
    generationLockId: string;
    generationRequestId: string;
  },
): Promise<ReserveCreditResult> {
  const enforced = isCreditEnforcementEnabled();
  const { data, error } = await supabase.rpc("reserve_credit", {
    p_clerk_user_id: params.clerkUserId,
    p_credit_type: "relationship" satisfies CreditType,
    p_relationship_report_id: params.relationshipReportId,
    p_kind: params.kind,
    p_locale: params.locale,
    p_generation_lock_id: params.generationLockId,
    p_generation_request_id: params.generationRequestId,
    p_enforced: enforced,
  });

  if (error) return { ok: false, reason: "error" };

  const row = (Array.isArray(data) ? data[0] : data) as
    | { reservation_id: string | null; ok: boolean; balance_after: number | null }
    | undefined;

  if (!row?.ok) return { ok: false, reason: "insufficient_balance" };

  return {
    ok: true,
    reservationId: row.reservation_id as string,
    balanceAfter: row.balance_after ?? 0,
    enforced,
  };
}

/** Idempotent — safe to call even if the reservation was already released or consumed. */
export async function consumeRelationshipCredit(
  supabase: SupabaseClient,
  generationRequestId: string,
): Promise<void> {
  await supabase.rpc("consume_credit", { p_generation_request_id: generationRequestId });
}

/**
 * Idempotent — safe to call even if the reservation was already consumed or
 * released (e.g. by a stale-lock steal cleaning up a dead request's
 * leftover reservation before this request's own finally block runs).
 */
export async function releaseRelationshipCredit(
  supabase: SupabaseClient,
  generationRequestId: string,
): Promise<void> {
  await supabase.rpc("release_credit", { p_generation_request_id: generationRequestId });
}

/**
 * Adds credits from any grant source (future Paddle/Toss webhooks, an admin
 * action, a promo code redemption, or a beta-to-paid grandfather grant) —
 * every source funnels through this one function/RPC into the same
 * credit_accounts + credit_ledger tables. Not wired to any payment provider
 * yet; this is the shared landing point for whenever that's built.
 */
export async function grantCredits(
  supabase: SupabaseClient,
  params: {
    clerkUserId: string;
    creditType: CreditType;
    amount: number;
    source: CreditGrantSource;
    referenceId?: string;
    expiresAt?: string;
  },
): Promise<{ ok: true; balanceAfter: number } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc("grant_credit", {
    p_clerk_user_id: params.clerkUserId,
    p_credit_type: params.creditType,
    p_amount: params.amount,
    p_source: params.source,
    p_reference_id: params.referenceId ?? null,
    p_expires_at: params.expiresAt ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, balanceAfter: data as number };
}

export async function getCreditBalance(
  supabase: SupabaseClient,
  clerkUserId: string,
  creditType: CreditType,
): Promise<number> {
  const { data } = await supabase
    .from("credit_accounts")
    .select("balance")
    .eq("clerk_user_id", clerkUserId)
    .eq("credit_type", creditType)
    .maybeSingle();
  return (data?.balance as number | undefined) ?? 0;
}
