import { calculateSajuBundle } from "../lib/v2/saju/calculateSajuBundle";
import { buildIndividualSajuChart } from "../lib/personCore/individualSaju/buildIndividualSajuChart";
import { buildPersonalRelationshipCe } from "../lib/relationship/romantic/prototypeV4/personalRelationshipCe";

const bundleA = calculateSajuBundle({
  birthDate: "1988-02-02",
  birthTime: "11:10",
  birthTimeUnknown: false,
});

const chartA = buildIndividualSajuChart({
  reportId: "test_a",
  bundle: bundleA,
  birthDate: "1988-02-02",
  birthTime: "11:10",
  birthTimeUnknown: false,
});

const ceA = buildPersonalRelationshipCe({
  personId: "a",
  name: "Sera",
  chart: chartA,
  locale: "ko-KR",
});

console.log("Sera Johu tempBand:", chartA.johu.temperature_band);
console.log("Sera Recovery Pattern:", ceA.recoveryPattern.text);
