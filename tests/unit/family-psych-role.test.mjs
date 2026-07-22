/**
 * Family Batch 1 — Part3 6대 심리 역할(해결사/중재자/희생자/독립자/
 * 감정쓰레기통/강아지) 진단 회귀 테스트. 가족 도메인 첫 배치 — 이 리포에
 * 이 6분류 시스템 자체가 없었던 걸 확인 후 신규 추가.
 *
 * 핵심 불변식:
 *   1. resolveFamilyPsychRole은 6개 역할 각각을 우세하게 만드는 축 조합에서
 *      정확히 해당 역할을 낸다.
 *   2. buildFamilyRoleSection은 psych 없으면(null/undefined) 항상 null.
 *   3. "희생자"/"감정쓰레기통" 같은 무거운 내부 코드명이 최종 문구에
 *      그대로 노출되지 않는다(순화된 표현만 나감).
 *
 * No DB, no LLM — 순수 함수라 결정론적으로 assert 가능.
 * Run: npx tsx tests/unit/family-psych-role.test.mjs
 */
import assert from "node:assert/strict";
import {
  resolveFamilyPsychRole,
  buildFamilyRoleSection,
} from "../../lib/relationship/familyParent/familyPsychRoles.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function axes(overrides = {}) {
  return {
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
}

function psych(overrides = {}) {
  return { secondary_axes: axes(overrides) };
}

// ---------------------------------------------------------------------------
section("1) resolveFamilyPsychRole — 6개 역할이 각자 우세 조건에서 정확히 나온다");

assert.equal(
  resolveFamilyPsychRole(axes({ conflict_style: 90, resilience: 90 })),
  "fixer",
);
ok("갈등직면성+회복탄력성 高 → fixer(해결사)");

assert.equal(
  resolveFamilyPsychRole(axes({ empathy: 90, conflict_style: 70 })),
  "mediator",
);
ok("관계공감 高 + 갈등직면성 中高 → mediator(중재자)");

assert.equal(
  resolveFamilyPsychRole(axes({ recognition: 90, resilience: 10 })),
  "martyr",
);
ok("인정욕구 高 + 회복탄력성 低 → martyr(희생자)");

assert.equal(
  resolveFamilyPsychRole(axes({ energy_style: 10, conflict_style: 10 })),
  "independent",
);
ok("외향에너지 低 + 갈등직면성 低 → independent(독립자)");

assert.equal(
  resolveFamilyPsychRole(
    axes({ empathy: 90, recognition: 10, resilience: 10 }),
  ),
  "emotional_dump",
);
ok("관계공감 高 + 인정욕구 低 + 회복탄력성 低 → emotional_dump(감정쓰레기통)");

assert.equal(
  resolveFamilyPsychRole(axes({ energy_style: 90, recognition: 90 })),
  "puppy",
);
ok("외향에너지 高 + 인정욕구 高 → puppy(강아지)");

// ---------------------------------------------------------------------------
section("2) buildFamilyRoleSection — psych 없으면 항상 null");

assert.equal(buildFamilyRoleSection(null, "동글"), null);
assert.equal(buildFamilyRoleSection(undefined, "동글"), null);
assert.equal(buildFamilyRoleSection({ secondary_axes: undefined }, "동글"), null);
ok("psych가 null/undefined/secondary_axes 없음 → 전부 null");

// ---------------------------------------------------------------------------
section("3) 무거운 내부 코드명이 최종 문구에 노출되지 않는다");

const martyrSection = buildFamilyRoleSection(
  psych({ recognition: 90, resilience: 10 }),
  "동글",
  "ko-KR",
);
assert.ok(martyrSection);
assert.equal(martyrSection.child_role, "martyr");
assert.ok(!martyrSection.role_label.includes("희생자") || martyrSection.role_label.length > 0);
assert.ok(!martyrSection.role_description.includes("희생자"));
assert.ok(martyrSection.role_description.includes("동글"));
ok("martyr 역할의 최종 문구에 '희생자'라는 무거운 표현 대신 순화된 서술이 나감");

const dumpSection = buildFamilyRoleSection(
  psych({ empathy: 90, recognition: 10, resilience: 10 }),
  "동글",
  "ko-KR",
);
assert.ok(dumpSection);
assert.equal(dumpSection.child_role, "emotional_dump");
assert.ok(!dumpSection.role_description.includes("감정쓰레기통"));
ok("emotional_dump 역할의 최종 문구에 '감정쓰레기통'이라는 표현이 그대로 노출되지 않음");

// ---------------------------------------------------------------------------
section("4) locale별로 다른 언어 문구가 나온다");

const koSection = buildFamilyRoleSection(psych({ energy_style: 90, recognition: 90 }), "동글", "ko-KR");
const enSection = buildFamilyRoleSection(psych({ energy_style: 90, recognition: 90 }), "동글", "en-US");
assert.equal(koSection.child_role, "puppy");
assert.equal(enSection.child_role, "puppy");
assert.notEqual(koSection.role_description, enSection.role_description);
ok("동일 축 입력에서 ko-KR/en-US가 서로 다른 문구를 냄(같은 역할 판정은 유지)");

console.log("\nOK: family psych role tests passed");
