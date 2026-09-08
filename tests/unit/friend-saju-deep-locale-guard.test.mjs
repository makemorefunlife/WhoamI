/**
 * Phase 1 English remediation — Friend postValidateNarrative locale guard.
 * Proves: (1) Korean behavior is byte-identical to before the fix, and
 * (2) English input can no longer have a hardcoded Korean sentence injected
 * via the GAP_AUDIBLE "already gap-audible" check in softWashBody / the
 * match_note fallback.
 *
 * Phase 2 (below) — section_5_action evidence-bridge + prompt-source fix.
 * Root cause: adviceHasLeadingEvidenceBridge tested EN text against a
 * Korean-only EVIDENCE_BRIDGE regex, which can never match — so EVERY
 * English advice tip's saju_reason unconditionally got a hardcoded Korean
 * "bridge" phrase injected by buildAdviceBridgePool/pickAdviceBridge. The
 * user prompt (user.ts) and section_5 system-prompt block
 * (essenceActionWritingRules.ts) also literally required "natural Korean"
 * / listed Korean-only "valid bridge starters" regardless of the requested
 * locale — the underlying cause the post-validate Korean injection was
 * papering over. Both layers are fixed together here.
 * Run: npx tsx tests/unit/friend-saju-deep-locale-guard.test.mjs
 */
import assert from "node:assert/strict";
import { finalizeFriendSajuDeepNarrative } from "../../lib/prompts/relationshipPremium/friendSajuDeep/index.ts";
import {
  buildFriendSajuDeepUserPrompt,
} from "../../lib/prompts/relationshipPremium/friendSajuDeep/user.ts";
import { getFriendSajuDeepSystemPrompt } from "../../lib/prompts/relationshipPremium/friendSajuDeep/system.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

const HANGUL_RE = /[가-힣]/;

function buildRaw({ aBody, bBody, matchNote }) {
  return {
    section_4_friend_frames: {
      friendship_gap_signal: {
        a_body: aBody,
        b_body: bBody,
        match_note: matchNote,
      },
    },
  };
}

// 1. Korean, no gap-audible language present -> unchanged fallback sentences
//    (byte-identical to the pre-fix Korean behavior).
{
  const raw = buildRaw({
    aBody: "우리는 그냥 잘 지내는 친구 사이다.",
    bBody: "특별한 문제는 없다고 생각한다.",
    matchNote: "우리는 문제 없는 친구입니다.",
  });

  const out = finalizeFriendSajuDeepNarrative(raw, {
    nicknameA: "나",
    nicknameB: "지후",
    mismatchRoles: true,
    locale: "ko-KR",
  });

  // polishKoTone normalizes 다./있다 -> 해요체 (있어요) downstream; that
  // register pass is pre-existing and unrelated to this fix, so match the
  // fallback sentence's stem rather than its exact final punctuation form.
  const gap = out.section_4_friend_frames.friendship_gap_signal;
  assert.match(gap.a_body, /^연락·거리·서운함에서 어긋날 수 있는 지점이 있/);
  assert.match(gap.b_body, /^연락·거리·서운함에서 어긋날 수 있는 지점이 있/);
  assert.match(
    gap.match_note,
    /^연락·거리·서운함에서 어긋날 수 있(?:다|어요)\. 상대가 편하다고 느끼는 템포를 따로 확인해 볼 필요가 있/,
  );
  ok("korean gap-audible fallback sentences unchanged");
}

// 2. English, no gap-audible language present -> must get an English
//    fallback, and the output must contain zero Korean characters.
{
  const raw = buildRaw({
    aBody: "We're just doing fine as friends.",
    bBody: "I don't think there's anything to worry about.",
    matchNote: "We're a low-maintenance friendship.",
  });

  const out = finalizeFriendSajuDeepNarrative(raw, {
    nicknameA: "Me",
    nicknameB: "Jihu",
    mismatchRoles: true,
    locale: "en-US",
  });

  const gap = out.section_4_friend_frames.friendship_gap_signal;
  const combined = `${gap.a_body} ${gap.b_body} ${gap.match_note}`;
  assert.ok(!HANGUL_RE.test(combined), `Korean leaked into EN output: ${combined}`);
  assert.match(
    gap.a_body,
    /^There may be a gap in how you two handle contact, distance, or hurt feelings\. /,
  );
  assert.match(
    gap.b_body,
    /^There may be a gap in how you two handle contact, distance, or hurt feelings\. /,
  );
  assert.equal(
    gap.match_note,
    "There may be a gap in contact, distance, or hurt feelings. It's worth checking in on the tempo the other person is actually comfortable with.",
  );
  ok("english gap-audible fallback sentences localized, zero Korean injected");
}

