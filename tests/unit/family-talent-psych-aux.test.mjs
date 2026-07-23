/**
 * Family talent — 사주 SSOT + psych 절대밴드 보조 카피 회귀.
 * Run: npx tsx tests/unit/family-talent-psych-aux.test.mjs
 */
import assert from "node:assert/strict";
import {
  applyFamilyTalentPsychAuxNotes,
  buildFamilyTalentPsychAuxNote,
  FAMILY_TALENT_PSYCH_FORBIDDEN_PHRASES,
  resolveStudyAlign,
  resolveWealthAlign,
} from "../../lib/relationship/familyParent/familyTalentAlign.ts";
import { buildFamilyTalentSection } from "../../lib/relationship/familyParent/familyTalentProfile.ts";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function assertNoForbidden(text) {
  const lower = String(text).toLowerCase();
  for (const phrase of FAMILY_TALENT_PSYCH_FORBIDDEN_PHRASES) {
    assert.ok(
      !lower.includes(phrase.toLowerCase()) && !String(text).includes(phrase),
      `forbidden phrase found: ${phrase}`,
    );
  }
}

function samplePsych(overrides = {}) {
  const secondary_axes = {
    stimulation: 50,
    self_control: 50,
    practicality: 50,
    structure: 50,
    empathy: 50,
    conflict_style: 50,
    resilience: 50,
    recognition: 50,
    energy_style: 50,
    thinking_style: 50,
    decision_style: 50,
    ...overrides,
  };
  return { secondary_axes };
}

const countsChild = {
  self: 1,
  food: 3,
  wealth: 0,
  officer: 0,
  seal: 0,
};
const countsParent = {
  self: 0,
  food: 0,
  wealth: 0,
  officer: 0,
  seal: 3,
};

const base = buildFamilyTalentSection({
  countsChild,
  countsParent,
  childNickname: "아이",
  parentNickname: "엄마",
  childIsViewer: false,
  locale: "ko-KR",
});

// ---------------------------------------------------------------------------
section("1) aux note — null · 허용 문구 · 금지어 없음 · 생성기가 금지목록 미참조");

assert.equal(buildFamilyTalentPsychAuxNote("study", null, "ko-KR"), null);
const studyHi = buildFamilyTalentPsychAuxNote("study", "confirms", "ko-KR");
const studyLo = buildFamilyTalentPsychAuxNote("study", "caution", "ko-KR");
const wealthHi = buildFamilyTalentPsychAuxNote("wealth", "confirms", "ko-KR");
const wealthLo = buildFamilyTalentPsychAuxNote("wealth", "caution", "ko-KR");
assert.ok(studyHi.includes("별도의 관찰"));
assert.ok(studyLo.includes("별도의 관찰"));
assert.ok(wealthHi.includes("보조 맥락"));
assert.ok(wealthLo.includes("보조 맥락"));
for (const t of [studyHi, studyLo, wealthHi, wealthLo]) assertNoForbidden(t);
assertNoForbidden(buildFamilyTalentPsychAuxNote("study", "confirms", "en-US"));

const alignSrc = readFileSync(
  path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../lib/relationship/familyParent/familyTalentAlign.ts",
  ),
  "utf8",
);
const auxFnBody = alignSrc.slice(
  alignSrc.indexOf("export function buildFamilyTalentPsychAuxNote"),
  alignSrc.indexOf("export function applyFamilyTalentPsychAuxNotes"),
);
assert.ok(
  !auxFnBody.includes("FAMILY_TALENT_PSYCH_FORBIDDEN_PHRASES"),
  "카피 생성기는 금지목록을 읽지 않음 (테스트 가드 전용)",
);
ok("aux phrasing + forbidden list is test-only");

// ---------------------------------------------------------------------------
section("2) mid/null → section deep equality · high는 사주 노트 접두 + 한 문장");

const mid = applyFamilyTalentPsychAuxNotes(base, {
  psychChild: samplePsych(),
  childIsViewer: false,
  locale: "ko-KR",
});
assert.deepEqual(mid, base, "mid psych → identical section");

const noPsych = applyFamilyTalentPsychAuxNotes(base, {
  psychChild: null,
  childIsViewer: false,
  locale: "ko-KR",
});
assert.deepEqual(noPsych, base, "null psych → identical section");

const studyAux = buildFamilyTalentPsychAuxNote("study", "confirms", "ko-KR");
const wealthAux = buildFamilyTalentPsychAuxNote("wealth", "confirms", "ko-KR");
const high = applyFamilyTalentPsychAuxNotes(base, {
  psychChild: samplePsych({
    thinking_style: 80,
    structure: 70,
    practicality: 75,
    self_control: 70,
  }),
  childIsViewer: false,
  locale: "ko-KR",
});
assert.equal(high.study_type, base.study_type);
assert.equal(high.wealth_vessel, base.wealth_vessel);
assert.equal(high.study_type_label, base.study_type_label);
assert.equal(high.wealth_vessel_label, base.wealth_vessel_label);
assert.equal(high.headline, base.headline);
assert.equal(high.study_type_note, `${base.study_type_note} ${studyAux}`);
assert.equal(high.wealth_vessel_note, `${base.wealth_vessel_note} ${wealthAux}`);
assert.equal(
  high.study_type_note.slice(base.study_type_note.length),
  ` ${studyAux}`,
  "사주 노트 뒤에 공백+보조 한 문장만",
);
assertNoForbidden(high.study_type_note);
assertNoForbidden(high.wealth_vessel_note);
ok("deep equality mid/null · high append-only");

