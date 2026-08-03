/**
 * Romantic V4 Engine Consolidation — Batch B verification.
 *
 * Proves buildPersonalRelationshipCe actually uses Personal CE's
 * relational_profile as the authoritative selector for stressResponse
 * (pressure_response) and careExpression (support_giving_style) when CE
 * resolves a directional category, and correctly falls back to the legacy
 * johu-band / signal-band selector when CE abstains ("neutral_unspecified")
 * or is mixed — which is what actually happens for the 지민/정우 fixture
 * people (both abstain on all 4 target dimensions for their real charts,
 * so this test uses synthetic relationalProfile overrides to exercise the
 * CE-authoritative branch directly, rather than relying on fixture luck).
 *
 * conflict_decompression and criticism_sensitivity are NOT wired as
 * authoritative yet (no existing text branch to map onto without new copy)
 * — this is asserted explicitly as a still-open item, not silently skipped.
 *
 * Run: npx tsx tests/unit/romantic-v4-personal-ce-alignment.test.mjs
 */
import assert from "node:assert/strict";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { buildIndividualSajuChart } from "../../lib/personCore/individualSaju/buildIndividualSajuChart.ts";
import { buildPersonalRelationshipCe } from "../../lib/relationship/romantic/prototypeV4/personalRelationshipCe.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const bundle = calculateSajuBundle({ birthDate: "1990-05-15", birthTime: "14:30" });
const chart = buildIndividualSajuChart({
  reportId: "a",
  birthDate: "1990-05-15",
  birthTime: "14:30",
  birthTimeUnknown: false,
  bundle,
});

function relationalProfile(overrides = {}) {
  const neutral = "neutral_unspecified";
  return {
    expression_style: neutral,
    recognition_need: neutral,
    decision_pace: neutral,
    resource_governance: neutral,
    solitude_autonomy: neutral,
    conflict_decompression: neutral,
    pressure_response: neutral,
    support_giving_style: neutral,
    criticism_sensitivity: neutral,
    intimacy_expression_style: neutral,
    structure_spontaneity: neutral,
    boundary_defense_strength: neutral,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
section("1) pressure_response CE-authoritative when directional");

const hotCe = buildPersonalRelationshipCe({
  personId: "a",
  name: "지민",
  chart,
  relationalProfile: relationalProfile({ pressure_response: "resolute_crisis_fighter" }),
});
assert.ok(
  hotCe.stressResponse.text.includes("스트레스가 차오르면 감정이 즉각 고조되며"),
  "resolute_crisis_fighter must select the 'hot' branch text",
);
assert.equal(hotCe.personalCeAlignment.stressResponse.ceBand, "hot");
assert.equal(hotCe.personalCeAlignment.stressResponse.ceAuthoritative, true);
ok("resolute_crisis_fighter -> hot branch, ceAuthoritative=true");

const coldCe = buildPersonalRelationshipCe({
  personId: "a",
  name: "지민",
  chart,
  relationalProfile: relationalProfile({ pressure_response: "stress_vulnerable_anchor_needed" }),
});
assert.ok(
  coldCe.stressResponse.text.includes("혼자만의 공간(동굴)으로 물러나"),
  "stress_vulnerable_anchor_needed must select the 'cold' branch text",
);
ok("stress_vulnerable_anchor_needed -> cold branch");

// ---------------------------------------------------------------------------
section("2) pressure_response falls back to legacy johu-band when CE abstains/mixed");

const abstainedCe = buildPersonalRelationshipCe({
  personId: "a",
  name: "지민",
  chart,
  relationalProfile: relationalProfile({ pressure_response: "neutral_unspecified" }),
});
const noProfileCe = buildPersonalRelationshipCe({ personId: "a", name: "지민", chart });
assert.equal(
  abstainedCe.stressResponse.text,
  noProfileCe.stressResponse.text,
  "neutral_unspecified must produce identical text to having no relationalProfile at all (legacy fallback)",
);
assert.equal(abstainedCe.personalCeAlignment.stressResponse.ceAuthoritative, false);
assert.equal(noProfileCe.personalCeAlignment, undefined, "no personalCeAlignment when no profile was passed at all");
ok("neutral_unspecified correctly falls back to legacy johu-band selector, byte-identical output");

// ---------------------------------------------------------------------------
section("3) support_giving_style CE-authoritative when directional");

const nurturingCe = buildPersonalRelationshipCe({
  personId: "a",
  name: "지민",
  chart,
  relationalProfile: relationalProfile({ support_giving_style: "nurturing_empath" }),
});
assert.ok(
  nurturingCe.careExpression.text.includes("상대의 감정선을 세심하게 살피며"),
  "nurturing_empath must select the emotional_care branch text",
);
assert.equal(nurturingCe.personalCeAlignment.careExpression.ceBand, "emotional_care");
ok("nurturing_empath -> emotional_care branch");

const troubleshooterCe = buildPersonalRelationshipCe({
  personId: "a",
  name: "지민",
  chart,
  relationalProfile: relationalProfile({ support_giving_style: "practical_troubleshooter" }),
});
assert.ok(
  troubleshooterCe.careExpression.text.includes("실질적인 배려와 든든한 행동으로"),
  "practical_troubleshooter must select the action_gift branch text",
);
ok("practical_troubleshooter -> action_gift branch");

// ---------------------------------------------------------------------------
section("4) conflict_decompression / criticism_sensitivity — exposed but NOT yet authoritative (open item)");

const openItemsCe = buildPersonalRelationshipCe({
  personId: "a",
  name: "지민",
  chart,
  relationalProfile: relationalProfile({
    conflict_decompression: "immediate_clarifier",
    criticism_sensitivity: "growth_mindset_direct",
  }),
});
assert.equal(openItemsCe.personalCeAlignment.conflictDecompressionCeCategory, "immediate_clarifier");
assert.equal(openItemsCe.personalCeAlignment.criticismSensitivityCeCategory, "growth_mindset_direct");
assert.equal(
  openItemsCe.conflictResponse.text,
  noProfileCe.conflictResponse.text,
  "conflictResponse text must be UNCHANGED regardless of conflict_decompression — not wired as authoritative yet",
);
assert.equal(
  openItemsCe.hiddenVulnerability.text,
  noProfileCe.hiddenVulnerability.text,
  "hiddenVulnerability text must be UNCHANGED regardless of criticism_sensitivity — not wired as authoritative yet",
);
ok("CE categories are captured in personalCeAlignment for future wiring, but do not yet alter rendered text (as designed)");

console.log("\nOK: romantic-v4-personal-ce-alignment tests passed");