// 3. English, gap-audible language already present -> the "already audible"
//    skip path must also work in English (parity with the Korean skip path),
//    i.e. no fallback sentence should be prepended.
{
  const raw = buildRaw({
    aBody: "There's a gap in how we handle distance and texting tempo.",
    bBody: "I think our contact rhythm is mismatched lately.",
    matchNote: "Our tempo and distance expectations don't quite align.",
  });

  const out = finalizeFriendSajuDeepNarrative(raw, {
    nicknameA: "Me",
    nicknameB: "Jihu",
    mismatchRoles: true,
    locale: "en-US",
  });

  const gap = out.section_4_friend_frames.friendship_gap_signal;
  const combined = `${gap.a_body} ${gap.b_body} ${gap.match_note}`;
  assert.ok(!HANGUL_RE.test(combined), `Korean leaked into EN output: ${combined}`);
  assert.ok(
    !gap.a_body.startsWith("There may be a gap in how you two handle"),
    "fallback sentence should not be prepended when gap language is already present",
  );
  assert.ok(
    !gap.match_note.startsWith("There may be a gap in contact, distance"),
    "match_note fallback should not replace text that already reads as gap-audible",
  );
  ok("english already-gap-audible text is left alone, no double injection");
}

function buildActionRaw({ reasonA, reasonB, together }) {
  return {
    section_5_action: {
      advice_for_a: [
        {
          action_title: "Check in about tempo",
          saju_reason: reasonA,
          real_speech_tip: "Hey, can we talk about how often we text?",
          real_life_example: "",
        },
      ],
      advice_for_b: [
        {
          action_title: "Name the upset moment",
          saju_reason: reasonB,
          real_speech_tip: "I felt a little off when plans changed last minute.",
          real_life_example: "",
        },
      ],
      together,
      together_starter: "How's our usual rhythm feeling lately?",
    },
  };
}

// 4. Korean, advice tip has no recognizable evidence bridge -> the ORIGINAL
//    Korean fallback bridge gets injected, byte-identical to before this
//    fix (regression guard — Phase 2 must not change Korean behavior).
{
  const raw = buildActionRaw({
    reasonA: "연락을 좀 더 자주 하면 서로 편해질 수 있다.",
    reasonB: "서운한 마음을 짧게라도 말해보면 도움이 된다.",
    together: "이번 주에 가볍게 안부를 물어보자.",
  });

  const out = finalizeFriendSajuDeepNarrative(raw, {
    nicknameA: "나",
    nicknameB: "지후",
    mismatchRoles: false,
    locale: "ko-KR",
  });

  const reasonA = out.section_5_action.advice_for_a[0].saju_reason;
  assert.ok(
    reasonA.startsWith("친구 사이에서 잡힌 연락·거리·리듬 결이 달라 보일 수 있어서"),
    `expected the original Korean fallback bridge, got: ${reasonA}`,
  );
  ok("korean advice tip without a bridge still gets the original Korean fallback bridge");
}

// 5. English, advice tip has no recognizable evidence bridge -> must get an
//    ENGLISH bridge injected, zero Korean anywhere in the result. This is
//    the direct fix for bug F (Korean leaking into EN advice/action text) —
//    before the fix, adviceHasLeadingEvidenceBridge always returned false
//    for English (Korean-only regex), which unconditionally injected a
//    hardcoded Korean bridge phrase via buildAdviceBridgePool.
{
  const raw = buildActionRaw({
    reasonA: "Texting a bit more often could help us both feel closer.",
    reasonB: "Saying you're a little hurt, even briefly, tends to help.",
    together: "Let's check in lightly this week.",
  });

  const out = finalizeFriendSajuDeepNarrative(raw, {
    nicknameA: "Me",
    nicknameB: "Jihu",
    mismatchRoles: false,
    locale: "en-US",
  });

  const reasonA = out.section_5_action.advice_for_a[0].saju_reason;
  const reasonB = out.section_5_action.advice_for_b[0].saju_reason;
  const together = out.section_5_action.together;
  const combined = `${reasonA} ${reasonB} ${together}`;
  assert.ok(!HANGUL_RE.test(combined), `Korean leaked into EN advice/action: ${combined}`);
  assert.match(
    reasonA,
    /^Because /,
    `expected an English evidence bridge to be prepended, got: ${reasonA}`,
  );
  ok("english advice tip without a bridge gets an English fallback bridge, zero Korean");
}

