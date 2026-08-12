import { buildCanonicalRomanticV4Report } from "@/lib/relationship/romantic/prototypeV4/buildCanonicalRomanticV4Report";
import type { RomanticV4PairSajuInput } from "@/lib/relationship/romantic/prototypeV4/romanticV4SajuInput";

const pairInput1: RomanticV4PairSajuInput = {
  nameA: "지민", birthYearA: 1995, birthMonthA: 5, birthDayA: 15, birthHourA: 12, isLunarA: false, genderA: "F",
  nameB: "정우", birthYearB: 1993, birthMonthB: 8, birthDayB: 20, birthHourB: 14, isLunarB: false, genderB: "M",
};

console.log("=== ROMANTIC P0 FIXTURE 1: Standard Pair P0 Models ===");
{
  const r = buildCanonicalRomanticV4Report("ko-KR", 2026, { pairSajuInput: pairInput1 });
  const sp = r.storyPlan;
  console.log("sp keys:", Object.keys(sp));
  console.log({
    hasConflictLoop: !!sp.conflictLoopP0,
    trigger: sp.conflictLoopP0?.trigger,
    coolingNeed: sp.repairPatternP0?.coolingNeed,
    effectiveRepair: sp.repairPatternP0?.effectiveRepairStyle,
    actionCandidatesCount: sp.actionCandidatesP0?.length,
  });
}
