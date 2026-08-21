/**
 * Personal Premium Cache + Legacy Tone Corrective Batch.
 *
 * Scope (per the Post-Batch-5 production output audit): NOT a redesign, NOT
 * broad prompt tuning. Three narrow fixes:
 *
 *  1. Invalidate pre-Batch-5 Personal generations:
 *     - PERSONAL_V2_STRUCTURED_GENERATION_VERSION bumped 1 -> 2 (server DB
 *       reuse gate, app/api/v2/deep/essence/route.ts).
 *     - SLIM_INTEGRATED_CACHE_VERSION bumped 4 -> 5 (client localStorage key),
 *       required because useSlimV1Integrated.fetchReport() returns straight
 *       from a cache hit WITHOUT ever calling the API — a server-only bump
 *       would be invisible to any browser holding a v4-keyed entry.
 *  2. Remove legacy relationship framing: the static "깊은 연결 · 의존 주의"
 *     / "Deep · watch for deference" part3.meta strings in
 *     deepEssenceUiStrings.ts (diagnostic "dependency warning" framing,
 *     inconsistent with current Pattern-Not-People philosophy).
 *  3. Harden cleanClosingText() (lib/report/polishDeepEssenceStructured.ts)
 *     against Korean cheerleading variants the original Batch 5 regex didn't
 *     cover (응원해요/응원할게요/응원하겠습니다), without damaging legitimate
 *     present-tense recognition prose.
 *
 * Run: npx tsx --test tests/unit/personal-premium-cache-legacy-tone-corrective-batch.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import {
  PERSONAL_V2_STRUCTURED_GENERATION_VERSION,
} from "../../lib/v1/slim/types.ts";
import { SLIM_INTEGRATED_CACHE_VERSION } from "../../lib/v1/slim/slimIntegratedCache.ts";
import { polishDeepEssenceStructuredReport } from "../../lib/report/polishDeepEssenceStructured.ts";
import { isDeepEssenceStructuredReport } from "../../lib/report/deepEssenceStructuredSchema.ts";

// ── 1a. Server-side generation-version gate: v1 stale, v2 (current) reusable ──

describe("Verification 1 & 2 — generation version 1 is stale, current version 2 is reusable", () => {
  function generationIsCurrent(storedVersion) {
    const stored = storedVersion ?? 0;
    return stored >= PERSONAL_V2_STRUCTURED_GENERATION_VERSION;
  }

  it("PERSONAL_V2_STRUCTURED_GENERATION_VERSION is now 9 (Batch 7 bump)", () => {
    assert.equal(PERSONAL_V2_STRUCTURED_GENERATION_VERSION, 9);
  });

  it("a stored row stamped with an old version (1..8) is treated as stale against the new gate", () => {
    assert.equal(generationIsCurrent(1), false);
    assert.equal(generationIsCurrent(2), false);
    assert.equal(generationIsCurrent(3), false);
    assert.equal(generationIsCurrent(4), false);
    assert.equal(generationIsCurrent(5), false);
    assert.equal(generationIsCurrent(6), false);
    assert.equal(generationIsCurrent(7), false);
    assert.equal(generationIsCurrent(8), false);
  });

  it("a stored row stamped with the current version (9) is treated as reusable", () => {
    assert.equal(generationIsCurrent(9), true);
  });

  it("an unstamped legacy row (undefined) is treated as stale", () => {
    assert.equal(generationIsCurrent(undefined), false);
  });
});

// ── 3. Client-side localStorage cache invalidation ─────────────────────────

describe("Verification 3 — local browser cache invalidation", () => {
  it("SLIM_INTEGRATED_CACHE_VERSION was bumped to 12 (Batch 7 bump)", () => {
    assert.equal(SLIM_INTEGRATED_CACHE_VERSION, 12);
  });

  it("the storage key embeds the new version, so a v11-keyed browser entry cannot be read as a hit", () => {
    const cacheSrc = fs.readFileSync("lib/v1/slim/slimIntegratedCache.ts", "utf8");
    assert.match(
      cacheSrc,
      /return `\$\{PREFIX\}v\$\{SLIM_INTEGRATED_CACHE_VERSION\}_\$\{locale\}_\$\{reportId\}`/,
      "storageKey() must interpolate the live version constant into the key",
    );
  });

  it("legacy-key cleanup now also removes the old v11 key (not just v1..v10)", () => {
    const cacheSrc = fs.readFileSync("lib/v1/slim/slimIntegratedCache.ts", "utf8");
    assert.match(cacheSrc, /\$\{PREFIX\}v11_\$\{locale\}_\$\{reportId\}/);
  });

  it("useSlimV1Integrated still returns early on a cache hit (confirms WHY the client bump was necessary, not just the server one)", () => {
    const hookSrc = fs.readFileSync("lib/v1/slim/useSlimV1Integrated.ts", "utf8");
    assert.match(
      hookSrc,
      /const cached = readSlimIntegratedCache\(reportId, locale\);\s*\n\s*if \(cached\) \{/,
      "a cache hit must still short-circuit before any network call — this is why bumping the server version alone would not have been enough",
    );
  });
});

// ── 4. Legacy relationship framing removed from static UI copy ─────────────

describe("Verification 4 — legacy '의존 주의' / 'watch for deference' UI copy is gone", () => {
  const uiSrc = fs.readFileSync("components/results/deep/deepEssenceUiStrings.ts", "utf8");

  it("the Korean diagnostic phrase '의존 주의' no longer appears anywhere in the UI strings file", () => {
    assert.doesNotMatch(uiSrc, /의존\s*주의/);
  });

  it("the English diagnostic phrase 'watch for deference' no longer appears anywhere in the UI strings file", () => {
    assert.doesNotMatch(uiSrc, /watch for deference/);
  });

  it("the KO part3.meta badge now reads non-diagnostic relational-preference framing", () => {
    assert.match(uiSrc, /meta:\s*"관계 선호 · 최적 환경"/);
  });

  it("the EN part3.meta badge now reads non-diagnostic relational-preference framing", () => {
    assert.match(uiSrc, /meta:\s*"Preference · Environment"/);
  });
});

// ── 5. cleanClosingText hardening — cheer variants removed, recognition prose intact ──

function fixtureReport(closing) {
  return {
    summary: { core_mode: "깊은 물", energy_balance: "56 / 40", growth_edge: "결단" },
    radar_potential: { autonomy: 70, connection: 80, stability: 60, growth: 75, structure: 55, adaptability: 65 },
    strengths: [
      { title: "공감", body: "상대의 기분을 잘 읽고 맞춰 주는 경향이 있다." },
      { title: "집중", body: "혼자 있는 시간에 에너지를 회복하는 편이다." },
      { title: "통찰", body: "겉으로 드러난 말보다 맥락을 먼저 본다." },
    ],
    watchouts: [
      { title: "과몰입", body: "관계에 너무 깊이 들어가면 지치기 쉽다." },
      { title: "미룸", body: "결정을 미루다 타이밍을 놓칠 수 있다." },
      { title: "자기검열", body: "속마음을 너무 오래 담아 두는 편이다." },
    ],
    energy: {
      headline: "사람에게 쓰는 에너지가 큰 편이다.",
      balance_pct: 56,
      bars: [
        { label: "관계에 쓰는 에너지", value: 56, tone: "highlight" },
        { label: "돌아오는 에너지", value: 40, tone: "accent" },
        { label: "혼자 회복", value: 70, tone: "ink" },
      ],
      summary: "관계에 마음을 많이 쓰는 흐름이다.",
      fuels: ["조용한 대화", "산책", "혼자만의 아침"],
      drains: ["갑작스러운 약속", "시끄러운 자리", "급한 결정 압박"],
      optimal: ["작은 팀", "예측 가능한 루틴"],
    },
    relationships: {
      pattern: "가까워질수록 조심스러워지는 패턴이다.",
      fit: ["천천히 다가오는 사람", "말보다 행동이 앞서는 사람", "공간을 존중하는 사람"],
      friction: ["성급한 확신", "감정의 과잉 표현", "경계 없는 친밀감"],
      compare: [
        { wound: "거절이 무섭다", steady: "거절도 대화로 본다" },
        { wound: "바로 답이 없다", steady: "생각할 시간을 준다" },
        { wound: "감정 기복", steady: "기복을 함께 읽는다" },
      ],
    },
    playbook: {
      rule: "먼저 한 박자 쉬고 말한다.",
      rows: [
        { situation: "의견이 다를 때", old: "바로 맞선다", better: "상대 요지를 한 문장으로 확인한다" },
        { situation: "서운할 때", old: "참다가 터진다", better: "작은 신호로 먼저 말한다" },
        { situation: "결정을 앞둘 때", old: "미룬다", better: "오늘 중 선택지 두 개만 적는다" },
      ],
      heated: "목소리가 커지면 10분 쿨다운.",
      reset: "물 한 잔 마시고 다시 시작한다.",
    },
    future: {
      remember: ["속도보다 리듬", "혼자 회복은 이기심이 아니다", "작은 결단이 쌓인다"],
      leap: "거절을 한 문장으로 연습한다.",
    },
    closing,
    checklist: [
      "오늘 거절 한 번 연습하기",
      "혼자 있는 30분 확보하기",
      "서운함을 작게 말하기",
      "결정 메모 두 줄",
      "수면 루틴 지키기",
      "감사 한 문장",
      "산책 15분",
      "내일의 작은 목표 하나",
    ],
  };
}

describe("Verification 5 — cleanClosingText removes cheer variants without damaging recognition prose", () => {
  it("strips a trailing '응원해요' cheer sentence", () => {
    const raw = fixtureReport(
      "지금까지 살아오며 만들어온 방식과 본래 편한 방식 중 어느 하나만이 진짜 당신인 것은 아니에요. 앞으로도 응원해요.",
    );
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.doesNotMatch(polished.closing, /응원해요/);
    assert.match(polished.closing, /진짜 당신인 것은 아니에요/);
  });

  it("strips a trailing '응원할게요' cheer sentence", () => {
    const raw = fixtureReport(
      "중요한 건 앞으로 어떤 선택에서 어느 쪽을 더 사용할지 스스로 알아볼 수 있게 되었다는 점입니다. 항상 응원할게요.",
    );
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.doesNotMatch(polished.closing, /응원할게요/);
    assert.match(polished.closing, /알아볼 수 있게 되었다는 점입니다/);
  });

  it("strips a trailing '응원하겠습니다' cheer sentence", () => {
    const raw = fixtureReport(
      "두 방식이 함께 있다는 걸 이제는 스스로 알아차릴 수 있게 되었습니다. 앞으로의 걸음을 응원하겠습니다.",
    );
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.doesNotMatch(polished.closing, /응원하겠습니다/);
    assert.match(polished.closing, /스스로 알아차릴 수 있게 되었습니다/);
  });

  it("strips a trailing '응원합니다' cheer sentence (already covered by the original Batch 5 regex — must still pass)", () => {
    const raw = fixtureReport(
      "지금 여기까지 온 것만으로도 충분히 잘 해내고 있다는 걸 스스로 알게 되었습니다. 언제나 응원합니다.",
    );
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.doesNotMatch(polished.closing, /응원합니다/);
    assert.match(polished.closing, /스스로 알게 되었습니다/);
  });

  it("strips a bare trailing '바랍니다' wishing sentence not caught by the original prefix-anchored regex", () => {
    const raw = fixtureReport(
      "두 가지 방식 모두 당신의 일부라는 걸 이제 스스로 알게 되었다는 점입니다. 좋은 하루 보내시길 바랍니다.",
    );
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.doesNotMatch(polished.closing, /바랍니다/);
    assert.match(polished.closing, /스스로 알게 되었다는 점입니다/);
  });

  it("does NOT damage a closing paragraph with no cheer/wishing ending at all", () => {
    const raw = fixtureReport(
      "지금까지 살아오며 만들어온 방식과 본래 편한 방식 중 어느 하나만이 진짜 당신인 것은 아니에요. 중요한 건 앞으로 어떤 선택에서 어느 쪽을 더 사용할지 스스로 알아볼 수 있게 되었다는 점입니다.",
    );
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.equal(polished.closing.includes("스스로 알아볼 수 있게 되었다는 점입니다"), true);
    assert.ok(polished.closing.trim().length > 20, "legitimate recognition prose must survive intact");
  });

  it("never fully empties the closing field even if the entire sentence looks like a cheer variant", () => {
    const raw = fixtureReport("응원합니다.");
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.ok(polished.closing.trim().length > 0, "cleanClosingText must fall back to pre-clean text rather than return an empty string");
  });

  it("report stays schema-valid after the harder cheer-stripping pass", () => {
    const raw = fixtureReport(
      "이제는 두 가지 방식을 스스로 알아볼 수 있게 되었다는 점입니다. 늘 응원해요!",
    );
    assert.equal(isDeepEssenceStructuredReport(raw), true);
    const polished = polishDeepEssenceStructuredReport(raw, "ko-KR");
    assert.equal(isDeepEssenceStructuredReport(polished), true);
  });

  it("EN locale closing is untouched by the KO-only cheer regex (no regression to the EN path)", () => {
    const raw = fixtureReport("You've come to recognize both ways of being as fully yours.");
    const polished = polishDeepEssenceStructuredReport(raw, "en-US");
    assert.match(polished.closing, /recognize both ways of being/);
  });
});

// ── Source wiring — confirm the actual regex additions landed in the file ──

describe("Verification 5 (source wiring) — cheer/wishing detection is wired into cleanClosingText (renamed CHEER_FUNCTION_PATTERN + per-sentence scan during the Final Narrative Stabilization closing rework — same coverage, different mechanism: trailing-only .replace() -> truncate-then-filter, since most later violations found in fresh QA were mid-closing, not trailing)", () => {
  const src = fs.readFileSync("lib/report/polishDeepEssenceStructured.ts", "utf8");

  it("defines a cheer/wishing regex covering 응원해요/응원할게요/응원하겠습니다", () => {
    assert.match(src, /응원\(\?:합니다\|해요\|할게요\|하겠습니다\)/);
  });

  it("applies the cheer/wishing pattern as one of the per-sentence banned-function filters inside cleanClosingText", () => {
    assert.match(src, /BANNED_CLOSING_SENTENCE_PATTERNS = \[/);
    assert.match(src, /CHEER_FUNCTION_PATTERN,/);
    assert.match(src, /kept = sentences\.filter\(/);
  });

  it("the original Batch 5 prefix-anchored regex is preserved (not replaced, only supplemented)", () => {
    assert.match(
      src,
      /이러한\\s\*점들을\\s\*기억하며\|앞으로의\\s\*관계를\|과정에서\|앞으로의\\s\*여정에서도/,
    );
  });
});
