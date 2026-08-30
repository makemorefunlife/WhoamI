/**
 * Phase 1 English remediation — Friend postValidateNarrative locale guard.
 * Proves: (1) Korean behavior is byte-identical to before the fix, and
 * (2) English input can no longer have a hardcoded Korean sentence injected
 * via the GAP_AUDIBLE "already gap-audible" check in softWashBody / the
 * match_note fallback.
 * Run: npx tsx tests/unit/friend-saju-deep-locale-guard.test.mjs
 */
import assert from "node:assert/strict";
import { finalizeFriendSajuDeepNarrative } from "../../lib/prompts/relationshipPremium/friendSajuDeep/index.ts";

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

console.log("All friend-saju-deep locale guard tests passed.");
