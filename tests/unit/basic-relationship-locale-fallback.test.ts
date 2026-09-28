/**
 * Free relationship (Basic analysis) -- no Korean filler in English reports.
 * Run: npx tsx tests/unit/basic-relationship-locale-fallback.test.ts
 *
 * Bug: when the LLM returned only one insight/action for an axis,
 * normalizeRelationshipPerspectives padded slot two with a hard-coded Korean
 * sentence regardless of locale, and that padding was persisted in
 * result_basic -- so en-US reports showed lines like
 * "말 줄이기보다 오늘은 톤만 한 단계 낮춰서 한 문장만 던져 봐."
 */
import assert from "node:assert/strict";
import {
  RELATIONSHIP_AXIS_KEYS,
  localizeAxisFallbackLines,
  normalizeRelationshipPerspectives,
} from "../../lib/relationship/normalizeRelationshipPerspectives";

const HANGUL = /[ㄱ-힝]/;
let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`ok - ${name}`);
}
function collectStrings(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => collectStrings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => collectStrings(x, out));
  return out;
}

// LLM output with only ONE insight and ONE action per axis (what triggered the padding)
function oneLineAxis(tag: string) {
  return {
    my_line: `You ${tag}.`,
    partner_line: `Your partner ${tag}.`,
    insights: [`Insight for ${tag}.`],
    actions: [`Action for ${tag}.`],
  };
}
function sparseSlice() {
  return Object.fromEntries(RELATIONSHIP_AXIS_KEYS.map((k) => [k, oneLineAxis(k)]));
}
const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
const parsed = { perspectives: { [A]: sparseSlice(), [B]: sparseSlice() } };

// 1. New English report: every axis still gets 2 insights + 2 actions, zero Hangul
const en = normalizeRelationshipPerspectives(parsed, A, B, "Sera", "Partner", "en-US");
assert.ok(en);
for (const id of [A, B]) {
  const slice = en.perspectives[id] as Record<string, { insights: string[]; actions: string[] }>;
  for (const k of RELATIONSHIP_AXIS_KEYS) {
    assert.equal(slice[k].insights.length, 2);
    assert.equal(slice[k].actions.length, 2);
    assert.equal(slice[k].insights[0], `Insight for ${k}.`, "LLM line kept in slot 1");
  }
}
const enHangul = collectStrings(en).filter((s) => HANGUL.test(s));
assert.deepEqual(enHangul, [], `Korean leaked into en-US: ${enHangul.join(" | ")}`);
ok("en-US basic report: padded lines are English, no Hangul anywhere");

// 2. Korean report keeps today's Korean fillers (no behavior change for KR)
const ko = normalizeRelationshipPerspectives(parsed, A, B, "세라", "상대", "ko-KR");
const koSlice = ko!.perspectives[A] as Record<string, { insights: string[] }>;
assert.equal(koSlice.emotional_sensitivity.insights[1], "말 줄이기보다 오늘은 톤만 한 단계 낮춰서 한 문장만 던져 봐.");
ok("ko-KR basic report: Korean fillers unchanged");

// 3. Omitted locale (any other caller) keeps the previous Korean default
const legacy = normalizeRelationshipPerspectives(parsed, A, B, "세라", "상대");
assert.deepEqual(legacy, ko);
ok("no locale argument = previous behavior (backward compatible)");

// 4. Already-stored en-US report with persisted Korean filler (the reported screen)
const stored = {
  emotional_sensitivity: {
    my_line: "You're the kind of person who stays calm in stressful situations.",
    partner_line: "Your partner tends to react emotionally in high-pressure moments.",
    insights: [
      "You're the kind of person who stays calm in stressful situations. But your partner tends to react emotionally in high-pressure moments.",
      "말 줄이기보다 오늘은 톤만 한 단계 낮춰서 한 문장만 던져 봐.",
    ],
    actions: [
      "When you feel calm, check in with your partner's emotions.",
      "문자 한 통은 이모지 없이 짧게, 사실 위주로만 보내 봐.",
    ],
  },
  communication_style: {
    my_line: "x", partner_line: "y",
    insights: ["LLM line", "답하기 전에 ‘지금 들은 말 한 줄로만 말해주면?’ 한 번만 물어봐."],
    actions: ["LLM line", "긴 얘기 전엔 ‘요점만 말해줄게’ 한마디로 프레임만 맞춰 봐."],
  },
  conflict_response: {
    my_line: "x", partner_line: "y",
    insights: ["LLM line", "말이 거칠어지기 전에 ‘잠깐만’이라고 먼저 붙이고 숨 고르기로 약속해 봐."],
    actions: ["LLM line", "방에서 나올 땐 문 잠그지 말고 호흡부터 맞추기로 해 봐."],
  },
  energy_pattern: {
    my_line: "x", partner_line: "y",
    insights: ["LLM line", "오늘 만남 끝날 때 다음 약속은 ‘짧게’ 혹은 ‘널널하게’ 둘 중 하나로만 잡아 봐."],
    actions: ["LLM line", "만나기 전에 ‘오늘은 가볍게’ 혹은 ‘오늘은 같이 풀자’ 모드 한 가지만 맞춰 봐."],
  },
};
const shown = localizeAxisFallbackLines(stored, "en-US")!;
const shownHangul = collectStrings(shown).filter((s) => HANGUL.test(s));
assert.deepEqual(shownHangul, [], `stored Korean filler still shown: ${shownHangul.join(" | ")}`);
const es = shown.emotional_sensitivity as { insights: string[]; actions: string[] };
assert.equal(es.insights[0], stored.emotional_sensitivity.insights[0], "LLM-written line untouched");
assert.equal(es.insights[1], "Instead of saying less today, try lowering your tone one notch and say just one sentence.");
assert.equal(es.actions[1], "Send one text that's short and factual, with no emojis.");
assert.match(stored.emotional_sensitivity.insights[1], HANGUL, "input not mutated");
ok("already-stored en-US report (the reported screen) displays with no Hangul");

// 5. Genuine Korean content in a KR view is never altered
const koShown = localizeAxisFallbackLines(stored, "ko-KR")!;
assert.deepEqual(koShown, stored);
ok("ko-KR view of stored data is unchanged");

// 6. Reverse case: English filler shown to a ko-KR viewer becomes Korean
const enFillerStored = localizeAxisFallbackLines(stored, "en-US")!;
const backToKo = localizeAxisFallbackLines(enFillerStored, "ko-KR")!;
assert.equal(
  (backToKo.emotional_sensitivity as { insights: string[] }).insights[1],
  "말 줄이기보다 오늘은 톤만 한 단계 낮춰서 한 문장만 던져 봐.",
);
ok("filler lines follow the viewer's locale in both directions");

assert.equal(localizeAxisFallbackLines(null, "en-US"), null);
ok("null slice passes through");

console.log(`\nbasic-relationship-locale-fallback: ${passed} passed`);
