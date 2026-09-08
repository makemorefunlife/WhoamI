/**
 * Regression test suite for Personal Analysis Data Provenance & Example Handling:
 * 1. Demo radar chart on Landing Page is explicitly marked as Example / Sample area.
 * 2. User-specific results dashboard (StitchResultsDashboard / /blueprint-preview) renders actual computed user scores without Example labels.
 * 3. Exact KR & EN copy verification.
 *
 * Run: npx tsx tests/unit/personal-analysis-example-provenance.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getMessages } from "../../lib/i18n/messages/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`ok - ${name}`);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}
function readSrc(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

section("1. Landing Page Demo Section — Explicit Example Banner & Notice");
{
  const landingSrc = readSrc("components/landing/stitch/StitchLandingPage.tsx");
  const radarSrc = readSrc("components/landing/stitch/StitchPersonalRadar.tsx");

  assert.ok(
    landingSrc.includes("messages.landing.personalExampleEyebrow"),
    "Landing page Personal Analysis section must include personalExampleEyebrow",
  );
  assert.ok(
    landingSrc.includes("messages.landing.personalExampleNotice"),
    "Landing page Personal Analysis section must include personalExampleNotice",
  );
  assert.ok(
    landingSrc.includes("sampleBadgeText={messages.landing.personalExampleEyebrow}"),
    "StitchPersonalRadar must receive sampleBadgeText on landing page",
  );

  assert.ok(
    radarSrc.includes("sampleBadgeText"),
    "StitchPersonalRadar must render sampleBadgeText when provided",
  );

  ok("Landing page demo personal analysis section is explicitly marked as Example area");
}

section("2. Data Provenance — Actual Results Dashboard (/blueprint-preview) Uses Calculated User Scores");
{
  const dashboardSrc = readSrc("components/results/StitchResultsDashboard.tsx");

  assert.ok(
    dashboardSrc.includes("current={current.primary_axes}"),
    "Dashboard DualAxisRadarChart must use current.primary_axes computed from user survey",
  );
  assert.ok(
    dashboardSrc.includes("essence={essence.primary_axes}"),
    "Dashboard DualAxisRadarChart must use essence.primary_axes computed from saju engine",
  );
  assert.ok(
    dashboardSrc.includes("scores={current.primary_axes}"),
    "Dashboard AxisSummaryCards must use calculated scores from user profile",
  );
  assert.equal(
    dashboardSrc.includes("personalExampleEyebrow"),
    false,
    "Dashboard showing real user results must NOT be marked with Example banner",
  );

  ok("Actual user dashboard (StitchResultsDashboard) receives computed survey & saju scores without Example label");
}

section("3. Exact Copy Verification for KR & EN");
{
  const ko = getMessages("ko-KR");
  const en = getMessages("en-US");

  assert.equal(
    ko.landing.personalExampleEyebrow,
    "예시 · 개인 분석",
    "KR eyebrow must be '예시 · 개인 분석'",
  );
  assert.equal(
    ko.landing.personalExampleNotice,
    "개인 분석을 완료하면 나의 실제 결과로 이 프로필을 확인할 수 있어요.",
    "KR notice must match requested text",
  );

  assert.equal(
    en.landing.personalExampleEyebrow,
    "Example · Personal Analysis",
    "EN eyebrow must be 'Example · Personal Analysis'",
  );
  assert.equal(
    en.landing.personalExampleNotice,
    "Complete your Personal Analysis to see this profile with your own results.",
    "EN notice must match requested text",
  );

  ok("KR & EN copy match exact user requirements");
}

section("4. Info Icon Interaction & Actual Result Badge on StitchResultsDashboard");
{
  const dashboardSrc = readSrc("components/results/StitchResultsDashboard.tsx");
  const ko = getMessages("ko-KR");
  const en = getMessages("en-US");

  assert.ok(
    dashboardSrc.includes("setShowChartInfo((prev) => !prev)"),
    "Info button must have onClick toggle handler for showChartInfo state",
  );
  assert.ok(
    dashboardSrc.includes("messages.report.actualResultBadge"),
    "StitchResultsDashboard must render actualResultBadge label near chart",
  );
  assert.ok(
    dashboardSrc.includes("messages.report.chartInfoPopover"),
    "StitchResultsDashboard popover tooltip must display chartInfoPopover message",
  );

  assert.equal(
    ko.report.actualResultBadge,
    "내 실제 분석 결과",
    "KR actualResultBadge must be '내 실제 분석 결과'",
  );
  assert.ok(
    ko.report.chartInfoPopover.includes("이 차트는 내 실제 분석 결과예요."),
    "KR chartInfoPopover must explain real result provenance",
  );

  assert.equal(
    en.report.actualResultBadge,
    "Your actual analysis",
    "EN actualResultBadge must be 'Your actual analysis'",
  );
  assert.ok(
    en.report.chartInfoPopover.includes("This chart uses your actual analysis results."),
    "EN chartInfoPopover must explain real result provenance",
  );

  ok("Info icon interaction popover and actualResultBadge correctly wired on StitchResultsDashboard");
}

console.log(`\nAll ${passed} personal analysis provenance tests passed.`);
