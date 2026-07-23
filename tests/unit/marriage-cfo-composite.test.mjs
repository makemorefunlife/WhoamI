/**
 * Phase 5-2 — Marriage CFO composite (refineHouseholdCfo).
 * Run: npx tsx tests/unit/marriage-cfo-composite.test.mjs
 */
import assert from "node:assert/strict";
import {
  refineHouseholdCfo,
  resolveCfoAxisNote,
} from "../../lib/relationship/marriage/marriageCfoConsumption.ts";
import {
  pickHouseholdCfo,
  resolveCfoAffinityScore,
} from "../../lib/relationship/marriage/marriageTenGodAnalysis.ts";
import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport.ts";
import { buildMarriageReportViewModel } from "../../lib/relationship/marriage/viewModel/buildMarriageReportViewModel.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { COHABITATION_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/cohabitation/outputSchema.ts";
import { stripMarriageContextOutputForClient } from "../../lib/relationship/marriage/stripMarriageContextOutputForClient.ts";
import { buildCohabitationPrescriptions } from "../../lib/relationship/marriage/buildCohabitationPrescriptions.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function emptyCounts() {
  return {};
}

function countsWealthHeavy() {
  return { 정재: 2, 편관: 2, 정관: 1 };
}

function countsLight() {
  return { 식신: 2, 비견: 1 };
}

function samplePsych(overrides = {}) {
  const keys = [
    "stimulation",
    "self_control",
    "practicality",
    "structure",
    "empathy",
    "conflict_style",
    "resilience",
    "recognition",
    "energy_style",
    "thinking_style",
    "decision_style",
  ];
  const secondary_axes = Object.fromEntries(keys.map((k) => [k, 50]));
  Object.assign(secondary_axes, overrides);
  return {
    schema_version: "psych_master_v1",
    secondary_axes,
    survey_source: "v2_10q",
    survey_completed_at: null,
    survey_input_fingerprint: null,
    home_life_dna: {
      lifestyle_title: "t",
      family_identity_category: "balanced",
      family_identity_line: "l",
      life_values_line: "v",
      private_home_self_line: "p",
      energy_battery_line: "e",
    },
  };
}

function power(score, band = "medium", dual = false) {
  return {
    wealth_count: 2,
    officer_count: 2,
    wealth_officer_total: 4,
    cfo_affinity_score: score,
    dual_power_risk: dual,
    economic_dominance_band: band,
  };
}

const emptyBranches = new Set();

const basePick = pickHouseholdCfo(
  "Alex",
  "Jordan",
  countsWealthHeavy(),
  countsLight(),
  emptyBranches,
  emptyBranches,
  "ko-KR",
  power(70, "high"),
  power(40, "low"),
);

// ---------------------------------------------------------------------------
section("1) psych 누락 → legacy base");

const legacy = refineHouseholdCfo({
  baseNickname: basePick.nickname,
  baseReason: basePick.reason,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: countsWealthHeavy(),
  countsB: countsLight(),
  branchCodesA: emptyBranches,
  branchCodesB: emptyBranches,
  wealthOfficerPowerA: power(70, "high"),
  wealthOfficerPowerB: power(40, "low"),
  psychA: null,
  psychB: null,
  locale: "ko-KR",
});
assert.equal(legacy.nickname, basePick.nickname);
assert.equal(legacy.reason, basePick.reason);
assert.equal(legacy.confidence, undefined);
assert.equal(legacy.align, undefined);
assert.equal(basePick.nickname, "Alex");
ok("legacy fallback");

// ---------------------------------------------------------------------------
section("2) psych 동의 → pick 유지 · high/confirms");

const confirms = refineHouseholdCfo({
  baseNickname: basePick.nickname,
  baseReason: basePick.reason,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: countsWealthHeavy(),
  countsB: countsLight(),
  branchCodesA: emptyBranches,
  branchCodesB: emptyBranches,
  wealthOfficerPowerA: power(70, "high"),
  wealthOfficerPowerB: power(40, "low"),
  psychA: samplePsych({ practicality: 85, self_control: 80 }),
  psychB: samplePsych({ practicality: 30, self_control: 35 }),
  locale: "ko-KR",
});
assert.equal(confirms.nickname, "Alex");
assert.equal(confirms.confidence, "high");
assert.equal(confirms.align, "confirms");
assert.equal(confirms.reason, basePick.reason);
ok("high confirms");

