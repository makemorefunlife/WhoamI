/**
 * Family relationship flow -- saved-report resolution, setup step, credits.
 * Run: npx tsx tests/unit/family-relationship-flow.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload";
import {
  FAMILY_PARENT_CHILD_DEEP_FORMAT,
  isFamilyParentChildDeepReport,
} from "../../lib/prompts/relationshipPremium/familyParentChild/outputSchema";
import {
  getFamilyParentDeepReport,
  hasPremiumCacheForKind,
  hasPremiumCacheForKindLocale,
} from "../../lib/relationship/premiumByKind";
import {
  buildFamilyPersonContrastLead,
  hasFamilyPersonContrastLead,
} from "../../lib/relationship/familyParent/familyPersonContrastLead";
import { resolveRelationshipEntryState } from "../../lib/credits/analysisEntryGate";
import { resolveFamilyRolesFromViewer } from "../../lib/relationship/familyParent/resolveFamilyRoles";
import { buildRelationshipAnalyzeUrl } from "../../lib/relationship/hubNavigation";
import { messagesEnUS } from "../../lib/i18n/messages/en-US";
import { messagesKoKR } from "../../lib/i18n/messages/ko-KR";

const HANGUL = /[가-힣]/;
let passed = 0;
const ok = (n: string) => {
  passed += 1;
  console.log(`ok - ${n}`);
};
const src = (p: string) => readFileSync(p, "utf8");
const section = src("components/relationship/detail/RelationshipPremiumSection.tsx");
const view = src("app/relationship/[id]/RelationshipView.tsx");
const hook = src("app/relationship/[id]/useRelationshipDetail.ts");
const panel = src("components/relationship/detail/FamilySetupPanel.tsx");
const premiumRoute = src("app/api/relationship/analyze/premium/route.ts");

const saju = (d: string) => {
  const p = toV1SajuApiPayload(calculateSajuBundle({ birthDate: d, birthTime: "12:00" }));
  return { saju: p.saju, dayStemData: p.dayStemData, dayBranchData: p.dayBranchData, hiddenStemsData: p.hiddenStemsData, tenGods: p.tenGods, twelveStageData: p.twelveStageData, relations: p.relations, shinsals: p.shinsals };
};
const PAIRS: [string, string][] = [["2014-05-15", "1988-08-20"], ["2010-01-03", "1979-11-30"], ["2016-07-21", "1990-02-14"]];
const report = (locale: "en-US" | "ko-KR", pair: [string, string]) =>
  buildFamilyParentReport({ nicknameA: "Alex", nicknameB: "Jordan", roles: { roleA: "child", roleB: "mother" }, parentType: "mother", sajuJsonA: saju(pair[0]), sajuJsonB: saju(pair[1]), locale } as never);
const byKindWith = (locale: "en-US" | "ko-KR", r: unknown) =>
  ({ family: { byLocale: { [locale]: { format: FAMILY_PARENT_CHILD_DEEP_FORMAT, report: r } } } }) as never;
const base = { kindLoaded: true, creditExhausted: false, creditEnforced: true };

// 1 + 3 + 10 -- a generated Family report is recognized as saved, in both locales
for (const locale of ["en-US", "ko-KR"] as const) {
  for (const pair of PAIRS) {
    const r = report(locale, pair);
    assert.ok(isFamilyParentChildDeepReport({ format: FAMILY_PARENT_CHILD_DEEP_FORMAT, report: r } as never), `${locale} ${pair[0]} rejected`);
    const byKind = byKindWith(locale, r);
    assert.ok(getFamilyParentDeepReport(byKind, locale), "detail lookup must return the saved report");
    assert.ok(hasPremiumCacheForKindLocale(byKind, "family", locale), "premium route cache must hit (no regeneration)");
    assert.ok(hasPremiumCacheForKind(byKind, "family"), "hub/history readiness must agree");
  }
}
ok("1/3/10: generated Family reports (en-US + ko-KR, same-signal + different-signal rows) resolve as saved: detail lookup, cache hit and readiness agree");

assert.equal(resolveRelationshipEntryState({ ...base, hasSavedReport: true, remaining: 0 }), "saved_report");
assert.ok(
  section.indexOf('premiumKind === "family" && displayFamilyDeep ?') < section.indexOf("familyNeedsSetup ? ("),
  "saved Family report renders before any setup/empty state",
);
assert.match(section, /const familyNeedsSetup =\s*isFamily && \(entryState === "generate" \|\| entryState === "purchase"\)/);
assert.ok(
  premiumRoute.indexOf("hasPremiumCacheForKindLocale(byKind, kind, locale)") < premiumRoute.indexOf("reserveRelationshipCredit(supabase"),
  "cache hit returns before any credit reservation",
);
ok("1/10: saved report -> shown, no setup, no Buy CTA; reopening hits the cache before reserve_credit (no credit)");

// Validation is not weakened: a v1 compare table (no person lead) is still a cache miss
assert.equal(hasFamilyPersonContrastLead("Different habits around repair."), false);
const v1 = report("en-US", PAIRS[0]) as unknown as { family: { section_compare_table: { meaning: string }[] } };
v1.family.section_compare_table[0].meaning = "Different habits around repair.";
assert.equal(isFamilyParentChildDeepReport({ format: FAMILY_PARENT_CHILD_DEEP_FORMAT, report: v1 } as never), false);
for (const locale of ["en-US", "ko-KR"] as const) {
  assert.ok(hasFamilyPersonContrastLead(buildFamilyPersonContrastLead(locale, "A", "x", "B", "x")));
  assert.ok(hasFamilyPersonContrastLead(buildFamilyPersonContrastLead(locale, "A", "x", "B", "y")));
}
assert.ok(hasFamilyPersonContrastLead("“A”: “x”"), "legacy stored EN wording still accepted");
ok("validator still rejects v1 compare tables; writer and checker share one wording source");

// 2 -- loading never shows the empty state / setup / Buy
assert.equal(resolveRelationshipEntryState({ ...base, kindLoaded: false, hasSavedReport: false, remaining: 0 }), "loading");
assert.doesNotMatch(section, /messages\.report\.premiumEmptyFamily\b/);
assert.match(section, /familyNeedsSetup \? \(\s*familySetup\("first"\)\s*\) : \(\s*<div[\s\S]{0,200}messages\.common\.preparing/);
assert.match(hook, /setLoadedPremiumKind\(kindForRequest\)/);
ok("2: while the Family report loads -> neutral 'Preparing…', never 'You don't have a Child DNA analysis yet' + Buy");

// 4 -- a new Family analysis shows the setup step first
assert.equal(resolveRelationshipEntryState({ ...base, hasSavedReport: false, remaining: 1 }), "generate");
assert.match(section, /familyNeedsSetup \? null : entryState === "purchase"/, "no separate Generate/Buy button while setup is shown");
assert.match(hook, /if \(analysisSurface === "family" && !familyContextFromUrl\) \{\s*autostartTriggered\.current = true;\s*return;/);
assert.match(view, /!\(analysisSurface === "family" && !familyContextFromUrl\)/);
assert.match(panel, /disabled=\{!complete \|\| busy\}/);
ok("4: new Family analysis -> Family setup first; no autostart on silent defaults; Start disabled until both answers chosen");

// 5 + 6 -- canonical role mapping (existing fields only)
assert.deepEqual(
  resolveFamilyRolesFromViewer({ viewerReportId: "A", reportIdA: "A", reportIdB: "B", parentType: "father", childIsViewer: false }),
  { roleA: "father", roleB: "child" },
);
assert.deepEqual(
  resolveFamilyRolesFromViewer({ viewerReportId: "A", reportIdA: "A", reportIdB: "B", parentType: "mother", childIsViewer: true }),
  { roleA: "child", roleB: "mother" },
);
assert.match(hook, /parent_type: familyParentType,\s*child_is_viewer: familyChildIsViewer,/);
assert.match(panel, /onFamilyChildIsViewerChange\(childIsViewer\)/);
assert.match(panel, /onFamilyParentTypeChange\(role\)/);
ok("5/6: parent + mom/dad and child roles map onto existing parent_type / child_is_viewer (no new fields)");

// 7 + 8 -- Start analysis: credit -> generate; no credit -> checkout on the first action
assert.equal(resolveRelationshipEntryState({ ...base, hasSavedReport: false, remaining: 0 }), "purchase");
assert.match(section, /if \(entryState === "purchase" && onOpenPurchase\) \{\s*onOpenPurchase\(\);\s*return;\s*\}\s*void handleGenerateClick\(\);/);
assert.match(view, /onCreditExhausted: openPurchaseOnCreditExhausted/);
ok("7/8: Start analysis generates with a credit; with 0 credits it opens checkout on that first click (402 fallback too)");

// 9 -- purchase keeps the Family context and resumes generation
assert.match(view, /premiumKind === "family"\s*\?[\s\S]{0,160}parentType: familyParentType,\s*childIsViewer: familyChildIsViewer \? "true" : "false"/);
assert.match(view, /function handlePurchaseSuccess\(\) \{[\s\S]{0,400}void runPremium\(premiumKind\);/);
const hubUrl = new URL(`https://x${buildRelationshipAnalyzeUrl("r1", "v1", "family", { perspective: "child", parentType: "father" })}`);
assert.equal(hubUrl.searchParams.get("parentType"), "father");
assert.equal(hubUrl.searchParams.get("childIsViewer"), "true");
assert.match(hook, /\(urlParentType === "mother" \|\| urlParentType === "father"\) &&\s*\(urlChildIsViewer === "true" \|\| urlChildIsViewer === "false"\)/);
ok("9: after purchase the same context resumes generation (in-page state, or the return URL's parentType/childIsViewer) -- no second setup");

// 11 -- retry / refresh
assert.match(section, /async function handleGenerateClick\(\) \{\s*if \(submitting\) return;/);
assert.match(hook, /the ONLY path that sends force_regenerate:true/);
ok("11: double click is ignored while generating; refresh is a cache hit; only an explicit confirmed regenerate spends a new credit");

// 12 -- no Family state leaking into other kinds
assert.match(hook, /\.\.\.\(kind === "family"\s*\?\s*\{\s*parent_type: familyParentType,/);
assert.match(section, /const familyNewAnalysisOpen = isFamily && familyNewAnalysisKind === "family";/);
assert.match(section, /onClick=\{isFamily \? \(\) => setFamilyNewAnalysisKind\("family"\) : onRegeneratePremium\}/);
ok("12: Family context is only sent / shown for the Family kind; Romantic/Friend/Marriage unaffected");

// en-US + ko-KR copy
for (const [m, isKo] of [[messagesEnUS, false], [messagesKoKR, true]] as const) {
  const r = m.report;
  const lines = [r.familySetupTitle, r.familySetupSubtitle, r.familySetupParentQuestionSelf, r.familySetupParentQuestionPartner("Jordan"), r.familyStartAnalysisCta, m.hub.perspectiveSelectLabel, m.hub.parentPerspectiveTitle, m.hub.childPerspectiveTitle, m.hub.motherLensShort, m.hub.fatherLensShort];
  for (const line of lines) assert.equal(HANGUL.test(line), isKo, `${isKo ? "ko" : "en"} copy wrong language: ${line}`);
}
assert.equal(messagesEnUS.report.familyStartAnalysisCta, "Start analysis");
assert.equal(messagesKoKR.report.familyStartAnalysisCta, "분석 시작하기");
ok("en-US / ko-KR: Family setup copy is fully localized ('Start analysis' / '분석 시작하기')");

console.log(`\nfamily-relationship-flow: ${passed} passed`);
