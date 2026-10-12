/**
 * US footer business block (2026-10-12 owner request); KR footer unchanged.
 * Run: npx tsx tests/unit/us-footer-business.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { messagesEnUS as en } from "../../lib/i18n/messages/en-US";
import { messagesKoKR as ko } from "../../lib/i18n/messages/ko-KR";

const b = en.footer.business;
assert.equal(`${b.companyLabel}: ${b.companyName} | ${b.ceoLabel}: ${b.ceoName}`, "Company: 아하잇츠미 (Aha It's me) | CEO: Sunghyun Hong");
assert.equal(`${b.bizNumberLabel}: ${b.bizNumber}`, "Business Registration: 387-06-03769");
assert.equal(`${b.addressLabel}: ${b.address}`, "Address: 5F, 18 Eonju-ro 134-gil, Gangnam-gu, Seoul, Republic of Korea");
assert.equal(`${b.supportLabel}: ${b.phone} / ${b.email}`, "Customer Support: +82-70-4571-9748 / support@ahaitsme.com");
assert.equal(ko.footer.business.supportLabel, undefined, "KR keeps separate phone / email lines");
for (const f of ["components/layout/stitch/StitchAppFooter.tsx", "components/landing/stitch/StitchLandingPage.tsx"]) {
  assert.match(readFileSync(f, "utf8"), /supportLabel \?/, f);
}
console.log("ok - US footer lines as requested; KR unchanged");
