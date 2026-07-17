/**
 * Free relationship analysis (ensureBasic) must send the app locale to the
 * server — otherwise the API falls back to the browser's Accept-Language
 * header, which does not reflect the "/" vs "/kr" route the user is on.
 * Run: npx tsx tests/unit/relationship-basic-locale-request.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";

function ok(name) {
  console.log(`ok - ${name}`);
}

const src = fs.readFileSync(
  "app/relationship/[id]/useRelationshipDetail.ts",
  "utf8",
);

const ensureBasicStart = src.indexOf("const ensureBasic = useCallback");
assert.ok(ensureBasicStart >= 0, "ensureBasic() should exist in useRelationshipDetail.ts");

const nextFnStart = src.indexOf("const toggleFavorite = useCallback", ensureBasicStart);
const ensureBasicBody = src.slice(
  ensureBasicStart,
  nextFnStart > ensureBasicStart ? nextFnStart : ensureBasicStart + 1200,
);

assert.match(
  ensureBasicBody,
  /"\/api\/relationship\/analyze\/basic"/,
  "ensureBasic should call the basic analyze endpoint",
);
assert.match(
  ensureBasicBody,
  /"x-aha-locale":\s*locale/,
  "ensureBasic fetch headers must include x-aha-locale",
);
assert.match(
  ensureBasicBody,
  /language:\s*locale/,
  "ensureBasic request body must include language: locale",
);
assert.match(
  ensureBasicBody,
  /body:\s*JSON\.stringify\(\{[\s\S]*locale,[\s\S]*\}\)/,
  "ensureBasic request body must include the locale field",
);
ok("ensureBasic() sends locale via both x-aha-locale header and request body");

console.log("\nOK: relationship basic-analysis locale request test passed");
