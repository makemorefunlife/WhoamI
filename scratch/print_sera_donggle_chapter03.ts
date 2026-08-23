import { buildFamilyRuleContext } from "../lib/relationship/familyParent/buildFamilyRuleContext";
import { buildFamilyHouseholdRoles } from "../lib/relationship/familyParent/buildFamilyHouseholdRoles";
import { calculateSajuBundle } from "../lib/v2/saju/calculateSajuBundle";
import { toV1SajuApiPayload } from "../lib/saju/toApiPayload";

function createSaju(birthDate: string, birthTime: string) {
  const bundle = calculateSajuBundle({ birthDate, birthTime });
  return toV1SajuApiPayload(bundle);
}

const seraChart = createSaju("1993-05-15", "14:00");
const donggleChart = createSaju("2020-08-20", "10:00");

const ctx = buildFamilyRuleContext({
  nicknameA: "동글",
  nicknameB: "Sera",
  roles: { roleA: "child", roleB: "mother" },
  sajuJsonA: donggleChart,
  sajuJsonB: seraChart,
  locale: "ko-KR",
});

const roles = buildFamilyHouseholdRoles({
  parentNickname: ctx.parentNickname,
  childNickname: ctx.childNickname,
  countsParent: ctx.tenGod.countsParent,
  countsChild: ctx.tenGod.countsChild,
  familySignalsParent: ctx.familySignalsParent,
  familySignalsChild: ctx.familySignalsChild,
  pairFamily: null,
  viewerIsChild: false,
  locale: "ko-KR",
  ctx,
});

console.log("=== CHAPTER 03: Sera x 동글 ===");
console.log("1. 우리 가족의 기본 구도:", roles.pair_structure_overview);
console.log("\n2. 부모가 맡기 쉬운 자리 (Sera):");
console.log("  - 평소 역할:", roles.parent_normal_label, "—", roles.parent_normal_desc);
console.log("  - 긴장 때 역할:", roles.parent_stress_label, "—", roles.parent_stress_desc);
console.log("  - 행동적 의미:", roles.parent_meaning);

console.log("\n3. 아이가 맡기 쉬운 자리 (동글):");
console.log("  - 평소 역할:", roles.child_normal_label, "—", roles.child_normal_desc);
console.log("  - 긴장 때 역할:", roles.child_stress_label, "—", roles.child_stress_desc);
console.log("  - 행동적 의미:", roles.child_meaning);

console.log("\n4. 의외로 드러나는 역할:", roles.unexpected_role ? JSON.stringify(roles.unexpected_role, null, 2) : "없음 (임계값 미만으로 깔끔하게 생략됨)");

console.log("\n5. 둘이 있을 때 역할이 맞물리는 방식:", roles.pair_causal_mechanism);
console.log("\n6. 둘이 자연스럽게 잘 굴러갈 때:", roles.pair_synergy_when_smooth);
console.log("\n7. 부담이 몰리는 순간:", JSON.stringify(roles.role_burden, null, 2));
