import type { MessageCatalog } from "@/lib/i18n/messages/en-US";

/**
 * Every reason string either redeem RPC (redeem_gift_personal_coupon,
 * redeem_tester_personal_code) can surface, plus the two client-side-only
 * reasons (missing_code, error) -- see app/api/redeem/route.ts. Kept as a
 * plain switch (not a lookup with a silent default) so a new reason added
 * to either RPC without a matching copy key here fails loudly in review
 * rather than silently falling back to the generic error.
 *
 * Shared by every surface that calls /api/redeem directly (the standalone
 * /redeem page, and the "Have a gift or promo code?" entry inside
 * PurchaseSelectorContent) so the localized wording for a given backend
 * reason never drifts between them.
 */
export function redeemReasonCopy(
  reason: string | null,
  copy: MessageCatalog["redeem"],
): string {
  switch (reason) {
    case "missing_code":
      return copy.errorMissingCode;
    case "not_found":
      return copy.errorNotFound;
    case "inactive":
      return copy.errorInactive;
    case "expired":
      return copy.errorExpired;
    case "exhausted":
      return copy.errorExhausted;
    case "already_redeemed":
      return copy.errorAlreadyRedeemed;
    case "already_redeemed_or_revoked":
      return copy.errorAlreadyRedeemedOrRevoked;
    case "cannot_claim_own_gift":
      return copy.errorCannotClaimOwnGift;
    default:
      return copy.errorGeneric;
  }
}
