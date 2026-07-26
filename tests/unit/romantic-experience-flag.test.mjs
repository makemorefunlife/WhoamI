/**
 * Romantic Experience V2 flag (Batch B0).
 * Run: npx tsx tests/unit/romantic-experience-flag.test.mjs
 */
import assert from "node:assert/strict";
import {
  isEnvFlagTruthy,
  isRomanticExperienceLegacyForced,
  isRomanticExperienceV2Enabled,
  resolveRomanticPremiumRenderMode,
  shouldRenderRomanticExperienceV2,
} from "../../lib/relationship/romantic/experience/romanticExperienceFlag.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

console.log("\n=== isEnvFlagTruthy ===");
assert.equal(isEnvFlagTruthy(undefined), false);
assert.equal(isEnvFlagTruthy(""), false);
assert.equal(isEnvFlagTruthy("0"), false);
assert.equal(isEnvFlagTruthy("false"), false);
assert.equal(isEnvFlagTruthy("1"), true);
assert.equal(isEnvFlagTruthy("true"), true);
assert.equal(isEnvFlagTruthy("YES"), true);
assert.equal(isEnvFlagTruthy(" on "), true);
ok("truthy parsing");

console.log("\n=== default → legacy ===");
assert.equal(isRomanticExperienceV2Enabled({}), false);
assert.equal(isRomanticExperienceLegacyForced({}), false);
assert.equal(resolveRomanticPremiumRenderMode("romantic", {}), "legacy");
assert.equal(shouldRenderRomanticExperienceV2("romantic", {}), false);
ok("unset env keeps legacy");

console.log("\n=== V2 enabled (bare + NEXT_PUBLIC_) ===");
assert.equal(
  isRomanticExperienceV2Enabled({ ROMANTIC_EXPERIENCE_V2: "1" }),
  true,
);
assert.equal(
  isRomanticExperienceV2Enabled({ NEXT_PUBLIC_ROMANTIC_EXPERIENCE_V2: "true" }),
  true,
);
assert.equal(
  resolveRomanticPremiumRenderMode("romantic", {
    ROMANTIC_EXPERIENCE_V2: "1",
  }),
  "experience",
);
ok("V2 flag enables experience mode for romantic");

console.log("\n=== LEGACY forces rollback over V2 ===");
assert.equal(
  isRomanticExperienceV2Enabled({
    ROMANTIC_EXPERIENCE_V2: "1",
    ROMANTIC_EXPERIENCE_LEGACY: "1",
  }),
  false,
);
assert.equal(
  resolveRomanticPremiumRenderMode("romantic", {
    NEXT_PUBLIC_ROMANTIC_EXPERIENCE_V2: "1",
    NEXT_PUBLIC_ROMANTIC_EXPERIENCE_LEGACY: "1",
  }),
  "legacy",
);
assert.equal(
  isRomanticExperienceLegacyForced({
    ROMANTIC_EXPERIENCE_LEGACY: "yes",
  }),
  true,
);
ok("LEGACY wins over V2");

console.log("\n=== non-romantic kinds never enter experience path ===");
for (const kind of ["work", "cohabitation", "family", "friendship", "basic"]) {
  assert.equal(
    shouldRenderRomanticExperienceV2(kind, { ROMANTIC_EXPERIENCE_V2: "1" }),
    false,
    kind,
  );
  assert.equal(
    resolveRomanticPremiumRenderMode(kind, {
      ROMANTIC_EXPERIENCE_V2: "1",
      ROMANTIC_EXPERIENCE_LEGACY: "0",
    }),
    "legacy",
    kind,
  );
}
ok("other kinds stay legacy even when V2=1");

console.log("\nAll romantic-experience-flag tests passed.");
