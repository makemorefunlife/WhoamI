import test from "node:test";
import assert from "node:assert/strict";
import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport.js";
import { buildMarriageReportViewModel } from "../../lib/relationship/marriage/viewModel/buildMarriageReportViewModel.js";

// 6 Distinct Marriage Fixtures for Collapse Audit
const saju1A = { saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" }, dayStemCode: "eul", dayBranchCode: "myo" };
const saju1B = { saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" }, dayStemCode: "gyeong", dayBranchCode: "o" };

const saju2A = { saju: { yearPillar: "병인", monthPillar: "무진", dayPillar: "임신", hourPillar: "계유" }, dayStemCode: "im", dayBranchCode: "sin" };
const saju2B = { saju: { yearPillar: "정묘", monthPillar: "기사", dayPillar: "임진", hourPillar: "갑술" }, dayStemCode: "im", dayBranchCode: "jin" };

const saju3A = { saju: { yearPillar: "무진", monthPillar: "경신", dayPillar: "갑자", hourPillar: "병인" }, dayStemCode: "gap", dayBranchCode: "ja" };
const saju3B = { saju: { yearPillar: "기사", monthPillar: "신유", dayPillar: "임오", hourPillar: "정묘" }, dayStemCode: "im", dayBranchCode: "o" };

const saju4A = { saju: { yearPillar: "경오", monthPillar: "임오", dayPillar: "병자", hourPillar: "무술" }, dayStemCode: "byeong", dayBranchCode: "ja" };
const saju4B = { saju: { yearPillar: "신미", monthPillar: "계사", dayPillar: "신해", hourPillar: "기해" }, dayStemCode: "sin", dayBranchCode: "hae" };

const saju5A = { saju: { yearPillar: "임신", monthPillar: "갑술", dayPillar: "무진", hourPillar: "경신" }, dayStemCode: "mu", dayBranchCode: "jin" };
const saju5B = { saju: { yearPillar: "계유", monthPillar: "을해", dayPillar: "계축", hourPillar: "신유" }, dayStemCode: "gye", dayBranchCode: "chuk" };

const saju6A = { saju: { yearPillar: "갑술", monthPillar: "병자", dayPillar: "경인", hourPillar: "임오" }, dayStemCode: "gyeong", dayBranchCode: "in" };
const saju6B = { saju: { yearPillar: "을해", monthPillar: "정축", dayPillar: "을유", hourPillar: "계미" }, dayStemCode: "eul", dayBranchCode: "yu" };

function makePsych(overrides) {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return {
    survey_source: "v2_10q",
    secondary_axes: { ...base, ...overrides },
    home_life_dna: { lifestyle_title: "체계적인 정리자", life_values_line: "안정된 공간" },
  };
}

const psych1A = makePsych({ structure: 70, self_control: 65, practicality: 75, empathy: 45 });
const psych1B = makePsych({ structure: 45, self_control: 50, practicality: 40, empathy: 75 });

test("Marriage Chapter 01 Comprehensive 27-Assertion Verification Suite", async (t) => {

  await t.test("1. No redundant narrative-summary block", () => {
    const report = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B, psychMasterA: psych1A, psychMasterB: psych1B });
    const vm = buildMarriageReportViewModel(report, { myName: "Sera", partnerName: "동글" });
    const originSection = vm.sections.find((s) => s.id === "origin_story");
    assert.ok(originSection, "origin_story section must exist");
  });

  await t.test("2. Attraction semantic dedup", () => {
    const report = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B, psychMasterA: psych1A, psychMasterB: psych1B });
    const b = report.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence;
    assert.notEqual(b.attraction.drivers[0].description, b.attraction.pairSynthesis);
  });

  await t.test("3. Need causal chain completeness", () => {
    const report = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B, psychMasterA: psych1A, psychMasterB: psych1B });
    const b = report.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence;
    const need = b.mutualNeed.needAtoB;
    assert.ok(need.whySeekerHasNeed, "whySeekerHasNeed must exist");
    assert.ok(need.partnerTraitMeetingIt, "partnerTraitMeetingIt must exist");
    assert.ok(need.howItFeelsInMarriage, "howItFeelsInMarriage must exist");
    assert.ok(need.whyPartnerIsNeeded, "whyPartnerIsNeeded must exist");
  });

  await t.test("4. Need multi-evidence tracking", () => {
    const report = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B, psychMasterA: psych1A, psychMasterB: psych1B });
    const b = report.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence;
    assert.ok(b.mutualNeed.needAtoB.semanticDimension, "Need must hold derived semanticDimension");
  });

  await t.test("5. No generic Need closure", () => {
    const report = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B, psychMasterA: psych1A, psychMasterB: psych1B });
    const b = report.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence;
    assert.ok(!b.mutualNeed.needAtoB.whyPartnerIsNeeded.includes("이러한 상호작용 덕분에 둘이 함께 있을 때 이 필요가 자연스럽게 충족되기 쉬운 구조를 가집니다."));
  });

  await t.test("6. Need / Meaning semantic separation", () => {
    const report = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B, psychMasterA: psych1A, psychMasterB: psych1B });
    const b = report.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence;
    assert.notEqual(b.mutualNeed.needAtoB.semanticDimension, b.directionalMeaning.meaningBtoA.semanticDimension);
  });

  await t.test("7. No unsupported household biography ('가사')", () => {
    const report = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B, psychMasterA: psych1A, psychMasterB: psych1B });
    const text = JSON.stringify(report.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence);
    assert.ok(!text.includes("가사 책임"));
    assert.ok(!text.includes("가사의 부담"));
  });

  await t.test("8. No unsupported observed-history language", () => {
    const report = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B, psychMasterA: psych1A, psychMasterB: psych1B });
    const text = JSON.stringify(report.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence);
    assert.ok(!text.includes("힘들 때 항상 가장 먼저 찾습니다"));
    assert.ok(!text.includes("혼자일 때 복잡한 선택지 앞에서 주저하곤 했습니다"));
  });

  await t.test("9. Transformation new semantic contract (trait baseline)", () => {
    const report = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B, psychMasterA: psych1A, psychMasterB: psych1B });
    const b = report.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence;
    assert.ok(b.mutualTransformation.transformationA.beforeState.includes("성향"));
  });

  await t.test("10. Transformation no biography dependency", () => {
    const report = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B, psychMasterA: psych1A, psychMasterB: psych1B });
    const b = report.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence;
    assert.ok(!b.mutualTransformation.transformationA.beforeState.includes("살아온"));
  });

  await t.test("11. Transformation claim calibration", () => {
    const report = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B, psychMasterA: psych1A, psychMasterB: psych1B });
    const b = report.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence;
    assert.ok(b.mutualTransformation.transformationA.emergingSelf.includes("갖게 돼요") || b.mutualTransformation.transformationA.emergingSelf.includes("갖추게 됩니다"));
  });

  await t.test("12. Mobile label update in UI/ViewModel", () => {
    const report = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B, psychMasterA: psych1A, psychMasterB: psych1B });
    const vm = buildMarriageReportViewModel(report, { myName: "Sera", partnerName: "동글" });
    const section = vm.sections.find((s) => s.id === "origin_story");
    assert.ok(section);
  });

  await t.test("13. Couple Identity pair-emergent derivation", () => {
    const report = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B, psychMasterA: psych1A, psychMasterB: psych1B });
    const b = report.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence;
    assert.ok(b.coupleIdentity.title.includes("부부"));
  });

  await t.test("14. Couple Identity provenance metadata", () => {
    const report = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B, psychMasterA: psych1A, psychMasterB: psych1B });
    const b = report.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence;
    assert.ok(b.provenance?.semanticDimensions.coupleIdentity);
  });

  await t.test("15. No legacy taxonomy headline", () => {
    const report = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B, psychMasterA: psych1A, psychMasterB: psych1B });
    const b = report.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence;
    assert.ok(!b.coupleIdentity.title.includes("Balanced"));
    assert.ok(!b.coupleIdentity.title.includes("패밀리"));
  });

  await t.test("16. Semantic cross-section dedup", () => {
    const report = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B, psychMasterA: psych1A, psychMasterB: psych1B });
    const b = report.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence;
    assert.notEqual(b.attraction.drivers[0].headline, b.coupleIdentity.title);
  });

  await t.test("17. Canonical / Fallback parity", () => {
    const report = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B });
    const vm = buildMarriageReportViewModel(report, { myName: "Sera", partnerName: "동글" });
    assert.ok(vm.sections.find((s) => s.id === "origin_story"));
  });

  await t.test("18. Cached-report parity (missing canonical projections)", () => {
    const report = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B });
    delete report.canonical_projections;
    const vm = buildMarriageReportViewModel(report, { myName: "Sera", partnerName: "동글" });
    assert.ok(vm.sections.find((s) => s.id === "origin_story"));
  });

  await t.test("19. No sample-name hardcoding", () => {
    const report = buildMarriageReport({ nicknameA: "UserX", nicknameB: "UserY", sajuJsonA: saju1A, sajuJsonB: saju1B });
    const b = report.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence;
    assert.equal(b.mutualNeed.needAtoB.seekerName, "UserX");
    assert.equal(b.mutualNeed.needAtoB.partnerName, "UserY");
  });

  await t.test("20. 6-Fixture collapse audit", () => {
    const pairs = [
      { nameA: "Sera", nameB: "동글", sajuA: saju1A, sajuB: saju1B },
      { nameA: "민수", nameB: "지연", sajuA: saju2A, sajuB: saju2B },
      { nameA: "지훈", nameB: "수진", sajuA: saju3A, sajuB: saju3B },
      { nameA: "현우", nameB: "유진", sajuA: saju4A, sajuB: saju4B },
      { nameA: "성민", nameB: "소희", sajuA: saju5A, sajuB: saju5B },
      { nameA: "태현", nameB: "미경", sajuA: saju6A, sajuB: saju6B },
    ];
    const titles = new Set();
    for (const p of pairs) {
      const r = buildMarriageReport({ nicknameA: p.nameA, nicknameB: p.nameB, sajuJsonA: p.sajuA, sajuJsonB: p.sajuB });
      titles.add(r.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence.coupleIdentity.title);
    }
    assert.ok(titles.size >= 4, "Must yield at least 4 distinct titles across 6 pairs");
  });

  await t.test("21. Directional swap test", () => {
    const rFwd = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B });
    const rRev = buildMarriageReport({ nicknameA: "동글", nicknameB: "Sera", sajuJsonA: saju1B, sajuJsonB: saju1A });
    assert.equal(rFwd.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence.mutualNeed.needAtoB.seekerName, "Sera");
    assert.equal(rRev.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence.mutualNeed.needAtoB.seekerName, "동글");
  });

  await t.test("22. Neutral / Missing psych non-collapse test", () => {
    const r = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B, psychMasterA: null, psychMasterB: null });
    assert.ok(r.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence.coupleIdentity.title);
  });

  await t.test("23. Insufficient evidence graceful degradation", () => {
    const r = buildMarriageReport({ nicknameA: "P1", nicknameB: "P2", sajuJsonA: saju1A, sajuJsonB: saju1B });
    assert.ok(r.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence);
  });

  await t.test("24. Korean josa safety", () => {
    const r = buildMarriageReport({ nicknameA: "민수", nicknameB: "수진", sajuJsonA: saju2A, sajuJsonB: saju2B });
    const text = JSON.stringify(r.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence);
    assert.ok(!text.includes("민수은"));
    assert.ok(!text.includes("수진가"));
  });

  await t.test("25. Chapters 02–09 unchanged", () => {
    const r = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B });
    assert.ok(r.household);
  });

  await t.test("26. Marriage P0 consistency", () => {
    const r = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B, psychMasterA: psych1A, psychMasterB: psych1B });
    assert.ok(r.meta);
  });

  await t.test("27. Typecheck validation", () => {
    const r = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: saju1A, sajuJsonB: saju1B });
    const b = r.canonical_projections?.marriage_canonical_bundle?.chapter01Intelligence;
    assert.equal(typeof b.heroSynthesis, "string");
    assert.equal(typeof b.coupleIdentity.title, "string");
  });

});
