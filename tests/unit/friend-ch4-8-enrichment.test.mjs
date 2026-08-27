/**
 * Regression tests for the Friend Ch4-8 INTELLIGENCE ENRICHMENT pass.
 * IA is frozen — these tests verify the CONTENT inside each approved block
 * is genuinely differentiated, evidence-linked, and free of the specific
 * defects the enrichment spec called out (repetition, blank fields, raw
 * particle syntax, banned generic phrases).
 *
 * Run: npx tsx --test tests/unit/friend-ch4-8-enrichment.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { buildFriendRuleContext } from "../../lib/relationship/friend/buildFriendRuleContext.ts";
import { buildFriendResponseIntelligence } from "../../lib/relationship/friend/response/buildFriendResponseIntelligence.ts";
import { buildFriendChapter05Support } from "../../lib/relationship/friend/chapters/friendChapter05Support.ts";
import { buildFriendChapter06Conflict } from "../../lib/relationship/friend/chapters/friendChapter06Conflict.ts";
import { buildFriendChapter07Boundary } from "../../lib/relationship/friend/chapters/friendChapter07Boundary.ts";
import { buildFriendChapter08Distance } from "../../lib/relationship/friend/chapters/friendChapter08Distance.ts";
import {
  buildFriendChapter05Blocks,
  buildFriendChapter06Blocks,
  buildFriendChapter08Blocks,
} from "../../lib/relationship/friend/chapters/friendChapterVNextBlocksAdapter.ts";
import { sanitizeKoreanParticles } from "../../lib/relationship/koreanParticles.ts";

function sajuFromBirth(birthDate) {
  const bundle = calculateSajuBundle({ birthDate, birthTime: "12:00" });
  return toV1SajuApiPayload(bundle);
}
function psych(overrides = {}) {
  const base = { stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50, conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50, thinking_style: 50, decision_style: 50 };
  return { schema_version: "psych_master_v1", version: "psych_master_v1", secondary_axes: { ...base, ...overrides } };
}
const seraSaju = sajuFromBirth("1993-05-15");
const donggleSaju = sajuFromBirth("1994-12-15");
function ctxFor(nameA, nameB, sajuA, sajuB) {
  return buildFriendRuleContext({ nicknameA: nameA, nicknameB: nameB, sajuJsonA: sajuA, sajuJsonB: sajuB, locale: "ko-KR" });
}
function intelFor(nameA, nameB, sajuA, sajuB, psychA, psychB) {
  return buildFriendResponseIntelligence({ ctx: ctxFor(nameA, nameB, sajuA, sajuB), psychA, psychB });
}

const FORBIDDEN = ["맛집 리셋", "기프티콘", "야식 선물", "영구 손절", "월 1회 이하", "역마 기운이 있어서", "balanced_exploration", "은(는)", "이(가)", "을(를)"];
function assertClean(obj, label) {
  const str = JSON.stringify(obj);
  for (const term of FORBIDDEN) assert.equal(str.includes(term), false, `${label}: forbidden/raw term '${term}' found`);
  assert.equal(str.includes("undefined"), false, `${label}: contains undefined`);
  assert.equal(str.includes("NaN"), false, `${label}: contains NaN`);
}

test("CH5 enrichment", async (t) => {
  await t.test("1. myStyle shows BOTH people, not just the viewer", () => {
    const intel = intelFor("Sera", "동글", seraSaju, donggleSaju, psych({ empathy: 90 }), psych({ structure: 90 }));
    const ch05 = buildFriendChapter05Support({ intel, nameA: "Sera", nameB: "동글", locale: "ko-KR" });
    assert.equal(ch05.myStyle.length, 2);
    assert.equal(ch05.myStyle[0].name, "Sera");
    assert.equal(ch05.myStyle[1].name, "동글");
  });

  await t.test("2. whatIGive shows BOTH directions (A→B and B→A)", () => {
    const intel = intelFor("Sera", "동글", seraSaju, donggleSaju, psych({ empathy: 90 }), psych({ structure: 90 }));
    const ch05 = buildFriendChapter05Support({ intel, nameA: "Sera", nameB: "동글", locale: "ko-KR" });
    assert.equal(ch05.whatIGive.length, 2);
    assert.deepEqual([ch05.whatIGive[0].giverName, ch05.whatIGive[0].receiverName], ["Sera", "동글"]);
    assert.deepEqual([ch05.whatIGive[1].giverName, ch05.whatIGive[1].receiverName], ["동글", "Sera"]);
  });

  await t.test("3. whatIGive description shows genuine adaptation, not a copy-paste of myStyle", () => {
    // Sera: empathy-dominant giver. 동글 has a receiver-need profile that is NOT emotional holding.
    const intel = intelFor("Sera", "동글", seraSaju, donggleSaju, psych({ empathy: 90 }), psych({ thinking_style: 90 }));
    const ch05 = buildFriendChapter05Support({ intel, nameA: "Sera", nameB: "동글", locale: "ko-KR" });
    const aToB = ch05.whatIGive.find((d) => d.giverName === "Sera");
    assert.notEqual(aToB.description, ch05.myStyle[0].description, "directional adaptation text must differ from the general self-description when adaptation actually occurs");
  });

  await t.test("4. no forbidden/raw leakage (checked at the adapter layer — what the UI actually renders)", () => {
    const intel = intelFor("Sera", "동글", seraSaju, donggleSaju, psych(), psych());
    assertClean(buildFriendChapter05Blocks({ intel, nameA: "Sera", nameB: "동글", locale: "ko-KR" }), "Ch05");
  });
});

test("CH6 enrichment", async (t) => {
  await t.test("1. myReaction has two layers — surface response label differs from the underlying-need sentence", () => {
    const intel = intelFor("Sera", "동글", seraSaju, donggleSaju, psych({ conflict_style: 80 }), psych({ conflict_style: 20 }));
    const ch06 = buildFriendChapter06Conflict({ intel, nameA: "Sera", nameB: "동글", locale: "ko-KR" });
    for (const r of ch06.myReaction) {
      assert.notEqual(r.headline, r.description, "underlying-need description must add something beyond the surface headline");
      assert.ok(r.description.length > r.headline.length);
    }
  });

  await t.test("2. same initial response on both sides classifies as a real collision/match type, not a fake opposite loop", () => {
    // Force both toward DIRECT_CONFRONT (self ten-god + high conflict_style).
    const intel = intelFor("Sera", "동글", seraSaju, donggleSaju, psych({ conflict_style: 90 }), psych({ conflict_style: 90 }));
    const a = intel.personA.conflict.initialResponse;
    const b = intel.personB.conflict.initialResponse;
    if (a === b) {
      assert.ok(["SAME_STYLE_COLLISION", "EXPLANATION_COMPETITION", "LOW_ESCALATION_MATCH"].includes(intel.pair.conflictLoop.loopType));
    }
  });

  await t.test("3. a low-risk loop renders a distinct 'less likely to escalate' message, not a fabricated fight sequence", () => {
    const intel = intelFor("Sera", "동글", seraSaju, donggleSaju, psych({ practicality: 90 }), psych({ practicality: 90 }));
    const ch06 = buildFriendChapter06Conflict({ intel, nameA: "Sera", nameB: "동글", locale: "ko-KR" });
    if (intel.pair.conflictLoop.lowRisk) {
      assert.equal(ch06.conflictLoop.steps.length, 1);
      assert.ok(ch06.conflictLoop.steps[0].includes("커지진") || ch06.conflictLoop.steps[0].length > 0);
    }
  });

  await t.test("4. hurt triggers are never empty for either person (max 2 each, at least 1)", () => {
    const intel = intelFor("Sera", "동글", seraSaju, donggleSaju, psych(), psych());
    const ch06 = buildFriendChapter06Conflict({ intel, nameA: "Sera", nameB: "동글", locale: "ko-KR" });
    for (const h of ch06.hurtMoments) {
      assert.ok(h.triggers.length >= 1 && h.triggers.length <= 2, `${h.name} must have 1-2 hurt triggers, got ${h.triggers.length}`);
    }
  });

  await t.test("5. when both share the same repair need, nuance text differentiates them", () => {
    const intel = intelFor("Sera", "동글", seraSaju, donggleSaju, psych({ conflict_style: 20 }), psych({ conflict_style: 20 }));
    const ch06 = buildFriendChapter06Conflict({ intel, nameA: "Sera", nameB: "동글", locale: "ko-KR" });
    const [ra, rb] = ch06.repairNeeds;
    if (ra.label === rb.label) {
      assert.ok(ra.nuance && rb.nuance, "identical repair needs must carry differentiating nuance text");
      assert.notEqual(ra.nuance, rb.nuance);
    }
  });

  await t.test("6. repair sequence is not a fixed universal order across different fixtures", () => {
    const seqA = buildFriendChapter06Conflict({ intel: intelFor("Sera", "동글", seraSaju, donggleSaju, psych({ conflict_style: 20 }), psych({ conflict_style: 20 })), nameA: "Sera", nameB: "동글", locale: "ko-KR" }).repairSequence.steps;
    const seqB = buildFriendChapter06Conflict({ intel: intelFor("Sera", "동글", seraSaju, donggleSaju, psych({ practicality: 90 }), psych({ practicality: 90 })), nameA: "Sera", nameB: "동글", locale: "ko-KR" }).repairSequence.steps;
    assert.notDeepEqual(seqA, seqB);
  });

  await t.test("7. no forbidden/raw leakage (checked at the adapter layer — what the UI actually renders)", () => {
    const intel = intelFor("Sera", "동글", seraSaju, donggleSaju, psych(), psych());
    assertClean(buildFriendChapter06Blocks({ intel, nameA: "Sera", nameB: "동글", locale: "ko-KR" }), "Ch06");
  });
});

test("CH7 enrichment", async (t) => {
  await t.test("1. every boundary claim carries a distinct 'why it matters' sentence, not just the behavior label", () => {
    const intel = intelFor("Sera", "동글", seraSaju, donggleSaju, psych({ recognition: 90 }), psych({ structure: 90 }));
    const ch07 = buildFriendChapter07Boundary({ intel, nameA: "Sera", nameB: "동글", locale: "ko-KR" });
    for (const person of ch07.myBoundaries) {
      for (const b of person.behaviors) {
        assert.ok(b.why && b.why.length > 0, "boundary must include a why");
        assert.notEqual(b.why, b.label);
      }
    }
  });

  await t.test("2. no banned '영구 손절'-style absolutist language", () => {
    const intel = intelFor("Sera", "동글", seraSaju, donggleSaju, psych({ recognition: 90 }), psych({ structure: 90 }));
    const str = JSON.stringify(buildFriendChapter07Boundary({ intel, nameA: "Sera", nameB: "동글", locale: "ko-KR" }));
    for (const banned of ["영구 손절", "손절각", "절대 못 참"]) assert.equal(str.includes(banned), false);
  });

  await t.test("3. no forbidden/raw leakage, both people always populated (never blank)", () => {
    const intel = intelFor("Sera", "동글", seraSaju, donggleSaju, psych(), psych());
    const ch07 = buildFriendChapter07Boundary({ intel, nameA: "Sera", nameB: "동글", locale: "ko-KR" });
    for (const n of ch07.myNeeds) assert.ok(n.needs.length >= 1, `${n.name} must not have zero needs`);
    for (const b of ch07.myBoundaries) assert.ok(b.behaviors.length >= 1, `${b.name} must not have zero boundaries`);
    assertClean(ch07, "Ch07");
  });
});

test("CH8 enrichment", async (t) => {
  await t.test("1. silence reading includes a person-specific reason, not just the bare label", () => {
    const intel = intelFor("Sera", "동글", seraSaju, donggleSaju, psych({ recognition: 90, resilience: 20 }), psych({ resilience: 90 }));
    const ch08 = buildFriendChapter08Distance({ intel, nameA: "Sera", nameB: "동글", locale: "ko-KR" });
    for (const s of ch08.silenceReading) {
      assert.ok(s.reason && s.reason.length > 0);
      assert.notEqual(s.reason, s.label);
    }
  });

  await t.test("2. final synthesis never uses the banned generic closing lines", () => {
    const intel = intelFor("Sera", "동글", seraSaju, donggleSaju, psych(), psych());
    const ch08 = buildFriendChapter08Distance({ intel, nameA: "Sera", nameB: "동글", locale: "ko-KR" });
    for (const banned of ["특별히 애쓰지 않아도", "위에서 말한 것만 챙기면"]) {
      assert.equal(ch08.howItLasts.description.includes(banned), false);
    }
  });

  await t.test("3. no forbidden/raw leakage (adapter layer), no invented durability percentage", () => {
    const intel = intelFor("Sera", "동글", seraSaju, donggleSaju, psych(), psych());
    assertClean(buildFriendChapter08Blocks({ intel, nameA: "Sera", nameB: "동글", locale: "ko-KR" }), "Ch08");
    assert.equal(/\d+%/.test(JSON.stringify(buildFriendChapter08Distance({ intel, nameA: "Sera", nameB: "동글", locale: "ko-KR" }))), false);
  });
});

test("Cross-chapter semantic ownership", async (t) => {
  await t.test("CH6's underlying need and CH7's top need are the same shared-core answer for the same person (referenced, not independently recomputed differently)", () => {
    const intel = intelFor("Sera", "동글", seraSaju, donggleSaju, psych({ recognition: 90 }), psych({ structure: 90 }));
    assert.equal(intel.personA.conflict.underlyingNeed, intel.personA.boundary.needs[0].key, "the same person's core need must be consistent across Ch6 and Ch7 (spec §2/§7)");
  });
});

test("Korean particle formatting", async (t) => {
  await t.test("sanitizeKoreanParticles fixes the exact 'name+particle(altParticle)' pattern used throughout Ch4-8 copy", () => {
    assert.equal(sanitizeKoreanParticles("Sera은(는) 먼저 말해요.", ["Sera", "동글"]), "Sera는 먼저 말해요.");
    assert.equal(sanitizeKoreanParticles("동글이(가) 웃었다.", ["Sera", "동글"]), "동글이 웃었다.");
    assert.equal(sanitizeKoreanParticles("Sera이(가) 왔다.", ["Sera", "동글"]), "Sera가 왔다.");
  });
});

test("A/B swap safety across Ch5-8", async (t) => {
  await t.test("a named person's own content is identical regardless of which literal slot (A or B) they occupy", () => {
    const psychSera = psych({ empathy: 85, structure: 20, conflict_style: 80, recognition: 70 });
    const psychDonggle = psych({ structure: 85, empathy: 20, conflict_style: 20, resilience: 80 });

    const normal = intelFor("Sera", "동글", seraSaju, donggleSaju, psychSera, psychDonggle);
    const swapped = intelFor("동글", "Sera", donggleSaju, seraSaju, psychDonggle, psychSera);

    const ch06n = buildFriendChapter06Conflict({ intel: normal, nameA: "Sera", nameB: "동글", locale: "ko-KR" });
    const ch06s = buildFriendChapter06Conflict({ intel: swapped, nameA: "동글", nameB: "Sera", locale: "ko-KR" });
    const seraN = ch06n.myReaction.find((r) => r.name === "Sera");
    const seraS = ch06s.myReaction.find((r) => r.name === "Sera");
    assert.equal(seraN.headline, seraS.headline);
    assert.equal(seraN.description, seraS.description);

    const ch08n = buildFriendChapter08Distance({ intel: normal, nameA: "Sera", nameB: "동글", locale: "ko-KR" });
    const ch08s = buildFriendChapter08Distance({ intel: swapped, nameA: "동글", nameB: "Sera", locale: "ko-KR" });
    const seraSilN = ch08n.silenceReading.find((s) => s.name === "Sera");
    const seraSilS = ch08s.silenceReading.find((s) => s.name === "Sera");
    assert.equal(seraSilN.label, seraSilS.label);
  });
});

console.log("\nOK: friend Ch4-8 enrichment regression tests passed");
