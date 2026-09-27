import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { logServerError } from "@/lib/security/safeLog";
import {
  redeemGiftPersonalCoupon,
  redeemTesterPersonalCode,
  type RedeemGiftCouponReason,
  type RedeemTesterCodeResult,
} from "@/lib/credits/creditEngine";
import {
  enforceRateLimit,
  rateLimitResponse,
} from "@/lib/security/rateLimit";
import {
  readJsonBodyLimited,
  parseBoundedString,
} from "@/lib/security/requestValidation";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";

export const runtime = "nodejs";

const MAX_CODE_LEN = 40;

/**
 * A single redeem-code reason vocabulary the client can key its copy off
 * of, unifying the Annual-gift RPC's reasons and the tester-code RPC's
 * reasons (they are deliberately disjoint except for "not_found"/"expired"/
 * "error", so no collision loses information).
 */
type RedeemReason =
  | RedeemGiftCouponReason
  | Extract<RedeemTesterCodeResult, { ok: false }>["reason"];

/**
 * POST { code: string } -- redeem an Annual-gift or tester/beta Personal
 * code for the CALLER (Clerk-authenticated). Server-authoritative: the
 * client never decides whether a code is valid, only which reason string
 * to show. Both underlying paths (redeem_gift_personal_coupon,
 * redeem_tester_personal_code) are atomic, race-safe Postgres functions --
 * see supabase/migrations/20260928000000_redeem_code_system.sql -- so a
 * duplicate/concurrent/retried request here can never double-grant.
 *
 * Dispatch is by code prefix (GIFT- vs TEST-, case-insensitive) rather
 * than "try one, fall back to the other" -- the two code spaces are
 * disjoint by construction (see the migration + scripts/create-tester-code.ts),
 * so prefix dispatch avoids ever surfacing an Annual-gift-flavored error
 * (e.g. "cannot_claim_own_gift") for what is actually a mistyped tester
 * code, and vice versa. An unrecognized prefix is reported as not_found
 * without touching either RPC.
 */
export async function POST(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage:
      req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: messages.errors.unauthorized }, { status: 401 });
    }

    const limited = await enforceRateLimit("redeem_code", userId);
    if (!limited.ok) return rateLimitResponse(limited);

    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const body = (parsed.body ?? {}) as Record<string, unknown>;

    const codeCheck = parseBoundedString(body.code, MAX_CODE_LEN, "code", {
      required: true,
    });
    if (!codeCheck.ok) {
      return NextResponse.json(
        { ok: false, reason: "missing_code" },
        { status: 400 },
      );
    }

    // Normalize the same way both RPCs' unique indexes expect: trimmed,
    // uppercased. Codes are generated uppercase (GIFT-.../TEST-...); this
    // just tolerates a pasted/typed lowercase variant.
    const code = codeCheck.value.toUpperCase();

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const isTesterCode = code.startsWith("TEST-");
    const isGiftCode = code.startsWith("GIFT-");

    if (!isTesterCode && !isGiftCode) {
      return NextResponse.json(
        { ok: false, reason: "not_found" satisfies RedeemReason },
        { status: 404 },
      );
    }

    if (isTesterCode) {
      const result = await redeemTesterPersonalCode(supabase, {
        code,
        redeemedByClerkUserId: userId,
      });
      if (!result.ok) {
        return NextResponse.json(
          { ok: false, reason: result.reason satisfies RedeemReason },
          { status: reasonStatus(result.reason) },
        );
      }
      return NextResponse.json({ ok: true, kind: "tester", entitlement: "personal" });
    }

    const result = await redeemGiftPersonalCoupon(supabase, {
      code,
      redeemedByClerkUserId: userId,
    });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, reason: result.reason satisfies RedeemReason },
        { status: reasonStatus(result.reason) },
      );
    }
    return NextResponse.json({ ok: true, kind: "gift", entitlement: "personal" });
  } catch (error) {
    logServerError("redeem.post", error, "query_failed");
    return NextResponse.json({ ok: false, reason: "error" }, { status: 500 });
  }
}

function reasonStatus(reason: RedeemReason): number {
  switch (reason) {
    case "not_found":
      return 404;
    case "cannot_claim_own_gift":
      return 403;
    case "already_redeemed_or_revoked":
    case "already_redeemed":
    case "expired":
    case "inactive":
    case "exhausted":
      return 409;
    default:
      return 500;
  }
}