// ---------------------------------------------------------------------------
section("3) 약한 saju + 강한 psych 반대 → pick 변경");

const weakBase = pickHouseholdCfo(
  "Alex",
  "Jordan",
  emptyCounts(),
  emptyCounts(),
  emptyBranches,
  emptyBranches,
  "ko-KR",
  power(45, "medium"),
  power(40, "medium"),
);
assert.ok(Math.abs(45 - 40) < 12, "saju unlocked");

const flipParams = {
  baseNickname: weakBase.nickname,
  baseReason: weakBase.reason,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: emptyCounts(),
  countsB: emptyCounts(),
  branchCodesA: emptyBranches,
  branchCodesB: emptyBranches,
  wealthOfficerPowerA: power(45, "medium"),
  wealthOfficerPowerB: power(40, "medium"),
  // base is Alex (45>=40); psych strongly favors Jordan
  psychA: samplePsych({ practicality: 15, self_control: 20 }),
  psychB: samplePsych({ practicality: 90, self_control: 88 }),
  locale: "ko-KR",
};

const flipped = refineHouseholdCfo(flipParams);
assert.equal(flipped.nickname, "Jordan");
assert.equal(flipped.confidence, "high");
assert.equal(flipped.align, "caution");
assert.ok(
  flipped.reason.includes("굳히지") ||
    flipped.reason.includes("flexible") ||
    flipped.reason.includes("Survey axes"),
);
ok("weak saju flip");

// ---------------------------------------------------------------------------
section("3b) home/chores risk is not CFO SSOT (former choresPenalty)");

// Dead args (pre-removal API) must be ignored if passed — proves pair home
// risk is not part of CFO refine SSOT. Audit: risk 40 vs 55 were identical.
const flippedRisk40 = refineHouseholdCfo({
  ...flipParams,
  masterBenefit: 50,
  masterRisk: 40,
});
const flippedRisk55 = refineHouseholdCfo({
  ...flipParams,
  masterBenefit: 50,
  masterRisk: 55,
});
assert.equal(flippedRisk40.nickname, flippedRisk55.nickname);
assert.equal(flippedRisk40.confidence, flippedRisk55.confidence);
assert.equal(flippedRisk40.align, flippedRisk55.align);
assert.equal(flippedRisk40.dual, flippedRisk55.dual);
assert.equal(flippedRisk40.reason, flippedRisk55.reason);
assert.equal(flippedRisk40.nickname, flipped.nickname);
assert.equal(flippedRisk40.confidence, flipped.confidence);
assert.equal(flippedRisk40.align, flipped.align);
assert.equal(flippedRisk40.dual, flipped.dual);
assert.equal(flippedRisk40.reason, flipped.reason);
assert.equal(flipped.nickname, "Jordan");
assert.equal(flipped.confidence, "high");
assert.equal(flipped.align, "caution");
assert.equal(flipped.dual, undefined);
ok("risk 40/55 ignored — identical refine outcome");

// ---------------------------------------------------------------------------
section("4) 강한 saju lock → psych 반대해도 pick 유지");

const locked = refineHouseholdCfo({
  baseNickname: basePick.nickname,
  baseReason: basePick.reason,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: countsWealthHeavy(),
  countsB: countsLight(),
  branchCodesA: emptyBranches,
  branchCodesB: emptyBranches,
  wealthOfficerPowerA: power(70, "high"),
  wealthOfficerPowerB: power(40, "low"),
  psychA: samplePsych({ practicality: 15, self_control: 20 }),
  psychB: samplePsych({ practicality: 90, self_control: 88 }),
  locale: "ko-KR",
});
assert.equal(locked.nickname, "Alex");
assert.equal(locked.confidence, "low");
assert.equal(locked.align, "caution");
ok("saju lock");

// ---------------------------------------------------------------------------
section("5) dual → pick 유지 · dual 플래그");

