import { buildFamilyRuleContext } from "@/lib/relationship/familyParent/buildFamilyRuleContext";
import { buildFamilyParentReport } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import { parseSajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import fs from "fs";

// Load a golden fixture
const rawParent = JSON.parse(fs.readFileSync("tests/fixtures/parent.json", "utf-8"));
const rawChild = JSON.parse(fs.readFileSync("tests/fixtures/child.json", "utf-8"));
const psychParent = JSON.parse(fs.readFileSync("tests/fixtures/psych_parent.json", "utf-8"));
const psychChild = JSON.parse(fs.readFileSync("tests/fixtures/psych_child.json", "utf-8"));

const report = buildFamilyParentReport({
  nicknameA: "엄마",
  nicknameB: "아들",
  roles: { roleA: "mother", roleB: "son" },
  parentType: "mother",
  sajuJsonA: parseSajuDataForIntegrated(rawParent),
  sajuJsonB: parseSajuDataForIntegrated(rawChild),
  psychMasterA: psychParent,
  psychMasterB: psychChild,
});

console.log(JSON.stringify(report.canonical_projections?.story_plan?.selectedClaims, null, 2));