// ---------------------------------------------------------------------------
section("3) psych low — enum/라벨/headline 불변 · 보조만 caution");

const low = applyFamilyTalentPsychAuxNotes(base, {
  psychChild: samplePsych({
    thinking_style: 20,
    structure: 25,
    practicality: 15,
    self_control: 30,
  }),
  childIsViewer: false,
  locale: "ko-KR",
});
assert.equal(low.study_type, base.study_type);
assert.equal(low.wealth_vessel, base.wealth_vessel);
assert.equal(low.study_type_label, base.study_type_label);
assert.equal(low.wealth_vessel_label, base.wealth_vessel_label);
assert.equal(low.headline, base.headline);
assert.equal(
  low.study_type_note,
  `${base.study_type_note} ${buildFamilyTalentPsychAuxNote("study", "caution", "ko-KR")}`,
);
assertNoForbidden(low.study_type_note);
assertNoForbidden(low.wealth_vessel_note);
ok("low psych — classification unchanged");

// ---------------------------------------------------------------------------
section("4) Track B — 자녀 psych 미혼합 (deep equal)");

const trackBBase = buildFamilyTalentSection({
  countsChild,
  countsParent,
  childNickname: "아이",
  parentNickname: "엄마",
  childIsViewer: true,
  locale: "ko-KR",
});
const trackB = applyFamilyTalentPsychAuxNotes(trackBBase, {
  psychChild: samplePsych({
    thinking_style: 80,
    structure: 70,
    practicality: 75,
    self_control: 70,
  }),
  childIsViewer: true,
  locale: "ko-KR",
});
assert.deepEqual(trackB, trackBBase);
ok("Track B deep equal");

// ---------------------------------------------------------------------------
section("5) align 절대 밴드 · 사주 enum 미참조");

assert.equal(
  resolveStudyAlign(samplePsych({ thinking_style: 80, structure: 70 })),
  "confirms",
);
assert.equal(
  resolveWealthAlign(samplePsych({ practicality: 20, self_control: 20 })),
  "caution",
);
ok("align absolute band");

// ---------------------------------------------------------------------------
section("6) builder — mid/null 동일 · high 접두 · 출력 전체 금지어 없음");

function sajuFromBirth(birthDate, birthTime = "12:00") {
  const bundle = calculateSajuBundle({ birthDate, birthTime });
  const payload = toV1SajuApiPayload(bundle);
  return {
    saju: payload.saju,
    dayStemData: payload.dayStemData,
    dayBranchData: payload.dayBranchData,
    hiddenStemsData: payload.hiddenStemsData,
    tenGods: payload.tenGods,
    twelveStageData: payload.twelveStageData,
    relations: payload.relations,
    shinsals: payload.shinsals,
  };
}

const baseParams = {
  nicknameA: "아이",
  nicknameB: "엄마",
  roles: { roleA: "child", roleB: "mother" },
  parentType: "mother",
  sajuJsonA: sajuFromBirth("2012-03-15"),
  sajuJsonB: sajuFromBirth("1985-07-20"),
  locale: "ko-KR",
};

const reportNone = buildFamilyParentReport(baseParams);
const reportMid = buildFamilyParentReport({
  ...baseParams,
  psychMasterA: samplePsych(),
});
const reportHigh = buildFamilyParentReport({
  ...baseParams,
  psychMasterA: samplePsych({
    thinking_style: 80,
    structure: 70,
    practicality: 75,
    self_control: 70,
  }),
});
const reportLow = buildFamilyParentReport({
  ...baseParams,
  psychMasterA: samplePsych({
    thinking_style: 20,
    structure: 25,
    practicality: 15,
    self_control: 30,
  }),
});

assert.deepEqual(
  reportMid.family.section_talent,
  reportNone.family.section_talent,
  "builder mid ≡ no psych",
);
assert.equal(
  reportHigh.family.section_talent.study_type,
  reportNone.family.section_talent.study_type,
);
assert.equal(
  reportHigh.family.section_talent.study_type_label,
  reportNone.family.section_talent.study_type_label,
);
assert.ok(
  reportHigh.family.section_talent.study_type_note.startsWith(
    reportNone.family.section_talent.study_type_note,
  ),
);
assert.equal(
  reportLow.family.section_talent.study_type,
  reportNone.family.section_talent.study_type,
);
assert.equal(
  reportLow.family.section_talent.wealth_vessel_label,
  reportNone.family.section_talent.wealth_vessel_label,
);

const blob = JSON.stringify({
  talent: reportHigh.family.section_talent,
  talentLow: reportLow.family.section_talent,
  co: reportHigh.context_output?.dominant_categories,
});
assertNoForbidden(blob);
assert.equal(
  reportHigh.context_output.dominant_categories.study_align.category,
  "confirms",
);
assert.ok(
  !("study_confidence" in reportHigh.context_output.dominant_categories),
);
ok("builder invariants + no forbidden in output blob");

console.log("\nOK: family talent psych aux tests passed");
