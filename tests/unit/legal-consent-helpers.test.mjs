/**
 * Legal consent helpers — age/terms + marketing metadata.
 * Run: npx tsx tests/unit/legal-consent-helpers.test.mjs
 */
import assert from "node:assert/strict";
import {
  buildLegalConsentRecord,
  isLegalConsentComplete,
  LEGAL_CONSENT_META_KEY,
  MARKETING_CONSENT_META_KEY,
} from "../../lib/legal/consent.ts";

assert.equal(isLegalConsentComplete(null), false);
assert.equal(isLegalConsentComplete({}), false);
assert.equal(
  isLegalConsentComplete({
    [LEGAL_CONSENT_META_KEY]: { ageConfirmed: true, termsAccepted: true },
  }),
  false,
);

const ko = buildLegalConsentRecord("ko-KR");
assert.equal(ko.minAge, 14);
assert.equal(ko.ageConfirmed, true);
assert.equal(isLegalConsentComplete({ [LEGAL_CONSENT_META_KEY]: ko }), true);

const en = buildLegalConsentRecord("en-US");
assert.equal(en.minAge, 13);

assert.equal(MARKETING_CONSENT_META_KEY, "marketingConsent");

console.log("legal-consent-helpers: ok");
