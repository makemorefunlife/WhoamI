/**
 * Locale-aware relationship premium guard messages + relationshipForm catalog
 * Run: npx tsx tests/unit/relationship-guard-locale.test.mjs
 */
import assert from "node:assert/strict";
import {
  getRelationshipPremiumSaveFailedMessage,
  getRelationshipPremiumAnalysisFailedMessage,
} from "../../lib/relationship/relationshipPremiumGuard.ts";
import { getMessages } from "../../lib/i18n/messages/index.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}

section("relationship premium guard messages — locale-aware");
assert.equal(
  getRelationshipPremiumSaveFailedMessage("en-US"),
  "We couldn't save the analysis. Please try again in a moment.",
);
assert.equal(
  getRelationshipPremiumSaveFailedMessage("ko-KR"),
  "분석 결과를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
);
assert.equal(
  getRelationshipPremiumSaveFailedMessage(),
  getRelationshipPremiumSaveFailedMessage("en-US"),
  "default locale falls back to en-US",
);
assert.equal(
  getRelationshipPremiumSaveFailedMessage("bogus"),
  getRelationshipPremiumSaveFailedMessage("en-US"),
  "unknown locale falls back to en-US",
);
assert.equal(
  getRelationshipPremiumAnalysisFailedMessage("en-US"),
  "The deep relationship analysis failed. Please try again in a moment.",
);
assert.equal(
  getRelationshipPremiumAnalysisFailedMessage("ko-KR"),
  "관계 심화 분석에 실패했어요. 잠시 후 다시 시도해 주세요.",
);
console.log("  ✓ save/analysis failure messages match request locale");

section("relationshipForm catalog — en-US / ko-KR");
const en = getMessages("en-US").relationshipForm;
const ko = getMessages("ko-KR").relationshipForm;

assert.equal(en.nameRequired, "Please enter a name.");
assert.equal(ko.nameRequired, "이름을 입력해 주세요.");

assert.equal(en.birthDateRequired, "Please enter a birth date (YYYY-MM-DD).");
assert.equal(ko.birthDateRequired, "생년월일(YYYY-MM-DD)을 입력해 주세요.");

assert.match(en.birthTimeRequired, /birth time/i);
assert.match(ko.birthTimeRequired, /출생 시간/);

assert.match(en.birthPlaceRequired, /birth place/i);
assert.match(ko.birthPlaceRequired, /태어난 지역/);

assert.equal(en.fieldsRequired, "Please fill in the required fields.");
assert.equal(ko.fieldsRequired, "필수 항목을 채워 주세요.");

assert.equal(en.surveyIncomplete(3, 10), "Please complete the friend survey. (3/10)");
assert.equal(ko.surveyIncomplete(3, 10), "친구 설문을 완료해 주세요. (3/10)");

assert.equal(en.responses(3, 10), "3/10 answered");
assert.equal(ko.responses(3, 10), "3/10 응답");
console.log("  ✓ relationshipForm strings present and locale-correct");

section("errors.* — relationshipIdsRequired / personCoreLoadFailed / relationshipDataMissing");
const enErrors = getMessages("en-US").errors;
const koErrors = getMessages("ko-KR").errors;

for (const key of [
  "relationshipIdsRequired",
  "personCoreLoadFailed",
  "relationshipDataMissing",
  "invalidRequest",
  "serviceUnavailable",
  "relationshipManualFieldsRequired",
  "friendSurveyIncomplete",
  "partnerReportCreateFailed",
  "twoReportIdsRequired",
  "reportsMustDiffer",
  "birthDateCorrectionUsed",
  "inviteInvalid",
  "inviteCompleteFailed",
  "inviteUnavailable",
]) {
  assert.equal(typeof enErrors[key], "string", `en-US errors.${key} should exist`);
  assert.ok(enErrors[key].trim().length > 0, `en-US errors.${key} should not be empty`);
  assert.equal(typeof koErrors[key], "string", `ko-KR errors.${key} should exist`);
  assert.ok(koErrors[key].trim().length > 0, `ko-KR errors.${key} should not be empty`);
  assert.notEqual(
    enErrors[key],
    koErrors[key],
    `errors.${key} should differ between en-US and ko-KR`,
  );
}
console.log("  ✓ new relationship/invite/report API error keys exist, are non-empty, and differ by locale");

section("API-facing error routing — request locale drives message, not hardcoded Korean");
assert.equal(enErrors.invalidRequest, "This request is invalid.");
assert.equal(koErrors.invalidRequest, "잘못된 요청이에요.");
assert.equal(
  enErrors.serviceUnavailable,
  "This is temporarily unavailable. Please try again in a moment.",
);
assert.equal(koErrors.serviceUnavailable, "일시적으로 이용할 수 없어요. 잠시 후 다시 시도해 주세요.");
console.log("  ✓ invalidRequest/serviceUnavailable exact text verified for both locales");

console.log("\nOK: relationship guard locale tests passed");
