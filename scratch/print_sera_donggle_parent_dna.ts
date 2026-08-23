import { buildFamilyRuleContext } from "../lib/relationship/familyParent/buildFamilyRuleContext";
import { buildFamilyParentDna } from "../lib/relationship/familyParent/familyParentDna";
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

const { parentDna, parentChildBridge } = buildFamilyParentDna(ctx);

console.log("=== Parent DNA (Sera) ===");
console.log("1. 보호할 때:", parentDna.protection_style);
console.log("2. 걱정될 때:", parentDna.anxiety_trigger_behavior);
console.log("3. 아이를 믿는 방식:", parentDna.trust_autonomy_style);
console.log("4. 기준을 세울 때:", parentDna.discipline_style);
console.log("5. 성장을 밀어주는 방식:", parentDna.growth_support_style);
console.log("6. 조심할 점:", parentDna.shadow_side_warning);

console.log("\n=== 이 부모와 이 아이가 만났을 때 (Pair Bridge) ===");
console.log("1. 특히 잘 맞는 부분:", parentChildBridge.best_harmony_point);
console.log("2. 엇갈리기 쉬운 순간:", parentChildBridge.friction_risk_moment);
console.log("3. 가장 좋은 부모 포지션:", parentChildBridge.optimal_parent_position);