const dual = refineHouseholdCfo({
  baseNickname: basePick.nickname,
  baseReason: basePick.reason,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: countsWealthHeavy(),
  countsB: countsWealthHeavy(),
  branchCodesA: emptyBranches,
  branchCodesB: emptyBranches,
  wealthOfficerPowerA: power(65, "high", true),
  wealthOfficerPowerB: power(62, "high", true),
  psychA: samplePsych({ practicality: 80, self_control: 75 }),
  psychB: samplePsych({ practicality: 78, self_control: 70 }),
  dualCfoWar: true,
  locale: "ko-KR",
});
assert.equal(dual.nickname, basePick.nickname);
assert.equal(dual.dual, true);
assert.equal(dual.confidence, "low");
assert.equal(dual.align, "caution");
ok("dual keeps base");

// ---------------------------------------------------------------------------
section("6) builder + Context Output · UI 회귀");

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
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuFromBirth("1990-05-15"),
  sajuJsonB: sajuFromBirth("1992-08-20"),
  locale: "ko-KR",
  cohabitationSignalsA: {
    day_palace: {
      branch_code: "o",
      harmony_hits: [],
      tension_hits: [],
      harmony_index: 0,
      tension_index: 0,
    },
    hidden_stem_intimacy: {
      day_stem_rooted_in_spouse_palace: false,
      stem_combine_links: [],
      intimacy_index: 0,
    },
    wealth_officer_power: power(70, "high"),
  },
  cohabitationSignalsB: {
    day_palace: {
      branch_code: "o",
      harmony_hits: [],
      tension_hits: [],
      harmony_index: 0,
      tension_index: 0,
    },
    hidden_stem_intimacy: {
      day_stem_rooted_in_spouse_palace: false,
      stem_combine_links: [],
      intimacy_index: 0,
    },
    wealth_officer_power: power(40, "low"),
  },
};

const noPsych = buildMarriageReport(baseParams);
const withPsych = buildMarriageReport({
  ...baseParams,
  psychMasterA: samplePsych({ practicality: 85, self_control: 80 }),
  psychMasterB: samplePsych({ practicality: 30, self_control: 35 }),
});

assert.equal(noPsych.household.section_money_chores.cfo_confidence, undefined);
assert.equal(
  noPsych.context_output.dominant_categories.cfo_confidence,
  undefined,
);
assert.ok(noPsych.household.section_money_chores.cfo_nickname);

assert.ok(withPsych.household.section_money_chores.cfo_confidence);
assert.ok(withPsych.household.section_money_chores.cfo_align);
assert.equal(
  withPsych.context_output.dominant_categories.household_cfo.category,
  withPsych.household.section_money_chores.cfo_nickname === "Alex" ? "a" : "b",
);
assert.equal(
  withPsych.context_output.dominant_categories.cfo_confidence.category,
  withPsych.household.section_money_chores.cfo_confidence,
);
assert.equal(
  withPsych.context_output.dominant_categories.cfo_align.category,
  withPsych.household.section_money_chores.cfo_align,
);
assert.equal(
  withPsych.context_output.scores.activation,
  noPsych.context_output.scores.activation,
);

const note = resolveCfoAxisNote(
  withPsych.meta.psych_match,
  withPsych.household.section_money_chores.cfo_nickname === "Alex",
  "ko-KR",
);
assert.equal(
  withPsych.household.section_money_chores.cfo_axis_note,
  note,
);

const vm = buildMarriageReportViewModel(withPsych, {
  locale: "ko-KR",
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
});
assert.ok(vm);
assert.ok(Array.isArray(vm.sections));

const stripped = stripMarriageContextOutputForClient({
  format: COHABITATION_DEEP_FORMAT,
  report: withPsych,
});
assert.equal(stripped.report.context_output, undefined);
assert.ok(withPsych.context_output.dominant_categories.cfo_align);

assert.equal(
  resolveCfoAffinityScore(countsWealthHeavy(), emptyBranches, power(70)),
  70,
);
ok("builder CO + VM + strip");

// ---------------------------------------------------------------------------
section("7) canonical final CFO — snapshot/killer consumer 통일");

