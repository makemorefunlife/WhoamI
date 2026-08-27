import assert from "node:assert/strict";
import { buildFriendReportEnriched } from "../../lib/relationship/enrichment/buildFriendReportEnriched";
import { buildFriendWhyYouMeUs } from "../../lib/relationship/friend/buildFriendWhyYouMeUs";
import { isStaleFriendReportBlock } from "../../lib/relationship/reportStalenessGuard";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload";

function sajuFromBirth(birthDate: string) {
  const bundle = calculateSajuBundle({ birthDate, birthTime: "12:00" });
  return toV1SajuApiPayload(bundle);
}

const seraSaju = sajuFromBirth("1993-05-15");
const donggleSaju = sajuFromBirth("1994-12-15");

const seraPsych: any = {
  schema_version: "psych_master_v1",
  version: "psych_master_v1",
  secondary_axes: { thinking_style: 68, practicality: 62, empathy: 58, structure: 60, stimulation: 50 },
};

const dongglePsych: any = {
  schema_version: "psych_master_v1",
  version: "psych_master_v1",
  secondary_axes: { empathy: 72, resilience: 65, structure: 58, thinking_style: 48, stimulation: 45 },
};

console.log("=== FRIEND VNext Chapter 1 & Chapter 2 Architecture Tests ===");

// 1. Fresh Report Generation & Version Guard
const reportAB = buildFriendReportEnriched({
  nicknameA: "Sera",
  nicknameB: "동글",
  sajuJsonA: seraSaju,
  sajuJsonB: donggleSaju,
  psychMasterA: seraPsych,
  psychMasterB: dongglePsych,
  locale: "ko-KR",
});

assert.equal(reportAB.meta?.friend_engine_version, "friend_vnext_ch1_ch8_v3_canonical");
assert.equal(isStaleFriendReportBlock(reportAB), false);

// 2. Legacy Payload Invalidation Test
const legacyReport = {
  ...reportAB,
  meta: { ...reportAB.meta, friend_engine_version: undefined },
};
assert.equal(isStaleFriendReportBlock(legacyReport), true);
console.log("ok - Structural engine versioning invalidates legacy reports lacking friend_engine_version");

// 3. Chapter 1 Attraction Producer Isolation Test
const whyAB = buildFriendWhyYouMeUs(reportAB, true, ["Sera", "동글"], "ko-KR");
assert.ok(whyAB);
assert.equal(whyAB.whyYou.from, "a");
assert.equal(whyAB.whyYou.to, "b");
assert.equal(whyAB.whyMe.from, "b");
assert.equal(whyAB.whyMe.to, "a");

// Assert ZERO Chapter 2 or Chapter 4 copy leakage into Chapter 1
const ch1Text = `${whyAB.whyYou.body} ${whyAB.whyMe.body} ${whyAB.whyUs.body}`;
assert.ok(!ch1Text.includes("파티 히어로"));
assert.ok(!ch1Text.includes("아지트 수호자"));
assert.ok(!ch1Text.includes("촛불"));
assert.ok(!ch1Text.includes("태산"));
assert.ok(!ch1Text.includes("영혼 없는 수다"));
assert.ok(!ch1Text.includes("배터리"));
assert.ok(!ch1Text.includes("현실 나침반 & 명쾌한 전략 멘토"));
console.log("ok - Chapter 1 attraction producer consumes zero Chapter 2 / Chapter 4 fields");

// 4. A/B Swap Safety Test
const reportBA = buildFriendReportEnriched({
  nicknameA: "동글",
  nicknameB: "Sera",
  sajuJsonA: donggleSaju,
  sajuJsonB: seraSaju,
  psychMasterA: dongglePsych,
  psychMasterB: seraPsych,
  locale: "ko-KR",
});

const whyBA = buildFriendWhyYouMeUs(reportBA, true, ["동글", "Sera"], "ko-KR");
assert.ok(whyBA);

// Verify directionality semantics:
// In reportAB (A=Sera, B=동글): whyYou = Sera -> 동글, whyMe = 동글 -> Sera
// In reportBA (A=동글, B=Sera): whyYou = 동글 -> Sera, whyMe = Sera -> 동글
assert.ok(whyAB.whyYou.body.includes("동글")); // Sera is drawn to 동글
assert.ok(whyAB.whyMe.body.includes("Sera"));  // 동글 is drawn to Sera
assert.ok(whyBA.whyYou.body.includes("Sera")); // 동글 is drawn to Sera
assert.ok(whyBA.whyMe.body.includes("동글")); // Sera is drawn to 동글
console.log("ok - A/B directionality swap safety verified");

// 5. English Locale Test
const whyEn = buildFriendWhyYouMeUs(reportAB, true, ["Sera", "Donggle"], "en-US");
assert.ok(whyEn);
assert.ok(!whyEn.whyYou.body.includes("은(는)"));
assert.ok(whyEn.whyYou.body.includes("Sera"));
console.log("ok - English locale attraction generation verified");

console.log("\nALL CHAPTER 1 & CHAPTER 2 ARCHITECTURE TESTS PASSED!");
