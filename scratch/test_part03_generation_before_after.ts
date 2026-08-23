import fs from "node:fs";

console.log("=== PART 03 GENERATION CONTRACT BEFORE / AFTER COMPARISON ===");

const beforeSample = {
  axis: "structure (체계성)",
  natural_tendency: "본래는 명확한 규칙과 수순이 정해져 있을 때 비로소 편안함을 느끼는 성향입니다.",
  current_pattern: "현실에서는 미리 계획을 세우고 그 틀에 맞춰 상황을 정리하는 방식을 지속해왔습니다.",
  gives_you_before: "구조적인 환경은 당신이 더 집중하고, 안정감을 느낄 수 있게 해줘요.",
  may_cost_before: "규칙이 자주 바뀌면, 그에 맞춰 다시 적응해야 하니 에너지가 소모될 수 있어요.",

  gives_you_after: "불확실한 상황에서도 직접 기준과 수순을 세우고, 복잡한 일의 흐름을 체계적으로 정리하는 능력이 발달했어요.",
  may_cost_after: "모든 상황이 충분히 정리되어야만 움직일 수 있다고 느낄 때는, 계획을 검토하고 확인하는 과정에 필요 이상의 에너지를 지속적으로 쓰게 돼요."
};

console.log("\n[BEFORE]");
console.log(`- Axis: ${beforeSample.axis}`);
console.log(`- 본래 더 편한 방식: ${beforeSample.natural_tendency}`);
console.log(`- 현실에서 익숙해진 방식: ${beforeSample.current_pattern}`);
console.log(`- 살아오며 생긴 힘 (Before): ${beforeSample.gives_you_before}`);
console.log(`- 그만큼 드는 에너지 (Before): ${beforeSample.may_cost_before}`);

console.log("\n[AFTER (Updated Generation Contract & UI Hierarchy)]");
console.log(`- Axis: ◤ 체계성`);
console.log(`- ▫ 본래 더 편한 방식: ${beforeSample.natural_tendency}`);
console.log(`- ▫ 현실에서 익숙해진 방식: ${beforeSample.current_pattern}`);
console.log(`- ▫ 살아오며 생긴 힘 (After - Acquired Capability): ${beforeSample.gives_you_after}`);
console.log(`- ▫ 그만큼 드는 에너지 (After - Sustained Adaptation Cost): ${beforeSample.may_cost_after}`);