function palace() {
  return {
    branch_code: "o",
    harmony_hits: [],
    tension_hits: [],
    harmony_index: 0,
    tension_index: 0,
  };
}
function intimacy() {
  return {
    day_stem_rooted_in_spouse_palace: false,
    stem_combine_links: [],
    intimacy_index: 0,
  };
}
function reportParams(wealthA, wealthB, psychA, psychB, extra = {}) {
  return {
    nicknameA: "Alex",
    nicknameB: "Jordan",
    sajuJsonA: sajuFromBirth("1990-05-15"),
    sajuJsonB: sajuFromBirth("1992-08-20"),
    locale: "ko-KR",
    cohabitationSignalsA: {
      day_palace: palace(),
      hidden_stem_intimacy: intimacy(),
      wealth_officer_power: wealthA,
    },
    cohabitationSignalsB: {
      day_palace: palace(),
      hidden_stem_intimacy: intimacy(),
      wealth_officer_power: wealthB,
    },
    ...(psychA ? { psychMasterA: psychA } : {}),
    ...(psychB ? { psychMasterB: psychB } : {}),
    ...extra,
  };
}

function stabilityInterp(report) {
  const topics =
    report.snapshot_panel?.narrative?.topics ??
    report.snapshot_panel?.topics ??
    [];
  const row = topics.find((t) => t.topic === "stability");
  assert.ok(row?.interpretation, "stability interpretation present");
  return row.interpretation;
}

function economicKillerNarrative(report) {
  const q = (report.meta?.killer_questions?.questions ?? []).find(
    (item) => item.topic === "economic_dominance",
  );
  assert.ok(q?.narrative, "economic_dominance killer present");
  return q.narrative;
}

function assertConsumersShareCfo(report, expectedNick, expectedAb) {
  const money = report.household.section_money_chores.cfo_nickname;
  assert.equal(money, expectedNick);
  assert.equal(
    report.context_output.dominant_categories.household_cfo.category,
    expectedAb,
  );
  const snap = stabilityInterp(report);
  const killer = economicKillerNarrative(report);
  assert.ok(snap.includes(expectedNick), `snapshot names ${expectedNick}`);
  assert.ok(killer.includes(expectedNick), `killer names ${expectedNick}`);
  const other = expectedNick === "Alex" ? "Jordan" : "Alex";
  // CFO-related lines must not name the other person as the CFO holder
  assert.equal(
    snap.includes(other),
    false,
    `snapshot must not name other CFO ${other}: ${snap}`,
  );
  assert.equal(
    killer.includes(other),
    false,
    `killer must not name other CFO ${other}: ${killer}`,
  );
  assert.equal(/명리상|사주 CFO|chart favors|In your chart, \w+ is favored/i.test(snap), false);
  assert.equal(/명리상|사주 CFO|Your chart favors/i.test(killer), false);
}

// Case 1 — weak saju flip: base Alex → refined Jordan
const flipReport = buildMarriageReport(
  reportParams(
    power(45, "medium"),
    power(40, "medium"),
    samplePsych({ practicality: 15, self_control: 20 }),
    samplePsych({ practicality: 90, self_control: 88 }),
  ),
);
assert.equal(weakBase.nickname, "Alex");
assert.equal(flipReport.household.section_money_chores.cfo_nickname, "Jordan");
assertConsumersShareCfo(flipReport, "Jordan", "b");
ok("case1 weak flip money/snapshot/killer/CO = Jordan");

// Case 2 — no psych → refined = base; consumers align
const noPsychWeak = buildMarriageReport(
  reportParams(power(45, "medium"), power(40, "medium")),
);
assert.equal(noPsychWeak.household.section_money_chores.cfo_confidence, undefined);
assertConsumersShareCfo(
  noPsychWeak,
  noPsychWeak.household.section_money_chores.cfo_nickname,
  noPsychWeak.household.section_money_chores.cfo_nickname === "Alex" ? "a" : "b",
);
assert.equal(noPsychWeak.household.section_money_chores.cfo_nickname, "Alex");
ok("case2 no psych fallback consumers share base Alex");

// Case 3 — strong saju lock keeps Alex across consumers
const lockedReport = buildMarriageReport(
  reportParams(
    power(70, "high"),
    power(40, "low"),
    samplePsych({ practicality: 15, self_control: 20 }),
    samplePsych({ practicality: 90, self_control: 88 }),
  ),
);
assert.equal(lockedReport.household.section_money_chores.cfo_nickname, "Alex");
assertConsumersShareCfo(lockedReport, "Alex", "a");
ok("case3 saju lock consumers share Alex");

