import fs from "fs";
import path from "path";

const filePath = path.resolve("lib/relationship/familyParent/familySajuCompareTable.ts");
let content = fs.readFileSync(filePath, "utf-8");

const oldTarget = `      "low|low": "걱정이 집 전체 분위기로 오래 남기 어려운 조합이에요.",`;
const newTarget = `      "low|low": "집안에서 오해나 마찰이 생기더라도 한쪽이 마음에 담아두고 분위기를 어둡게 끌고 가기보다, 상황을 담담하게 넘기거나 빠르게 풀어내는 성향입니다. 앙금이 정서적 상처로 오래 남아 집 전체를 누르지 않고 쾌적하게 회복되는 좋은 조합입니다.",`;

if (content.includes(oldTarget)) {
  content = content.replace(oldTarget, newTarget);

  // Also replace neutral low|low if present
  content = content.replace(
    `"low|low": "둘 다 집 안 긴장을 오래 붙잡지 않는 편이라, 불편이 생겨도 분위기로 오래 남기 어려워요."`,
    `"low|low": "집안에서 의견이 충돌하거나 긴장 상황이 생겨도 문제를 즉시 털어내거나 담담하게 넘어가는 템포가 빠른 조합입니다. 앙금을 마음에 오랫동안 품고 분위기를 무겁게 끌고 가지 않기 때문에, 집에서의 긴장 상태가 오래 지속되지 않고 금방 밝은 일상으로 회복됩니다."`
  );

  content = content.replace(
    `"low|low": "기준 대화가 집 전체 긴장으로 오래 남기 어려운 조합이에요."`,
    `"low|low": "기준이나 대화에서 긴장이 발생해도 이를 집안 분위기로 오래 품지 않고 담담하게 털어내는 조합입니다. 불필요한 서운함이나 침묵이 길어지지 않고 빠르게 가벼운 일상으로 회복되는 특징을 보입니다."`
  );

  fs.writeFileSync(filePath, content, "utf-8");
  console.log("Successfully enriched familySajuCompareTable.ts!");
} else {
  console.log("Target string not found or already replaced.");
}
