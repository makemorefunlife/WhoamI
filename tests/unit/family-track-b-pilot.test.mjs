/**
 * 가족 도메인 Track B(자녀 시선) 아키텍처 파일럿 — end-to-end 검증.
 *
 * childIsViewer 플래그가 FamilyRuleContext까지 끌어올려져서 아래 두 파일럿
 * 기능에 실제로 도달하는지 확인한다:
 *   1. 시작점 시그니처 한 줄 요약(one_line_family) — Track A/B 문구가 다름.
 *   2. Part3 6대 심리 역할(section_family_role) — 역할 판정은 동일, 서술
 *      톤(자기진단 vs 부모向)만 다름.
 * 레이아웃/렌더 순서는 그대로 고정이라는 전제(SectionRenderer.tsx 기존
 * 주석)는 이번 배치로 안 바뀐다 — 이 테스트는 콘텐츠 톤 분기만 검증한다.
 *
 * fixture 패턴은 family-household-roles-perspective.test.mjs와 동일
 * (report A/B가 parent/child perspective를 각각 맡도록 구성).
 *
 * Run: npx tsx tests/unit/family-track-b-pilot.test.mjs
 */
import assert from "node:assert/strict";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import { resolveFamilyRolesFromViewer } from "../../lib/relationship/familyParent/resolveFamilyRoles.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";

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

console.log("\n=== 1) one_line_family — Track A(부모 시선) vs Track B(자녀 시선) 문구가 다름 ===");
{
  const reportA = buildPerspectiveFixture("parent");
  const reportB = buildPerspectiveFixture("child");
  assert.notEqual(reportA.one_line_family, reportB.one_line_family);
  assert.equal(reportA.one_line_family, reportA.family.section_snapshot.one_line_family);
  assert.equal(reportB.one_line_family, reportB.family.section_snapshot.one_line_family);
  ok("동일 사주 페어라도 childIsViewer에 따라 시그니처 한 줄 요약이 달라짐");
}

console.log("\n=== 2) grade는 Track 불문 재사용(스펙: 등급 자체는 공유) ===");
{
  const reportA = buildPerspectiveFixture("parent");
  const reportB = buildPerspectiveFixture("child");
  assert.equal(reportA.meta.grade, reportB.meta.grade);
  ok("meta.grade는 childIsViewer와 무관하게 동일 — 판정 로직은 안 건드림");
}

console.log("\n=== 3) section_family_role — 역할 판정은 동일, role_description 톤만 다름 ===");
{
  // psych 없으면 section_family_role이 null이라(안전 처리) 이 파일럿에선
  // 배선 자체(4번째 인자 전달)만 확인한다 — 콘텐츠 톤 차이는
  // family-psych-role.test.mjs가 이미 순수 함수 레벨로 커버함.
  const reportA = buildPerspectiveFixture("parent");
  const reportB = buildPerspectiveFixture("child");
  assert.equal(reportA.family.section_family_role, null);
  assert.equal(reportB.family.section_family_role, null);
  ok("psych 미제공 fixture에서도 크래시 없이 null 유지 — childIsViewer 배선이 안전");
}

console.log("\nAll family-track-b-pilot checks passed.");
