/**
 * Family household roles — existing Part2 signals only, no new calc.
 * Run: npx tsx tests/unit/family-household-roles.test.mjs
 */
import assert from "node:assert/strict";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import { buildFamilyHouseholdRoles } from "../../lib/relationship/familyParent/buildFamilyHouseholdRoles.ts";
import { buildFamilyReportViewModel } from "../../lib/relationship/familyParent/viewModel/buildFamilyReportViewModel.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { messagesEnUS } from "../../lib/i18n/messages/en-US.ts";
import { messagesKoKR } from "../../lib/i18n/messages/ko-KR.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

function sajuFromBirth(birthDate) {
  const bundle = calculateSajuBundle({ birthDate, birthTime: "12:00" });
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

const sajuChild = sajuFromBirth("2014-05-15");
const sajuParent = sajuFromBirth("1988-08-20");

const NEUTRAL_LABELS_KO = ["정서 감수형", "맥락 설명형", "기준 설정형", "유연 조율형"];
const LEGACY_DUTY_LABELS = /돌봄·수용 담당|설명·맥락 담당|기준·구조 담당|채널 조율 담당|Care & acceptance lead/;

function buildReport(overrides = {}) {
  return buildFamilyParentReport({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    roles: { roleA: "child", roleB: "mother" },
    parentType: "mother",
    sajuJsonA: sajuChild,
    sajuJsonB: sajuParent,
    locale: "ko-KR",
    ...overrides,
  });
}

console.log("\n=== section present + required fields ===");
{
  const report = buildReport();
  const roles = report.family.section_household_roles;
  assert.ok(roles);
  assert.equal(roles.self_name, "Jordan");
  assert.equal(roles.partner_name, "Alex");
  assert.ok(roles.self_role_label);
  assert.ok(roles.partner_role_label);
  assert.ok(roles.self_role_detail);
  assert.ok(roles.partner_role_detail);
  assert.ok(roles.complement);
  assert.ok(roles.tension);
  ok("household roles section fields present");
}

console.log("\n=== ViewModel Part2 order: compare → household_roles ===");
{
  const report = buildReport();
  const vm = buildFamilyReportViewModel(report, { locale: "ko-KR" });
  const ids = vm.sections.filter((s) => s.partNumber === 2).map((s) => s.type);
  const compareIdx = ids.indexOf("compare_table");
  const rolesIdx = ids.indexOf("household_roles");
  assert.ok(compareIdx >= 0);
  assert.ok(rolesIdx > compareIdx);
  const section = vm.sections.find((s) => s.type === "household_roles");
  assert.equal(section.partNumber, 2);
  assert.equal(section.title, messagesKoKR.relationshipDrilldown.family.householdRolesCardTitle);
  ok("roles card sits in Part2 after compare table");
}

console.log("\n=== locale isolation ===");
{
  const ko = buildReport({ locale: "ko-KR" });
  const en = buildReport({ locale: "en-US" });
  assert.ok(/[가-힣]/.test(ko.family.section_household_roles.self_role_label));
  assert.ok(!/[가-힣]/.test(en.family.section_household_roles.self_role_label));
  assert.ok(!/[가-힣]/.test(en.family.section_household_roles.complement));
  assert.ok(!/[가-힣]/.test(en.family.section_household_roles.tension));
  assert.ok(
    messagesEnUS.relationshipDrilldown.family.householdRolesCardTitle.includes("roles"),
  );
  ok("ko Hangul / en Hangul-free + catalog titles");
}

console.log("\n=== no lens / legacy duty labels / contrast detail ===");
{
  const report = buildReport();
  const roles = report.family.section_household_roles;
  const blob = JSON.stringify(roles);
  assert.ok(!/렌즈|lens/i.test(blob));
  assert.ok(!LEGACY_DUTY_LABELS.test(blob));
  assert.ok(NEUTRAL_LABELS_KO.includes(roles.self_role_label));
  assert.ok(NEUTRAL_LABELS_KO.includes(roles.partner_role_label));
  assert.ok(!/교정 장면|관계 거리/.test(roles.self_role_detail));
  assert.ok(!/교정 장면|관계 거리/.test(roles.partner_role_detail));
  assert.ok(roles.self_role_detail.includes("Jordan"));
  assert.ok(roles.partner_role_detail.includes("Alex"));
  assert.notEqual(roles.self_role_detail, roles.partner_role_detail);
  assert.ok(roles.complement.includes("Jordan") && roles.complement.includes("Alex"));
  assert.ok(roles.tension.includes("Jordan") && roles.tension.includes("Alex"));
  ok("neutral labels + named contrast (나≠상대)");
}

console.log("\n=== determinism + complement matches mode pair with names ===");
{
  // receptive (정인) × standards (편관) → Jordan 마음 / Alex 틀
  const a = buildFamilyHouseholdRoles({
    parentNickname: "Jordan",
    childNickname: "Alex",
    countsParent: { 정인: 2, 식신: 1 },
    countsChild: { 편관: 2, 비견: 1 },
    locale: "ko-KR",
  });
  const b = buildFamilyHouseholdRoles({
    parentNickname: "Jordan",
    childNickname: "Alex",
    countsParent: { 정인: 2, 식신: 1 },
    countsChild: { 편관: 2, 비견: 1 },
    locale: "ko-KR",
  });
  assert.deepEqual(a, b);
  assert.equal(a.self_role_label, "정서 감수형");
  assert.equal(a.partner_role_label, "기준 설정형");
  assert.notEqual(a.self_role_detail, a.partner_role_detail);
  assert.ok(a.self_role_detail.includes("Jordan") && a.self_role_detail.includes("Alex"));
  assert.ok(a.partner_role_detail.includes("Alex") && a.partner_role_detail.includes("Jordan"));
  assert.ok(a.complement.includes("Jordan") && a.complement.includes("Alex"));
  assert.ok(a.complement.includes("마음을 받아"));
  assert.ok(a.complement.includes("틀을 잡아"));
  assert.ok(a.tension.includes("마음을 먼저") && a.tension.includes("기준부터"));

  // receptive × explanatory
  const rx = buildFamilyHouseholdRoles({
    parentNickname: "Jordan",
    childNickname: "Alex",
    countsParent: { 정인: 3 },
    countsChild: { 식신: 3 },
    locale: "ko-KR",
  });
  assert.equal(rx.self_role_label, "정서 감수형");
  assert.equal(rx.partner_role_label, "맥락 설명형");
  assert.notEqual(rx.self_role_detail, rx.partner_role_detail);
  assert.ok(rx.complement.includes("마음을 받아"));
  assert.ok(rx.complement.includes("이유를 풀어"));
  assert.ok(!rx.complement.includes("틀을 잡아"));

  // explanatory × standards
  const xs = buildFamilyHouseholdRoles({
    parentNickname: "Jordan",
    childNickname: "Alex",
    countsParent: { 식신: 3 },
    countsChild: { 편관: 3 },
    locale: "ko-KR",
  });
  assert.equal(xs.self_role_label, "맥락 설명형");
  assert.equal(xs.partner_role_label, "기준 설정형");
  assert.ok(xs.complement.includes("이유를 풀어"));
  assert.ok(xs.complement.includes("틀을 잡아"));
  assert.ok(!xs.complement.includes("마음을 받아"));

  const en = buildFamilyHouseholdRoles({
    parentNickname: "Jordan",
    childNickname: "Alex",
    countsParent: { 정인: 2, 식신: 1 },
    countsChild: { 편관: 2, 비견: 1 },
    locale: "en-US",
  });
  assert.equal(en.self_role_label, "Feeling-attuned");
  assert.equal(en.partner_role_label, "Frame-setter");
  assert.notEqual(en.self_role_detail, en.partner_role_detail);
  assert.ok(en.complement.includes("Jordan") && en.complement.includes("Alex"));
  assert.ok(en.complement.includes("receives the feeling"));
  assert.ok(en.complement.includes("holds the frame"));

  ok("deterministic + named complement matches guidance pair");
}

console.log("\n=== Part2/3 body still has affection/recovery rows ===");
{
  const report = buildReport();
  const ids = report.family.section_compare_table.map((r) => r.id);
  assert.ok(ids.includes("affection_expression"));
  assert.ok(ids.includes("gathering_recovery"));
  ok("Task2 body rows preserved");
}

console.log("\nAll family-household-roles checks passed.");
