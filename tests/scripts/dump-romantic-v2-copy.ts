import { romanticExperienceCompleteFixture } from "../../lib/relationship/romantic/experience/romanticExperienceDevFixtures";
import { buildRomanticExperienceViewModel } from "../../lib/relationship/romantic/experience/buildRomanticExperienceViewModel";
import { buildRomanticPremiumNarrative } from "../../lib/relationship/romantic/experience/buildRomanticPremiumNarrative";
import type { RomanticSajuDeepReport } from "../../lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";

type RomanticReportBody = RomanticSajuDeepReport["report"];
const fixtureReport = romanticExperienceCompleteFixture as RomanticReportBody;

const vm = buildRomanticExperienceViewModel({
  report: fixtureReport,
  viewerIsReportA: true,
  myName: "지민",
  partnerName: "정우",
  nameA: "지민",
  nameB: "정우",
});

const narrativeModules = buildRomanticPremiumNarrative(
  vm,
  fixtureReport
);
console.log(JSON.stringify(narrativeModules, null, 2));