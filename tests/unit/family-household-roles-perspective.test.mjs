/**
 * Verify household_roles 나/상대 mapping for parent vs child perspective.
 * Run: npx tsx tests/unit/family-household-roles-perspective.test.mjs
 */
import assert from "node:assert/strict";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import { buildFamilyReportViewModel } from "../../lib/relationship/familyParent/viewModel/buildFamilyReportViewModel.ts";
import { resolveFamilyRolesFromViewer } from "../../lib/relationship/familyParent/resolveFamilyRoles.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
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

/** Viewer = report A. Parent perspective → A is parent(Jordan). Child perspective → A is child(Alex). */
function buildPerspectiveFixture(perspective) {
  const childIsViewer = perspective === "child";
  const nicknameA = childIsViewer ? "Alex" : "Jordan";
  const nicknameB = childIsViewer ? "Jordan" : "Alex";
  const sajuJsonA = childIsViewer ? sajuChild : sajuParent;
  const sajuJsonB = childIsViewer ? sajuParent : sajuChild;
  const roles = resolveFamilyRolesFromViewer({
    viewerReportId: "report-a",
    reportIdA: "report-a",
    reportIdB: "report-b",
    parentType: "mother",
    childIsViewer,
  });
  return buildFamilyParentReport({
    nicknameA,
    nicknameB,
    roles,
    parentType: "mother",
    childIsViewer,
    sajuJsonA,
    sajuJsonB,
    locale: "ko-KR",
  });
}

const NEUTRAL_LABELS_KO = ["정서 감수형", "맥락 설명형", "기준 설정형", "유연 조율형"];

function assertHouseholdCopyShape(roles) {
  assert.ok(NEUTRAL_LABELS_KO.includes(roles.self_role_label));
  assert.ok(NEUTRAL_LABELS_KO.includes(roles.partner_role_label));
  assert.ok(!/돌봄·수용 담당|설명·맥락 담당|기준·구조 담당|채널 조율 담당/.test(
    `${roles.self_role_label}${roles.partner_role_label}`,
  ));
  assert.ok(!/교정 장면|관계 거리/.test(roles.self_role_detail));
  assert.ok(!/교정 장면|관계 거리/.test(roles.partner_role_detail));
  assert.notEqual(roles.self_role_detail, roles.partner_role_detail);
  assert.ok(roles.self_role_detail.includes(roles.self_name));
  assert.ok(roles.partner_role_detail.includes(roles.partner_name));
  assert.ok(roles.complement.includes(roles.self_name));
  assert.ok(roles.complement.includes(roles.partner_name));
  assert.ok(roles.tension.includes(roles.self_name));
  assert.ok(roles.tension.includes(roles.partner_name));
}

function printParentKoreanCard(report) {
  const t = messagesKoKR.relationshipDrilldown.family;
  const vm = buildFamilyReportViewModel(report, { locale: "ko-KR" });
  const part2 = vm.sections.filter((s) => s.partNumber === 2);
  const compare = part2.find((s) => s.type === "compare_table");
  const roles = part2.find((s) => s.type === "household_roles");

  console.log("\n========== 부모 관점 fixture — household_roles 한국어 최종 카피 ==========");
  console.log(`카드 제목: ${roles.title}`);
  console.log(`${t.householdRolesSelfLabel(roles.selfName)}`);
  console.log(`  역할: ${roles.selfRoleLabel}`);
  console.log(`  설명: ${roles.selfRoleDetail}`);
  console.log(`${t.householdRolesPartnerLabel(roles.partnerName)}`);
  console.log(`  역할: ${roles.partnerRoleLabel}`);
  console.log(`  설명: ${roles.partnerRoleDetail}`);
  console.log(`${t.householdRolesComplementLabel}`);
  console.log(`  ${roles.complement}`);
  console.log(`${t.householdRolesTensionLabel}`);
  console.log(`  ${roles.tension}`);

  assert.ok(compare);
  assert.ok(roles);
  assert.deepEqual(
    compare.rows.map((r) => r.id),
    ["correction_style", "bond_distance", "guidance_balance", "home_climate"],
  );
  const compareIdx = part2.findIndex((s) => s.type === "compare_table");
  const rolesIdx = part2.findIndex((s) => s.type === "household_roles");
  assert.ok(rolesIdx === compareIdx + 1);
}

console.log("\n=== parent perspective: 나=부모(Jordan), 상대=자녀(Alex) ===");
{
  const report = buildPerspectiveFixture("parent");
  const r = report.family.section_household_roles;
  assert.equal(r.self_name, "Jordan");
  assert.equal(r.partner_name, "Alex");
  assert.equal(report.family.section_roles.parent_nickname, "Jordan");
  assert.equal(report.family.section_roles.child_nickname, "Alex");
  assertHouseholdCopyShape(r);
  ok("parent perspective maps 나→parent, 상대→child");
  printParentKoreanCard(report);
}

console.log("\n=== child perspective: 나=자녀(Alex), 상대=부모(Jordan) ===");
{
  const report = buildPerspectiveFixture("child");
  const r = report.family.section_household_roles;
  assert.equal(r.self_name, "Alex");
  assert.equal(r.partner_name, "Jordan");
  assert.equal(report.family.section_roles.child_nickname, "Alex");
  assert.equal(report.family.section_roles.parent_nickname, "Jordan");
  assertHouseholdCopyShape(r);
  ok("child perspective maps 나→child, 상대→parent");
}

console.log("\nAll family-household-roles-perspective checks passed.");