// Case 4 — dual keeps base nickname; all consumers match
const dualReport = buildMarriageReport(
  reportParams(
    power(65, "high", true),
    power(62, "high", true),
    samplePsych({ practicality: 80, self_control: 75 }),
    samplePsych({ practicality: 78, self_control: 70 }),
  ),
);
assert.equal(dualReport.household.section_money_chores.cfo_dual, true);
const dualNick = dualReport.household.section_money_chores.cfo_nickname;
assertConsumersShareCfo(
  dualReport,
  dualNick,
  dualNick === "Alex" ? "a" : "b",
);
ok("case4 dual consumers share same nickname");

// Case 5 — client strip shape unchanged
const strippedFlip = stripMarriageContextOutputForClient({
  format: COHABITATION_DEEP_FORMAT,
  report: flipReport,
});
assert.equal(strippedFlip.report.context_output, undefined);
assert.ok(flipReport.context_output.dominant_categories.household_cfo);
assert.equal(
  strippedFlip.report.household.section_money_chores.cfo_nickname,
  "Jordan",
);
ok("case5 strip removes CO only");

// ---------------------------------------------------------------------------
section("8) operating CFO ≠ pair leader_side (independent contracts)");

const pairStruggleAlex = {
  secret_affinity: {
    present: false,
    links: [],
    affinity_index: 0,
  },
  cfo_power_struggle: {
    dual_cfo_war: false,
    struggle_score: 72,
    struggle_band: "high",
    // pair-affinity struggle driver — must NOT be forced to match operating CFO
    leader_side: "a",
    a_cfo_affinity: 70,
    b_cfo_affinity: 40,
  },
  day_palace_cross: {
    branch_a: "o",
    branch_b: "o",
    cross_relation_type: null,
    cross_tension_index: 20,
  },
};

const independentReport = buildMarriageReport(
  reportParams(
    power(45, "medium"),
    power(40, "medium"),
    samplePsych({ practicality: 15, self_control: 20 }),
    samplePsych({ practicality: 90, self_control: 88 }),
    { pairCohabitation: pairStruggleAlex },
  ),
);

assert.equal(
  independentReport.household.section_money_chores.cfo_nickname,
  "Jordan",
  "operating CFO can be Jordan after psych flip",
);
assert.equal(
  independentReport.meta.prescription_cohabitation?.items?.some(
    (i) => i.topic === "cfo_power_struggle",
  ),
  true,
);
const struggleItem =
  independentReport.meta.prescription_cohabitation.items.find(
    (i) => i.topic === "cfo_power_struggle",
  );
assert.equal(struggleItem.evidence.snapshot.leader_side, "a");
assertConsumersShareCfo(independentReport, "Jordan", "b");

const packKo = buildCohabitationPrescriptions({
  pair: pairStruggleAlex,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  locale: "ko-KR",
});
const packEn = buildCohabitationPrescriptions({
  pair: pairStruggleAlex,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  locale: "en-US",
});
const cfoItemKo = packKo.items.find((i) => i.topic === "cfo_power_struggle");
const cfoItemEn = packEn.items.find((i) => i.topic === "cfo_power_struggle");
assert.ok(cfoItemKo && cfoItemEn);

function assertNoOperatingCfoAssign(blob, locale) {
  const banned =
    locale === "ko-KR"
      ? [/통장\s*담당/, /최종\s*CFO/, /큰\s*지출\s*담당/, /통장·큰\s*지출은/, /CFO를\s*맡/]
      : [
          /bank account and big (spending|expenses)/i,
          /final CFO/i,
          /should hold the bank/i,
          /designated (the )?household CFO/i,
          /make the final call on the bank/i,
        ];
  for (const re of banned) {
    assert.equal(
      re.test(blob),
      false,
      `${locale} prescription must not assign operating CFO: ${re} in ${blob.slice(0, 120)}`,
    );
  }
}

assertNoOperatingCfoAssign(
  [cfoItemKo.headline, cfoItemKo.evidence.summary, ...cfoItemKo.do_list, ...cfoItemKo.dont_list].join(
    "\n",
  ),
  "ko-KR",
);
assertNoOperatingCfoAssign(
  [cfoItemEn.headline, cfoItemEn.evidence.summary, ...cfoItemEn.do_list, ...cfoItemEn.dont_list].join(
    "\n",
  ),
  "en-US",
);
ok("operating CFO Jordan ≠ leader_side a; prescription is struggle-only");

console.log("\nAll marriage-cfo-composite tests passed.");
