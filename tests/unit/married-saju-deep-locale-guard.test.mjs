/**
 * Phase 1 English remediation — Married postValidateNarrative low-confidence
 * hedge locale guard. Proves: (1) Korean hedge behavior is unchanged, and
 * (2) English low-confidence comparison_table cells now get an equivalent
 * natural English hedge instead of full-confidence-only English + hedged-only
 * Korean (the old `!isEn`-gated bug), with confidence/tier logic untouched.
 * Run: npx tsx tests/unit/married-saju-deep-locale-guard.test.mjs
 */
import assert from "node:assert/strict";
import { finalizeMarriedSajuDeepNarrative } from "../../lib/prompts/relationshipPremium/marriedSajuDeep/index.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

const HANGUL_RE = /[가-힣]/;

const LOW_CONF_LEANS = {
  marital_conflict: {
    band_a: "explosive",
    band_b: "stonewall",
    confidence: "low",
    align: "caution",
  },
};

// 1. Korean, low-confidence aspect -> hedge sentence appended (unchanged
//    from pre-fix behavior; the !isEn gate never blocked Korean).
{
  const raw = {
    section_2_nature: {
      comparison_table: [
        { aspect: "부부 갈등", a: "폭발적으로 반응한다.", b: "침묵으로 피한다." },
      ],
    },
  };

  const out = finalizeMarriedSajuDeepNarrative(raw, {
    nicknameA: "나",
    nicknameB: "지후",
    comparisonLeans: LOW_CONF_LEANS,
    locale: "ko-KR",
  });

  const row = out.section_2_nature.comparison_table[0];
  assert.match(row.a, /상황에 따라 다르게 나타날 수 있/);
  assert.match(row.b, /상황에 따라 다르게 나타날 수 있/);
  ok("korean low-confidence hedge unchanged");
}

// 2. English, low-confidence aspect -> must get an equivalent English hedge,
//    and zero Korean characters anywhere in the row.
{
  const raw = {
    section_2_nature: {
      comparison_table: [
        {
          aspect: "Conflict-reaction style",
          a: "Reacts explosively.",
          b: "Shuts down and goes silent.",
        },
      ],
    },
  };

  const out = finalizeMarriedSajuDeepNarrative(raw, {
    nicknameA: "Me",
    nicknameB: "Jihu",
    comparisonLeans: LOW_CONF_LEANS,
    locale: "en-US",
  });

  const row = out.section_2_nature.comparison_table[0];
  const combined = `${row.a} ${row.b}`;
  assert.ok(!HANGUL_RE.test(combined), `Korean leaked into EN output: ${combined}`);
  assert.match(row.a, /This may show up differently depending on the situation\.$/);
  assert.match(row.b, /This may show up differently depending on the situation\.$/);
  ok("english low-confidence hedge localized, zero Korean injected");
}

// 3. English, high-confidence aspect -> hedge must NOT fire (confidence
//    logic untouched by the locale fix).
{
  const raw = {
    section_2_nature: {
      comparison_table: [
        {
          aspect: "Conflict-reaction style",
          a: "Reacts explosively.",
          b: "Shuts down and goes silent.",
        },
      ],
    },
  };

  const out = finalizeMarriedSajuDeepNarrative(raw, {
    nicknameA: "Me",
    nicknameB: "Jihu",
    comparisonLeans: {
      marital_conflict: { band_a: "explosive", band_b: "stonewall", confidence: "high" },
    },
    locale: "en-US",
  });

  const row = out.section_2_nature.comparison_table[0];
  assert.ok(
    !row.a.includes("may show up differently"),
    "hedge should not fire for a high-confidence lean",
  );
  assert.ok(
    !row.b.includes("may show up differently"),
    "hedge should not fire for a high-confidence lean",
  );
  ok("english high-confidence aspect is left un-hedged (confidence logic preserved)");
}

// 4. English text that already reads as tentative -> no double hedge
//    appended (parity with the Korean TENTATIVE_MARKER skip path).
{
  const raw = {
    section_2_nature: {
      comparison_table: [
        {
          aspect: "Conflict-reaction style",
          a: "Tends to react explosively, though this can vary.",
          b: "Shuts down and goes silent.",
        },
      ],
    },
  };

  const out = finalizeMarriedSajuDeepNarrative(raw, {
    nicknameA: "Me",
    nicknameB: "Jihu",
    comparisonLeans: LOW_CONF_LEANS,
    locale: "en-US",
  });

  const row = out.section_2_nature.comparison_table[0];
  assert.equal(
    (row.a.match(/This may show up differently depending on the situation\./g) || []).length,
    0,
    "already-tentative English text should not get a second hedge sentence appended",
  );
  ok("english already-tentative text is left alone, no double hedge");
}

console.log("All married-saju-deep locale guard tests passed.");
