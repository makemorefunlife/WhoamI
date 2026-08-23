import { buildFamilyRuleContext } from "../lib/relationship/familyParent/buildFamilyRuleContext";
import { buildFamilyHouseholdRoles } from "../lib/relationship/familyParent/buildFamilyHouseholdRoles";
import { calculateSajuBundle } from "../lib/v2/saju/calculateSajuBundle";
import { toV1SajuApiPayload } from "../lib/saju/toApiPayload";

function createSaju(birthDate: string, birthTime: string) {
  const bundle = calculateSajuBundle({ birthDate, birthTime });
  return toV1SajuApiPayload(bundle);
}

// Pair 1: Sera x 동글 (Mother 1993, Child 2020)
const seraChart = createSaju("1993-05-15", "14:00");
const donggleChart = createSaju("2020-08-20", "10:00");

const ctx1 = buildFamilyRuleContext({
  nicknameA: "동글",
  nicknameB: "Sera",
  roles: { roleA: "child", roleB: "mother" },
  sajuJsonA: donggleChart,
  sajuJsonB: seraChart,
  locale: "ko-KR",
});
const roles1 = buildFamilyHouseholdRoles({
  parentNickname: "Sera",
  childNickname: "동글",
  countsParent: ctx1.tenGod.countsParent,
  countsChild: ctx1.tenGod.countsChild,
  locale: "ko-KR",
  ctx: ctx1,
});

// Pair 2: 민준엄마 x 지우 (Mother 1982, Child 2012 - Strict Parent & Responsible Child)
const parent2 = createSaju("1982-11-03", "08:30");
const child2 = createSaju("2012-03-14", "16:45");

const ctx2 = buildFamilyRuleContext({
  nicknameA: "지우",
  nicknameB: "민준엄마",
  roles: { roleA: "child", roleB: "mother" },
  sajuJsonA: child2,
  sajuJsonB: parent2,
  locale: "ko-KR",
});
const roles2 = buildFamilyHouseholdRoles({
  parentNickname: "민준엄마",
  childNickname: "지우",
  countsParent: ctx2.tenGod.countsParent,
  countsChild: ctx2.tenGod.countsChild,
  locale: "ko-KR",
  ctx: ctx2,
});

console.log("=== PAIR 1 (Sera x 동글) ===");
console.log("부모 역할:", roles1.parent_normal_label, "| 긴장 시:", roles1.parent_stress_label);
console.log("자녀 역할:", roles1.child_normal_label, "| 긴장 시:", roles1.child_stress_label);
console.log("의외의 역할:", roles1.unexpected_role ? roles1.unexpected_role.roleLabel : "없음");
console.log("부담 제목:", roles1.role_burden?.burdenTitle);

console.log("\n=== PAIR 2 (민준엄마 x 지우) ===");
console.log("부모 역할:", roles2.parent_normal_label, "| 긴장 시:", roles2.parent_stress_label);
console.log("자녀 역할:", roles2.child_normal_label, "| 긴장 시:", roles2.child_stress_label);
console.log("의외의 역할:", roles2.unexpected_role ? roles2.unexpected_role.roleLabel : "없음");
console.log("부담 제목:", roles2.role_burden?.burdenTitle);