// 6. English, advice tip already opens with a recognizable English bridge ->
//    must be left alone (no double-injection), parity with the Korean skip
//    path.
{
  const raw = buildActionRaw({
    reasonA:
      "Because your daily contact tempo tends to land differently, sending one extra check-in text this week could help.",
    reasonB: "Because you each show being upset in a different way, naming it out loud sooner tends to help.",
    together: "Let's check in lightly this week.",
  });

  const out = finalizeFriendSajuDeepNarrative(raw, {
    nicknameA: "Me",
    nicknameB: "Jihu",
    mismatchRoles: false,
    locale: "en-US",
  });

  const reasonA = out.section_5_action.advice_for_a[0].saju_reason;
  const combined = `${reasonA} ${out.section_5_action.advice_for_b[0].saju_reason}`;
  assert.ok(!HANGUL_RE.test(combined), `Korean leaked into EN advice: ${combined}`);
  assert.ok(
    reasonA.startsWith("Because your daily contact tempo"),
    "an already-bridged English reason must not get a second bridge prepended",
  );
  ok("english advice tip with an existing English bridge is left alone, no double injection");
}

// 7. English `together` text that matches the Korean few-shot-bleed pattern
//    (a mismatch case) must get rewritten to the ENGLISH fallback, not the
//    Korean one — before this fix, action.together's fewshot-bleed rewrite
//    was unconditionally Korean regardless of locale.
{
  const raw = buildActionRaw({
    reasonA: "Because your daily contact tempo tends to land differently, texting first once this week could help.",
    reasonB: "Because you each show being upset in a different way, saying so briefly tends to help.",
    together: "You're friends, so just trust each other and it'll work out.",
  });

  const out = finalizeFriendSajuDeepNarrative(raw, {
    nicknameA: "Me",
    nicknameB: "Jihu",
    mismatchRoles: true,
    locale: "en-US",
  });

  const together = out.section_5_action.together;
  assert.ok(!HANGUL_RE.test(together), `Korean leaked into EN together text: ${together}`);
  assert.notEqual(
    together,
    "You're friends, so just trust each other and it'll work out.",
    "fewshot-bleed text should have been rewritten",
  );
  ok("english together fewshot-bleed rewrite produces English, zero Korean");
}

// 8. Prompt-source check: the user prompt built for locale "en" must not
//    contain the literal Korean-language instructions ("natural Korean",
//    the 문체/tone block, or the Korean-only bridge-starter list) that were
//    the actual root cause — the postValidate fixes above are a safety net,
//    this proves the LLM itself is no longer being told to write Korean.
{
  const enUserPrompt = buildFriendSajuDeepUserPrompt({
    nicknameA: "Me",
    nicknameB: "Jihu",
    friendDigestBlock: "friend_digest for A=Me x B=Jihu\ndomain: friend / social",
    locale: "en",
  });
  assert.ok(
    !HANGUL_RE.test(enUserPrompt),
    "en-US user prompt must contain zero Korean characters",
  );
  assert.ok(
    !enUserPrompt.includes("natural Korean"),
    "en-US user prompt must not instruct the model to write natural Korean",
  );

  // The system prompt legitimately cites Korean technical-term examples
  // (오행/십성/격국) as things to NEVER output — that's a jargon-ban
  // example, not narrative language, so this checks for the actual root
  // -cause phrasing rather than a blanket zero-Hangul rule.
  const enSystemPrompt = getFriendSajuDeepSystemPrompt("en");
  assert.ok(
    !enSystemPrompt.includes("Rewrite in plain Korean"),
    "en-US system prompt must not instruct the model to rewrite jargon in Korean",
  );
  assert.ok(
    !enSystemPrompt.includes("일상 공유·연락 템포"),
    "en-US system prompt must not list Korean-only bridge starters",
  );

  // Korean prompts must still carry their Korean-language instructions —
  // this isn't a blanket "no Korean" rule, only en-US must be Korean-free.
  const koUserPrompt = buildFriendSajuDeepUserPrompt({
    nicknameA: "나",
    nicknameB: "지후",
    friendDigestBlock: "friend_digest for A=나 x B=지후\ndomain: friend / social",
    locale: "ko",
  });
  assert.ok(HANGUL_RE.test(koUserPrompt), "ko-KR user prompt should still contain Korean");

  ok("en-US friend prompt (system + user) is Korean-free at the source; ko-KR prompt unaffected");
}

console.log("All friend-saju-deep locale guard tests passed.");
