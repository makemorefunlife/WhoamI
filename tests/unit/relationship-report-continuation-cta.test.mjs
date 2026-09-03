/**
 * Report-end continuation CTAs (gap-closure sections 25-29): "explore
 * another lens" must exclude the currently-open domain and never drop or
 * duplicate a valid one, and routing to another lens must preserve pair
 * identity (same relationshipReportId + viewerReportId, only kind changes).
 *
 * Run: npx tsx tests/unit/relationship-report-continuation-cta.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { RELATIONSHIP_KINDS } = await import("../../lib/relationship/relationshipKind.ts");
const { otherRelationshipKinds } = await import(
  "../../lib/relationship/reportContinuationKinds.ts"
);
const { buildRelationshipAnalyzeUrl } = await import(
  "../../lib/relationship/hubNavigation.ts"
);

section("otherRelationshipKinds excludes exactly the current domain");
for (const current of RELATIONSHIP_KINDS) {
  const others = otherRelationshipKinds(current);
  assert.ok(!others.includes(current), `must not include the current kind "${current}"`);
  assert.equal(others.length, RELATIONSHIP_KINDS.length - 1, "must include every other kind");
  assert.equal(new Set(others).size, others.length, "no duplicates");
  for (const k of RELATIONSHIP_KINDS) {
    if (k !== current) assert.ok(others.includes(k), `must still include "${k}"`);
  }
}
ok(`for all ${RELATIONSHIP_KINDS.length} kinds, exactly the current one is excluded, nothing else is dropped`);

section("routing to another lens preserves pair identity");
{
  const relationshipReportId = "rr-fixed-pair-1234";
  const viewerReportId = "viewer-fixed-5678";
  const others = otherRelationshipKinds("friendship");
  const urls = others.map((kind) => buildRelationshipAnalyzeUrl(relationshipReportId, viewerReportId, kind));

  for (const [i, url] of urls.entries()) {
    assert.ok(url.startsWith(`/relationship/${relationshipReportId}?`), `URL must target the same relationship report: ${url}`);
    assert.ok(url.includes(`viewer=${viewerReportId}`), `URL must carry the same viewer: ${url}`);
    assert.ok(url.includes(`kind=${others[i]}`), `URL must carry the target kind: ${url}`);
  }
  const distinctKindParams = new Set(
    urls.map((u) => new URLSearchParams(u.split("?")[1]).get("kind")),
  );
  assert.equal(distinctKindParams.size, others.length, "each CTA must route to a distinct kind");
  ok(
    `${others.length} "explore another lens" URLs all target relationshipReportId=${relationshipReportId}, viewer=${viewerReportId}, only kind differs`,
  );
}

console.log("\nAll report continuation CTA tests passed.");
