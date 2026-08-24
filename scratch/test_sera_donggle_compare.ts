import { buildFamilyRuleContext } from "../lib/relationship/familyParent/buildFamilyRuleContext";
import { buildFamilySajuCompareTable } from "../lib/relationship/familyParent/familySajuCompareTable";
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

const rows = buildFamilySajuCompareTable({
  parentNickname: ctx.parentNickname,
  childNickname: ctx.childNickname,
  countsParent: ctx.tenGod.countsParent,
  countsChild: ctx.tenGod.countsChild,
  chartParent: ctx.chartParent,
  chartChild: ctx.chartChild,
  friendshipSignalsParent: ctx.friendshipSignalsParent,
  friendshipSignalsChild: ctx.friendshipSignalsChild,
  familySignalsParent: ctx.familySignalsParent,
  familySignalsChild: ctx.familySignalsChild,
  pairFamily: null,
  parentRole: ctx.parentRole,
  locale: "ko-KR",
});

console.log(JSON.stringify(rows, null, 2));
