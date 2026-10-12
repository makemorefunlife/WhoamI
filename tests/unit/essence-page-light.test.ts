/**
 * Blueprint essence detail uses the light Stitch look (like the sibling
 * "current" page): no dark space shell / glass cards / white-on-dark text.
 * Static/mock test. Run: npx tsx tests/unit/essence-page-light.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  page: "app/blueprint-preview/[reportId]/essence/page.tsx",
  chart: "components/v2/AxisRadarChart.tsx",
  badge: "components/v2/FreeBadge.tsx",
};
const page = readFileSync(files.page, "utf8");
assert.doesNotMatch(page, /SpaceBackground|GlassCard|GlowButton|LiteReportLoading|LiteReportError|white\/|rgba\(255/);
assert.match(page, /<StitchSurveyShell className="stitch-survey stitch-results">/);
assert.match(page, /StitchReportLoading/);
assert.match(page, /className="stitch-cta-primary w-full"/);
assert.match(page, /<EssenceDeepEntryButton reportId=\{reportId\} featured \/>/);
console.log("ok - essence page: same shell / status / primary button as the current-profile page");

for (const f of [files.chart, files.badge]) {
  assert.doesNotMatch(readFileSync(f, "utf8"), /rgba\(255,255,255|#8ecfff|#67B7FF/, f);
}
const lite = readFileSync("components/v2/LiteReportView.tsx", "utf8");
const block = lite.slice(lite.indexOf("function SectionBlock"), lite.indexOf("export function CurrentLiteReportView"));
assert.doesNotMatch(block, /white|rgba\(255/);
console.log("ok - radar chart, free badge and report sections use light tokens");
console.log("essence-page-light: 2 passed");
